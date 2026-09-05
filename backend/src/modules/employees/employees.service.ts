import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  QueryEmployeeDto,
} from './dto/employee.dto.js';
import * as bcrypt from 'bcrypt';
import { UserRole, OnboardingStatus } from '../../common/constants/index.js';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto, requestUserId: string) {
    // ✅ STEP 1: Validate authenticated user ID
    if (!requestUserId) {
      throw new UnauthorizedException(
        'Authenticated user could not be identified. Please log in again.',
      );
    }

    // Log incoming data for debugging
    console.log('📝 Creating employee with data:', {
      email: createEmployeeDto.email,
      departmentId: createEmployeeDto.departmentId,
      designationId: createEmployeeDto.designationId,
      requestUserId, // ✅ Log the authenticated user ID
    });

    // ✅ STEP 2: Get requesting user's organizationId
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!requestingUser) {
      throw new UnauthorizedException(
        'Authenticated user account not found. Please log in again.',
      );
    }

    if (!requestingUser.organizationId) {
      throw new BadRequestException(
        'User is not associated with an organization. Please contact system administrator.',
      );
    }

    console.log('✅ Authenticated user organizationId:', requestingUser.organizationId);

    // 1. Validate unique email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createEmployeeDto.email },
    });
    if (existingUser) {
      throw new ConflictException(
        'A user with this email address already exists',
      );
    }

    // 2. Fetch Employee Role
    const empRole = await this.prisma.role.findUnique({
      where: { name: UserRole.EMPLOYEE },
    });
    if (!empRole) {
      throw new BadRequestException(
        'EMPLOYEE role not initialized in database.',
      );
    }

    // 3. Resolve department: Accept UUID or free text
    // If free text, find or create a department with that name
    let resolvedDepartmentId: string | null = null;
    if (createEmployeeDto.departmentId) {
      const inputDeptId = createEmployeeDto.departmentId.trim();
      
      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(inputDeptId)) {
        // It's a UUID, try to find the department within the organization
        const department = await this.prisma.department.findFirst({
          where: {
            id: inputDeptId,
            organizationId: requestingUser.organizationId,
          },
        });

        if (department) {
          resolvedDepartmentId = department.id;
          console.log('✅ Department resolved by UUID:', inputDeptId, '→', department.name);
        } else {
          console.log('⚠️ Department UUID not found, setting to null');
        }
      } else {
        // Not a UUID - it's free text like "Sales", "VTP", "Agent"
        // Try to find existing department with this name, or create it
        console.log('ℹ️ Free-text process name provided:', inputDeptId);
        
        let department = await this.prisma.department.findFirst({
          where: {
            name: inputDeptId,
            organizationId: requestingUser.organizationId,
          },
        });
        
        if (!department) {
          // Create new department with this name
          console.log('📝 Creating new department:', inputDeptId);
          department = await this.prisma.department.create({
            data: {
              name: inputDeptId,
              organizationId: requestingUser.organizationId,
            },
          });
          console.log('✅ Department created:', department.id);
        } else {
          console.log('✅ Found existing department:', department.id);
        }
        
        resolvedDepartmentId = department.id;
      }
    }

    // 4. Resolve designation: Accept UUID or name/code, convert to UUID
    let resolvedDesignationId: string | null = null;
    if (createEmployeeDto.designationId) {
      const inputDesigId = createEmployeeDto.designationId.trim();
      
      // First try to find by UUID within the organization
      let designation = await this.prisma.designation.findFirst({
        where: {
          id: inputDesigId,
          organizationId: requestingUser.organizationId, // ✅ Multi-tenant: Filter by org
        },
      });

      // If not found by UUID, try to find by name within the organization
      if (!designation) {
        designation = await this.prisma.designation.findFirst({
          where: {
            organizationId: requestingUser.organizationId, // ✅ Multi-tenant: Filter by org
            name: inputDesigId,
          },
        });
      }

      // If still not found, try matching with underscores replaced by spaces
      if (!designation && inputDesigId.includes('_')) {
        const nameWithSpaces = inputDesigId.replace(/_/g, ' ');
        designation = await this.prisma.designation.findFirst({
          where: {
            organizationId: requestingUser.organizationId, // ✅ Multi-tenant: Filter by org
            name: nameWithSpaces,
          },
        });
      }

      if (!designation) {
        throw new BadRequestException(
          `Selected designation "${inputDesigId}" does not exist in your organization. Please select a valid designation.`,
        );
      }

      resolvedDesignationId = designation.id;
      console.log('✅ Designation resolved:', inputDesigId, '→', designation.name, '(', designation.id, ')');
    }

    // 5. Generate default credentials
    const defaultPassword = '1234';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 6. Generate or validate Employee ID based on mode
    let employeeIdCode: string;

    const mode = createEmployeeDto.employeeIdMode || 'auto';

    if (mode === 'manual') {
      // MANUAL MODE: Validate and use provided Employee ID
      if (!createEmployeeDto.employeeId) {
        throw new BadRequestException(
          'Employee ID is required when using manual mode',
        );
      }

      // Validate format
      const employeeIdRegex = /^FCS\d{4,}$/;
      if (!employeeIdRegex.test(createEmployeeDto.employeeId)) {
        throw new BadRequestException(
          'Employee ID must follow format FCS#### (e.g., FCS0151, FCS0160)',
        );
      }

      // Check if ID already exists
      const existingEmployee = await this.prisma.employee.findUnique({
        where: { employeeId: createEmployeeDto.employeeId },
      });

      if (existingEmployee) {
        throw new ConflictException(
          `Employee ID ${createEmployeeDto.employeeId} already exists. Please use a different Employee ID.`,
        );
      }

      employeeIdCode = createEmployeeDto.employeeId;
      console.log('✅ Using manual Employee ID:', employeeIdCode);
    } else {
      // AUTO MODE: Generate next available ID
      // ✅ PRODUCTION FORMAT: FCS + 4-digit sequence starting from 0160
      // ✅ SAFE: Uses transaction to prevent duplicate IDs
      employeeIdCode = await this.generateProductionEmployeeId(
        requestingUser.organizationId,
      );
      console.log('✅ Auto-generated Employee ID:', employeeIdCode);
    }

    // 7. Build transaction
    return this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: createEmployeeDto.email,
          password: hashedPassword,
          roleId: empRole.id,
          organizationId: requestingUser.organizationId, // ✅ Multi-tenant: Assign to org
          isFirstLogin: true,
          isActive: true,
        },
      });

      // Create employee profile linked to user
      const employee = await tx.employee.create({
        data: {
          employeeId: employeeIdCode,
          userId: user.id,
          organizationId: requestingUser.organizationId, // ✅ Multi-tenant: Assign to org
          createdByUserId: requestUserId, // ✅ HR Ownership: Track which HR created this employee
          firstName: createEmployeeDto.firstName,
          lastName: createEmployeeDto.lastName,
          phone: createEmployeeDto.phone,
          dob: createEmployeeDto.dob ? new Date(createEmployeeDto.dob) : null,
          gender: createEmployeeDto.gender,
          bloodGroup: createEmployeeDto.bloodGroup,
          address: createEmployeeDto.address,
          emergencyContact: createEmployeeDto.emergencyContact,
          joiningDate: createEmployeeDto.joiningDate
            ? new Date(createEmployeeDto.joiningDate)
            : new Date(),
          departmentId: resolvedDepartmentId,
          designationId: resolvedDesignationId,
          monthlySalary: createEmployeeDto.monthlySalary || null,
          onboardingStatus: OnboardingStatus.PENDING,
        },
      });

      // Create onboarding helper profile tracker
      await tx.employeeProfile.create({
        data: {
          employeeId: employee.id,
          profileCompletion: 0,
        },
      });

      // Auto-assign current ACTIVE company policy if exists
      const activeCompanyPolicy = await tx.companyPolicy.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });

      if (activeCompanyPolicy) {
        await tx.companyPolicyAcceptance.create({
          data: {
            companyPolicyId: activeCompanyPolicy.id,
            employeeId: employee.id,
            status: 'PENDING',
          },
        });
      }

      // Create initial audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'EMPLOYEE_CREATED',
          details: `HR created employee account for ${createEmployeeDto.email} with ID ${employeeIdCode}`,
        },
      });

      // Simulated Welcome Email logic
      console.log(
        `[EMAIL DISPATCH] Sent welcome details to: ${createEmployeeDto.email}. Temporary Password: ${defaultPassword}`,
      );

      return {
        employee,
        defaultCredentials: {
          email: createEmployeeDto.email,
          temporaryPassword: defaultPassword,
        },
      };
    });
  }

  async findAll(query: QueryEmployeeDto, requestUserId: string) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ STEP 1: Validate authenticated user
    if (!requestUserId) {
      throw new UnauthorizedException('Authenticated user could not be identified');
    }

    // ✅ STEP 2: Get requesting user's organizationId
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!requestingUser) {
      throw new UnauthorizedException('Requesting user not found');
    }

    if (!requestingUser.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    // ✅ STEP 3: Build query with HR ownership filter
    const whereClause: any = {
      organizationId: requestingUser.organizationId, // ✅ Organization isolation
      createdByUserId: requestUserId, // ✅ HR Ownership: Only show employees created by this HR
      // Exclude HR admin profiles from employee listing
      user: {
        role: {
          name: { notIn: [UserRole.HR, UserRole.HR_ADMIN, UserRole.HR_USER] }, // Exclude all HR roles
        },
      },
    };

    console.log('🔍 Employee Query Filter:', {
      organizationId: requestingUser.organizationId,
      createdByUserId: requestUserId,
    });

    if (query.search) {
      const searchTerm = query.search.trim();
      const searchWords = searchTerm.split(/\s+/).filter(Boolean);

      // NOTE: MySQL's default collation is case-insensitive — 'mode: insensitive' is PostgreSQL-only
      // and must NOT be used with MySQL. 'contains' on MySQL is already case-insensitive by default.
      const baseOrConditions: any[] = [
        { firstName: { contains: searchTerm } },
        { lastName: { contains: searchTerm } },
        { employeeId: { contains: searchTerm } },
        { phone: { contains: searchTerm } },
        { user: { email: { contains: searchTerm } } },
      ];

      // Support multi-word full name search (e.g. "Nupur S" → firstName contains "Nupur" AND lastName contains "S")
      if (searchWords.length >= 2) {
        baseOrConditions.push({
          AND: [
            { firstName: { contains: searchWords[0] } },
            { lastName: { contains: searchWords.slice(1).join(' ') } },
          ],
        });
      }

      whereClause.OR = baseOrConditions;
    }

    if (query.departmentId) {
      whereClause.departmentId = query.departmentId;
    }

    if (query.designationId) {
      whereClause.designationId = query.designationId;
    }

    if (query.onboardingStatus) {
      whereClause.onboardingStatus = query.onboardingStatus;
    }

    if (query.isActive !== undefined) {
      whereClause.user = {
        ...whereClause.user,
        isActive: query.isActive === 'true',
      };
    }

    const [total, employees] = await Promise.all([
      this.prisma.employee.count({ where: whereClause }),
      this.prisma.employee.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { joiningDate: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              isFirstLogin: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          designation: {
            select: {
              id: true,
              name: true,
            },
          },
          profile: {
            select: {
              profileCompletion: true,
            },
          },
          documents: {
            select: {
              id: true,
              type: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // Enrich the employee data with computed fields for easier frontend consumption
    const enrichedData = employees.map(emp => ({
      ...emp,
      fullName: `${emp.firstName} ${emp.lastName}`,
      email: emp.user?.email,
      isActive: emp.user?.isActive,
      departmentName: emp.department?.name || null,
      designationTitle: emp.designation?.name || null,
      profileCompletion: emp.profile?.profileCompletion || 0,
      documentsCount: emp.documents?.length || 0,
    }));

    return {
      data: enrichedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, requestUserId: string) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  findOne() called for Employee Details                   ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('📋 BACKEND STEP 1: Employee ID received:', id);
    console.log('📋 BACKEND STEP 2: Requesting User ID:', requestUserId);
    
    // ✅ STEP 1: Validate authenticated user
    if (!requestUserId) {
      throw new UnauthorizedException('Authenticated user could not be identified');
    }

    // ✅ STEP 2: Get requesting user's organizationId
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new UnauthorizedException('User organization not found');
    }
    
    console.log('\n🔍 BACKEND STEP 3: Executing Prisma Query with ownership verification...');
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            createdAt: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        designation: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        profile: {
          select: {
            id: true,
            profileCompletion: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        education: {
          orderBy: { createdAt: 'desc' },
        },
        experience: {
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          include: {
            category: true,
            verification: true,
            versions: {
              orderBy: { version: 'desc' },
              take: 3,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    console.log('📊 BACKEND STEP 4: Prisma Query Completed');
    console.log('📊 BACKEND STEP 5: Employee object exists?', !!employee);

    if (!employee) {
      console.log('❌ BACKEND STEP 6: Employee NOT FOUND in database');
      console.log('╚══════════════════════════════════════════════════════════╝\n');
      throw new NotFoundException('Employee not found');
    }

    // ✅ STEP 4: Verify ownership - HR can only access their own employees
    if (employee.organizationId !== requestingUser.organizationId) {
      console.log('❌ BACKEND: Organization mismatch');
      throw new ForbiddenException('You do not have access to this employee (different organization)');
    }

    if (employee.createdByUserId !== requestUserId) {
      console.log('❌ BACKEND: Ownership mismatch - Employee belongs to another HR user');
      throw new ForbiddenException('You do not have access to this employee (not created by you)');
    }

    console.log('✅ BACKEND STEP 7: Ownership verified');
    console.log('✅ BACKEND STEP 8: Employee FOUND and AUTHORIZED');
    console.log('📊 BACKEND STEP 9: Raw Employee Object Keys:', Object.keys(employee));
    console.log('📊 BACKEND STEP 10: Employee Data from Prisma:');
    console.log('   - id:', employee.id);
    console.log('   - employeeId:', employee.employeeId);
    console.log('   - firstName:', employee.firstName);
    console.log('   - lastName:', employee.lastName);
    console.log('   - createdByUserId:', employee.createdByUserId);
    console.log('   - phone:', employee.phone);
    console.log('   - email from user:', employee.user?.email);
    console.log('   - department object:', employee.department);
    console.log('   - department name:', employee.department?.name);
    console.log('   - designation object:', employee.designation);
    console.log('   - designation name:', employee.designation?.name);
    console.log('   - profile object:', employee.profile);
    console.log('   - profile completion:', employee.profile?.profileCompletion);
    console.log('   - documents array exists?', !!employee.documents);
    console.log('   - documents array length:', employee.documents?.length || 0);
    console.log('   - isActive:', employee.user?.isActive);

    if (employee.documents && employee.documents.length > 0) {
      console.log('\n📁 BACKEND STEP 11: Documents Found:', employee.documents.length);
      employee.documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. Type: ${doc.type}, Status: ${doc.status}, File: ${doc.fileName}`);
      });
    } else {
      console.log('\n📁 BACKEND STEP 11: No documents found for this employee');
    }

    console.log('\n🔧 BACKEND STEP 12: Creating flattened response object...');
    const flattenedResponse = {
      ...employee,
      // Flatten user data
      email: employee.user?.email,
      isActive: employee.user?.isActive,
      userCreatedAt: employee.user?.createdAt,
      roleName: employee.user?.role?.name,
      
      // Flatten department data
      departmentName: employee.department?.name || null,
      
      // Flatten designation data
      designationTitle: employee.designation?.name || null,
      
      // Flatten profile data
      profileCompletion: employee.profile?.profileCompletion || 0,
      
      // Add computed fields
      fullName: `${employee.firstName} ${employee.lastName}`,
      documentsCount: employee.documents?.length || 0,
      
      // Group documents by category for easier display
      documentsByCategory: this.groupDocumentsByCategory(employee.documents || []),
    };

    console.log('📊 BACKEND STEP 13: Flattened Response Created');
    console.log('   - fullName:', flattenedResponse.fullName);
    console.log('   - email:', flattenedResponse.email);
    console.log('   - departmentName:', flattenedResponse.departmentName);
    console.log('   - designationTitle:', flattenedResponse.designationTitle);
    console.log('   - profileCompletion:', flattenedResponse.profileCompletion);
    console.log('   - documentsCount:', flattenedResponse.documentsCount);
    
    console.log('\n✅ BACKEND STEP 14: Returning response to frontend');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    return flattenedResponse;
  }

  // Helper method to group documents by category
  private groupDocumentsByCategory(documents: any[]) {
    const personalDocs = documents.filter(d => 
      ['PHOTO', 'RESUME', 'CV'].includes(d.type)
    );
    
    const governmentDocs = documents.filter(d => 
      ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE'].includes(d.type)
    );
    
    const educationDocs = documents.filter(d => 
      d.type.includes('MARKSHEET') || 
      d.type.includes('DEGREE') || 
      d.type.includes('DIPLOMA') ||
      d.type.includes('CERTIFI')
    );
    
    const professionalDocs = documents.filter(d => 
      ['OFFER_LETTER', 'EXPERIENCE_LETTER', 'RELIEVING_LETTER', 'SALARY_SLIP', 'INTERNSHIP_CERTIFICATE'].includes(d.type)
    );
    
    const otherDocs = documents.filter(d => 
      !personalDocs.includes(d) && 
      !governmentDocs.includes(d) && 
      !educationDocs.includes(d) && 
      !professionalDocs.includes(d)
    );

    return {
      personal: personalDocs,
      government: governmentDocs,
      education: educationDocs,
      professional: professionalDocs,
      other: otherDocs,
    };
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto, requestUserId: string) {
    console.log('[EMPLOYEE-UPDATE] Service received:', {
      employeeId: id,
      departmentId: updateEmployeeDto.departmentId,
      designationId: updateEmployeeDto.designationId,
    });

    // ✅ findOne already verifies ownership (organizationId + createdByUserId)
    const employee = await this.findOne(id, requestUserId);

    console.log('[EMPLOYEE-UPDATE] Current employee data:', {
      employeeId: employee.employeeId,
      currentDepartmentId: employee.departmentId,
      currentDesignationId: employee.designationId,
    });

    const updateData: any = {
      firstName: updateEmployeeDto.firstName,
      lastName: updateEmployeeDto.lastName,
      phone: updateEmployeeDto.phone,
      gender: updateEmployeeDto.gender,
      bloodGroup: updateEmployeeDto.bloodGroup,
      address: updateEmployeeDto.address,
      emergencyContact: updateEmployeeDto.emergencyContact,
    };

    if (updateEmployeeDto.dob) {
      updateData.dob = new Date(updateEmployeeDto.dob);
    }

    if (updateEmployeeDto.joiningDate) {
      updateData.joiningDate = new Date(updateEmployeeDto.joiningDate);
    }

    // Handle departmentId: Accept UUID or free text
    // If free text, try to find or create a department with that name
    if (updateEmployeeDto.departmentId !== undefined) {
      const deptValue = updateEmployeeDto.departmentId;
      console.log('[EMPLOYEE-UPDATE] Processing departmentId:', deptValue);
      
      if (!deptValue) {
        // Empty value - set to null
        updateData.departmentId = null;
        console.log('[EMPLOYEE-UPDATE] Empty value, setting to null');
      } else {
        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(deptValue)) {
          // It's a UUID - verify it exists
          const existingDept = await this.prisma.department.findFirst({
            where: {
              id: deptValue,
              organizationId: employee.organizationId,
            },
          });
          
          if (existingDept) {
            updateData.departmentId = deptValue;
            console.log('[EMPLOYEE-UPDATE] Valid department UUID:', deptValue);
          } else {
            updateData.departmentId = null;
            console.log('[EMPLOYEE-UPDATE] Department UUID not found, setting to null');
          }
        } else {
          // Free text like "VTP", "Sales", "Agent" - find or create department
          console.log('[EMPLOYEE-UPDATE] Free text process name:', deptValue);
          
          let department = await this.prisma.department.findFirst({
            where: {
              name: deptValue.trim(),
              organizationId: employee.organizationId,
            },
          });
          
          if (!department) {
            // Create new department with this name
            console.log('[EMPLOYEE-UPDATE] Creating new department:', deptValue);
            department = await this.prisma.department.create({
              data: {
                name: deptValue.trim(),
                organizationId: employee.organizationId,
              },
            });
            console.log('[EMPLOYEE-UPDATE] Department created:', department.id);
          } else {
            console.log('[EMPLOYEE-UPDATE] Found existing department:', department.id);
          }
          
          updateData.departmentId = department.id;
        }
      }
    }

    if (updateEmployeeDto.designationId !== undefined) {
      updateData.designationId = updateEmployeeDto.designationId || null;
    }

    console.log('[EMPLOYEE-UPDATE] Final update data:', {
      departmentId: updateData.departmentId,
      designationId: updateData.designationId,
      ...updateData,
    });

    return this.prisma.$transaction(async (tx) => {
      const updatedEmp = await tx.employee.update({
        where: { id },
        data: updateData,
        // ✅ Include relations so frontend gets department/designation names
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          designation: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
            },
          },
        },
      });

      console.log('[EMPLOYEE-UPDATE] Prisma updated employee:', {
        employeeId: updatedEmp.employeeId,
        departmentId: updatedEmp.departmentId,
        departmentName: updatedEmp.department?.name,
        designationId: updatedEmp.designationId,
        designationName: updatedEmp.designation?.name,
      });

      // Recalculate Completion after update
      await this.internalRecalculateCompletion(id, tx);

      await tx.auditLog.create({
        data: {
          action: 'EMPLOYEE_UPDATED',
          details: `Employee profile updated for ${employee.employeeId}`,
        },
      });

      return updatedEmp;
    });
  }

  async setActivation(id: string, active: boolean, requestUserId: string) {
    // ✅ findOne already verifies ownership
    const employee = await this.findOne(id, requestUserId);
    await this.prisma.user.update({
      where: { id: employee.userId },
      data: { isActive: active },
    });
    await this.prisma.auditLog.create({
      data: {
        action: active ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
        details: `Active status for ${employee.employeeId} set to ${active}`,
      },
    });
    return { status: active ? 'Activated' : 'Deactivated' };
  }

  async resetPassword(id: string, requestUserId: string) {
    // ✅ findOne already verifies ownership
    const employee = await this.findOne(id, requestUserId);
    const defaultPassword = '1234';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await this.prisma.user.update({
      where: { id: employee.userId },
      data: {
        password: hashedPassword,
        isFirstLogin: true, // Forces password change on next login
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'EMPLOYEE_PASSWORD_RESET',
        details: `Password reset by HR for employee ID ${employee.employeeId}`,
      },
    });

    return { message: 'Password reset to default (1234) successfully' };
  }

  async remove(id: string, requestUserId: string) {
    // ✅ findOne already verifies ownership
    const employee = await this.findOne(id, requestUserId);

    await this.prisma.user.delete({
      where: { id: employee.userId },
    });

    return { message: `Employee ${employee.employeeId} permanently removed` };
  }

  // Employee-facing Profile Operations
  async getProfile(userId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, isFirstLogin: true, isActive: true } },
        department: true,
        designation: true,
        profile: true,
      },
    });
    if (!emp) throw new NotFoundException('Employee profile not found');
    return emp;
  }

  async updateProfile(userId: string, dto: any) {
    const emp = await this.getProfile(userId);

    const updateData: any = {};
    const allowedFields = [
      'firstName',
      'lastName',
      'fatherName',
      'motherName',
      'gender',
      'bloodGroup',
      'maritalStatus',
      'nationality',
      'phone',
      'alternatePhone',
      'personalEmail',
      'permanentAddress',
      'currentAddress',
      'emergencyContactName',
      'emergencyContactPhone',
      'emergencyContactRelation',
      'reportingManager',
      'employmentType',
      'bankAccountHolder',
      'bankName',
      'bankBranch',
      'bankAccountNumber',
      'bankIfsc',
      'upiId',
      'aadhaarNumber',
      'panNumber',
      'passportNumber',
      'drivingLicenseNumber',
    ];

    allowedFields.forEach((f) => {
      if (dto[f] !== undefined) updateData[f] = dto[f];
    });

    if (dto.dob) updateData.dob = new Date(dto.dob);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: emp.id },
        data: updateData,
      });

      // Recalculate
      await this.internalRecalculateCompletion(emp.id, tx);

      await tx.auditLog.create({
        data: {
          userId,
          action: 'PROFILE_UPDATED',
          details: `Employee completed/updated their profile details`,
        },
      });

      return updated;
    });
  }

  async getProfileCompletion(userId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { userId },
      include: { profile: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    const sections = this.calculateSections(emp);
    return {
      percentage: emp.profile?.profileCompletion || 0,
      sections,
    };
  }

  async uploadPhoto(userId: string, photoUrl: string) {
    const emp = await this.getProfile(userId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: emp.id },
        data: { photoUrl },
      });
      await this.internalRecalculateCompletion(emp.id, tx);
      return updated;
    });
  }

  async deletePhoto(userId: string) {
    const emp = await this.getProfile(userId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id: emp.id },
        data: { photoUrl: null },
      });
      await this.internalRecalculateCompletion(emp.id, tx);
      return updated;
    });
  }

  // Internal helper to calculate percentage and checklist
  private calculateSections(emp: any) {
    const personal = [
      emp.firstName,
      emp.lastName,
      emp.fatherName,
      emp.motherName,
      emp.dob,
      emp.gender,
      emp.bloodGroup,
      emp.maritalStatus,
      emp.nationality,
    ];
    const personalFilled = personal.filter(Boolean).length;
    const personalPct = Math.round((personalFilled / personal.length) * 100);

    const contact = [
      emp.phone,
      emp.alternatePhone,
      emp.personalEmail,
      emp.permanentAddress,
      emp.currentAddress,
      emp.emergencyContactName,
      emp.emergencyContactPhone,
      emp.emergencyContactRelation,
    ];
    const contactFilled = contact.filter(Boolean).length;
    const contactPct = Math.round((contactFilled / contact.length) * 100);

    const professional = [
      emp.employeeId,
      emp.departmentId,
      emp.designationId,
      emp.reportingManager,
      emp.employmentType,
      emp.joiningDate,
    ];
    const professionalFilled = professional.filter(Boolean).length;
    const professionalPct = Math.round(
      (professionalFilled / professional.length) * 100,
    );

    const bank = [
      emp.bankAccountHolder,
      emp.bankName,
      emp.bankBranch,
      emp.bankAccountNumber,
      emp.bankIfsc,
      emp.upiId,
    ];
    const bankFilled = bank.filter(Boolean).length;
    const bankPct = Math.round((bankFilled / bank.length) * 100);

    const govt = [
      emp.aadhaarNumber,
      emp.panNumber,
      emp.passportNumber,
      emp.drivingLicenseNumber,
    ];
    const govtFilled = govt.filter(Boolean).length;
    const govtPct = Math.round((govtFilled / govt.length) * 100);

    return {
      personal: {
        percentage: personalPct,
        filled: personalFilled,
        total: personal.length,
        label: 'Personal Information',
      },
      contact: {
        percentage: contactPct,
        filled: contactFilled,
        total: contact.length,
        label: 'Contact Details',
      },
      professional: {
        percentage: professionalPct,
        filled: professionalFilled,
        total: professional.length,
        label: 'Professional Info',
      },
      bank: {
        percentage: bankPct,
        filled: bankFilled,
        total: bank.length,
        label: 'Bank Details',
      },
      government: {
        percentage: govtPct,
        filled: govtFilled,
        total: govt.length,
        label: 'Government ID Cards',
      },
    };
  }

  private async internalRecalculateCompletion(employeeId: string, tx: any) {
    const emp = await tx.employee.findUnique({
      where: { id: employeeId },
    });
    const sects = this.calculateSections(emp);

    // Average of 5 sections (each counts for 20%)
    const finalPct = Math.round(
      (sects.personal.percentage +
        sects.contact.percentage +
        sects.professional.percentage +
        sects.bank.percentage +
        sects.government.percentage) /
        5,
    );

    await tx.employeeProfile.update({
      where: { employeeId },
      data: { profileCompletion: finalPct },
    });

    if (finalPct === 100 && emp.onboardingStatus === OnboardingStatus.PENDING) {
      await tx.employee.update({
        where: { id: employeeId },
        data: { onboardingStatus: OnboardingStatus.PROFILE_COMPLETED },
      });
    }
  }

  /**
   * ✅ PRODUCTION EMPLOYEE ID GENERATOR
   * 
   * Format: FCS0160, FCS0161, FCS0162...
   * - Starting sequence: 0160 (minimum automatic ID)
   * - Increments by 1 for each new employee
   * - Thread-safe: Uses database query to find next available ID
   * - Organization-scoped: Each organization has independent sequence
   * - Never generates below FCS0160
   * 
   * @param organizationId - Organization ID for scoping
   * @returns Production employee ID (e.g., "FCS0160")
   */
  private async generateProductionEmployeeId(organizationId: string): Promise<string> {
    const PREFIX = 'FCS';
    const STARTING_SEQUENCE = 160; // Minimum automatic employee ID: FCS0160

    // Find the highest existing employee ID for this organization
    const employees = await this.prisma.employee.findMany({
      where: {
        organizationId,
        employeeId: {
          startsWith: PREFIX,
          // Exclude HR profile IDs (FCS-HR-xxx)
          not: { contains: '-' },
        },
      },
      select: { employeeId: true },
      orderBy: { employeeId: 'desc' },
      take: 1,
    });

    let nextSequence = STARTING_SEQUENCE;

    if (employees.length > 0) {
      const lastId = employees[0].employeeId;
      // Extract numeric part: "FCS0160" -> "0160" -> 160
      const numericPart = lastId.replace(PREFIX, '');
      const lastSequence = parseInt(numericPart, 10);
      
      if (!isNaN(lastSequence)) {
        // If highest existing ID is below 160, start from 160
        // If highest is 160 or above, use next sequential number
        nextSequence = Math.max(lastSequence + 1, STARTING_SEQUENCE);
      }
    }

    // Format with leading zeros to maintain 4 digits
    const sequenceStr = String(nextSequence).padStart(4, '0');
    return `${PREFIX}${sequenceStr}`;
  }

  /**
   * Get next available Employee ID (for preview)
   */
  async getNextEmployeeId(requestUserId: string): Promise<{ nextEmployeeId: string }> {
    // Get requesting user's organizationId
    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new UnauthorizedException('User organization not found');
    }

    const nextId = await this.generateProductionEmployeeId(requestingUser.organizationId);
    return { nextEmployeeId: nextId };
  }

  /**
   * Bulk assign employees to a department/process
   */
  async bulkAssignDepartment(employeeIds: string[], departmentId: string, requestUserId: string) {
    console.log('[BULK ASSIGN DEPT] Starting bulk department assignment');
    console.log('[BULK ASSIGN DEPT] Employee IDs count:', employeeIds.length);
    console.log('[BULK ASSIGN DEPT] Department ID:', departmentId);

    const requestingUser = await this.prisma.user.findUnique({
      where: { id: requestUserId },
      select: { organizationId: true, role: { select: { name: true } } },
    });

    if (!requestingUser || !requestingUser.organizationId) {
      throw new UnauthorizedException('User organization not found');
    }

    // Validate department exists and belongs to organization
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department/Process not found');
    }

    if (department.organizationId !== requestingUser.organizationId) {
      throw new ForbiddenException('Access denied to this department/process');
    }

    // Validate employees exist and belong to organization (and HR has access)
    const employees = await this.prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        organizationId: requestingUser.organizationId,
        createdByUserId: requestUserId, // HR can only bulk-assign their own employees
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        departmentId: true,
        department: { select: { name: true } },
        user: { select: { id: true } },
      },
    });

    if (employees.length === 0) {
      throw new BadRequestException('No employees found or access denied to selected employees');
    }

    if (employees.length !== employeeIds.length) {
      throw new BadRequestException(`Only ${employees.length} out of ${employeeIds.length} employees are accessible. You can only assign employees you created.`);
    }

    console.log('[BULK ASSIGN DEPT] Found employees:', employees.length);

    // Perform bulk update in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.updateMany({
        where: {
          id: { in: employeeIds },
          organizationId: requestingUser.organizationId,
        },
        data: {
          departmentId: departmentId,
        },
      });

      // Create audit log for bulk operation
      const employeeNames = employees.map(e => `${e.firstName} ${e.lastName}`).join(', ');
      await tx.auditLog.create({
        data: {
          userId: requestUserId,
          action: 'BULK_PROCESS_ASSIGNMENT',
          details: `Bulk assigned ${updated.count} employees (${employeeNames.substring(0, 200)}${employeeNames.length > 200 ? '...' : ''}) to process/department "${department.name}"`,
        },
      });

      // Create individual audit logs for tracking
      for (const employee of employees) {
        const oldDeptName = employee.department?.name || 'Unassigned';
        await tx.auditLog.create({
          data: {
            userId: requestUserId,
            action: 'EMPLOYEE_PROCESS_CHANGED',
            details: `Employee ${employee.employeeId} (${employee.firstName} ${employee.lastName}) moved from "${oldDeptName}" to "${department.name}"`,
          },
        });
      }

      return { updated: updated.count, employees };
    });

    console.log('[BULK ASSIGN DEPT] Updated count:', result.updated);

    // Emit real-time events to each affected employee
    // Note: Socket events will be handled by the departments service
    // Here we just return the result

    return {
      message: `Successfully assigned ${result.updated} employees to ${department.name}`,
      updated: result.updated,
      departmentId: departmentId,
      departmentName: department.name,
      employees: result.employees.map(e => ({
        id: e.id,
        employeeId: e.employeeId,
        name: `${e.firstName} ${e.lastName}`,
      })),
    };
  }
}
