import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 FCS HRMS — Starting database seeder (Multi-Tenant SaaS)...\n');

  // ─────────────────────────────────────────────────────
  // 0. CREATE DEFAULT ORGANIZATION
  // ─────────────────────────────────────────────────────
  const defaultOrg = await prisma.organization.upsert({
    where: { code: 'ORG-DEFAULT' },
    update: {},
    create: {
      name: 'Default Organization',
      code: 'ORG-DEFAULT',
      email: 'default@fcscorp.com',
      phone: '1234567890',
      address: 'Default Address',
      isActive: true,
    },
  });

  console.log('✔ Default Organization created:', defaultOrg.name, '(', defaultOrg.code, ')');

  // ─────────────────────────────────────────────────────
  // 1. SEED ROLES
  // ─────────────────────────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      displayName: 'Super Administrator',
      description: 'System Super Administrator with full access',
      level: 100,
      isSystem: true,
      isActive: true,
    },
  });

  const hrAdminRole = await prisma.role.upsert({
    where: { name: 'HR_ADMIN' },
    update: {},
    create: {
      name: 'HR_ADMIN',
      displayName: 'HR Administrator',
      description: 'HR Administrator with full HR management access',
      level: 80,
      isSystem: true,
      isActive: true,
    },
  });

  const hrUserRole = await prisma.role.upsert({
    where: { name: 'HR_USER' },
    update: {},
    create: {
      name: 'HR_USER',
      displayName: 'HR User',
      description: 'HR User with operational access',
      level: 60,
      isSystem: true,
      isActive: true,
    },
  });

  // Legacy HR role for backward compatibility
  const hrRole = await prisma.role.upsert({
    where: { name: 'HR' },
    update: {},
    create: {
      name: 'HR',
      displayName: 'HR (Legacy)',
      description: 'Legacy HR role - maps to HR_USER',
      level: 60,
      isSystem: true,
      isActive: true,
    },
  });

  const empRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      displayName: 'Employee',
      description: 'Standard Company Employee',
      level: 10,
      isSystem: true,
      isActive: true,
    },
  });

  console.log('✔ Roles seeded:', superAdminRole.name, '|', hrAdminRole.name, '|', hrUserRole.name, '|', hrRole.name, '|', empRole.name);

  // ─────────────────────────────────────────────────────
  // 2. SEED DEPARTMENTS (Org-scoped)
  // ─────────────────────────────────────────────────────
  const deptAdministration = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Administration' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Administration',
      description: 'Core Executive & Administrative Operations',
    },
  });

  await prisma.department.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Manager' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Manager',
      description: 'Management Department',
    },
  });

  await prisma.department.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'IT' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'IT',
      description: 'Information Technology & Software Engineering',
    },
  });

  await prisma.department.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Agent' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Agent',
      description: 'Agent Department',
    },
  });

  await prisma.department.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Engineering' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Engineering',
      description: 'Product & Tech Development',
    },
  });

  await prisma.department.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Human Resources' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Human Resources',
      description: 'People Operations & Talent Acquisition',
    },
  });

  await prisma.department.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Sales & Marketing' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Sales & Marketing',
      description: 'Business Growth & Marketing',
    },
  });

  console.log('✔ Departments seeded (Organization-scoped)');

  // ─────────────────────────────────────────────────────
  // 3. SEED DESIGNATIONS (Org-scoped)
  // ─────────────────────────────────────────────────────
  const desgHRManager = await prisma.designation.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'HR Manager' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'HR Manager',
      description: 'Department Head, HR',
    },
  });

  await prisma.designation.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Software Engineer' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Software Engineer',
      description: 'Individual Contributor, Engineering',
    },
  });

  await prisma.designation.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'IT Engineer' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'IT Engineer',
      description: 'Information Technology Engineer',
    },
  });

  await prisma.designation.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Software Developer' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Software Developer',
      description: 'Software Development Professional',
    },
  });

  await prisma.designation.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Agent' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Agent',
      description: 'Agent',
    },
  });

  await prisma.designation.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Sales Executive' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Sales Executive',
      description: 'Field Sales Operations',
    },
  });

  await prisma.designation.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Team Leader' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Team Leader',
      description: 'Team Leader',
    },
  });

  await prisma.designation.upsert({
    where: { organizationId_name: { organizationId: defaultOrg.id, name: 'Senior Manager' } },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Senior Manager',
      description: 'Senior Management Position',
    },
  });

  console.log('✔ Designations seeded (Organization-scoped)');

  // ─────────────────────────────────────────────────────
  // 4. PRODUCTION HR ADMIN ACCOUNTS (Multi-tenant ready)
  // ─────────────────────────────────────────────────────
  const hrAccounts = [
    {
      email: 'sumaiyyatamboli50@gmail.com',
      password: '123456789',
      code: 'FCS-HR-ADMIN-001',
      firstName: 'Sumaiyya',
      lastName: 'Tamboli',
      role: hrAdminRole,
    },
    {
      email: 'adityashastri76@gmail.com',
      password: '12345678',
      code: 'FCS-HR-001',
      firstName: 'Aditya',
      lastName: 'Shastri',
      role: hrAdminRole,
    },
  ];

  for (const hrAccount of hrAccounts) {
    const existingUser = await prisma.user.findUnique({ where: { email: hrAccount.email } });
    const existingEmp = await prisma.employee.findUnique({ where: { employeeId: hrAccount.code } });

    if (existingUser || existingEmp) {
      console.log(`✔ HR Account already exists — skipping: ${hrAccount.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(hrAccount.password, 10);

    const hrUser = await prisma.user.create({
      data: {
        email: hrAccount.email,
        password: hashedPassword,
        roleId: hrAccount.role.id,
        organizationId: defaultOrg.id, // ✅ Multi-tenant: Assign to default org
        isFirstLogin: false,
        isActive: true,
      },
    });

    await prisma.employee.create({
      data: {
        employeeId: hrAccount.code,
        userId: hrUser.id,
        organizationId: defaultOrg.id, // ✅ Multi-tenant: Assign to default org
        firstName: hrAccount.firstName,
        lastName: hrAccount.lastName,
        phone: '9876543220',
        departmentId: deptAdministration.id,
        designationId: desgHRManager.id,
        onboardingStatus: 'VERIFIED',
      },
    });

    await prisma.notificationPreference.create({ data: { userId: hrUser.id } });

    console.log(`✔ HR Admin created: ${hrAccount.email} / ${hrAccount.code} (${hrAccount.role.name})`);
  }

  // ─────────────────────────────────────────────────────
  // 5. SEED DEFAULT POLICIES (OPTIONAL)
  //    Uncomment if you want to pre-populate policy templates
  // ─────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────
  // 5. SEED DEFAULT POLICIES (OPTIONAL)
  //    Uncomment if you want to pre-populate policy templates
  // ─────────────────────────────────────────────────────
  /*
  const policiesList = [
    {
      title: 'Attendance Policy',
      policyNumber: 'POL-001',
      category: 'ATTENDANCE',
      content: `Standard working hours at FCS are 9:00 AM to 6:00 PM, Monday through Friday.
A grace period of 15 minutes is allowed.
Any arrival after 9:15 AM will be marked as late.
Three late arrivals in a month will result in a half-day salary deduction.`,
    },
    {
      title: 'Leave Policy',
      policyNumber: 'POL-002',
      category: 'LEAVE',
      content: `FCS provides 18 Paid Leaves (PL), 12 Casual/Sick Leaves (CL/SL) annually.
Leaves must be requested at least 48 hours in advance through the HR portal.
In case of emergency medical leave, notification should be sent before 10:00 AM on the day of absence.`,
    },
    {
      title: 'Code of Conduct',
      policyNumber: 'POL-003',
      category: 'CODE_OF_CONDUCT',
      content: `FCS holds all employees to the highest ethical and professional standards.
Discrimination, harassment, and workplace violence are strictly prohibited.
All professional communications should be clear, polite, and inclusive.`,
    },
    {
      title: 'Data Privacy Policy',
      policyNumber: 'POL-004',
      category: 'DATA_PRIVACY',
      content: `Employees must respect the privacy of customer, partner, and colleague personal data.
All handling of personal identifiable info (PII) must comply with corporate guidelines and local privacy regulations.`,
    },
    {
      title: 'POSH Policy',
      policyNumber: 'POL-005',
      category: 'POSH',
      content: `FCS is committed to providing a safe, secure, and respectful working environment for all employees.
Strict compliance with the Prevention of Sexual Harassment (POSH) act is mandatory.
Any misconduct will be addressed immediately by the Internal Complaints Committee (ICC).`,
    },
  ];

  for (const pol of policiesList) {
    await prisma.policy.upsert({
      where: { title: pol.title },
      update: {},
      create: {
        title: pol.title,
        policyNumber: pol.policyNumber,
        category: pol.category,
        content: pol.content,
        version: 1,
        status: 'PUBLISHED',
      },
    });
  }

  console.log('✔ Policies seeded');
  */

  // ─────────────────────────────────────────────────────
  // 6. SEED ATTENDANCE MODULE
  // ─────────────────────────────────────────────────────
  // COMMENTED OUT: attendance.seed.js file not found
  // const { seedAttendance } = await import('./seeds/attendance.seed.js');
  // await seedAttendance();

  console.log('\n✅ FCS HRMS seeding complete (Multi-Tenant SaaS MODE).\n');
  console.log('─────────────────────────────────────────────────────');
  console.log('  DEFAULT ORG    → Default Organization (ORG-DEFAULT)');
  console.log('  HR ADMIN 1     → sumaiyyatamboli50@gmail.com / 123456789');
  console.log('  HR ADMIN 2     → adityashastri76@gmail.com / 12345678');
  console.log('─────────────────────────────────────────────────────');
  console.log('  ⚠️  No demo employees created - production ready');
  console.log('  ✅  Multi-Tenant Architecture: Each HR can manage their own organization');
  console.log('─────────────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeder failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
