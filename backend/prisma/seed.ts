import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 FCS HRMS — Starting database seeder...\n');

  // ─────────────────────────────────────────────────────
  // 1. SEED ROLES
  // ─────────────────────────────────────────────────────
  const hrRole = await prisma.role.upsert({
    where: { name: 'HR' },
    update: {},
    create: {
      name: 'HR',
      description: 'Human Resource Management & Administrator',
    },
  });

  const empRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Standard Company Employee',
    },
  });

  console.log('✔ Roles seeded:', hrRole.name, '|', empRole.name);

  // ─────────────────────────────────────────────────────
  // 2. SEED DEPARTMENTS
  // ─────────────────────────────────────────────────────
  const deptAdministration = await prisma.department.upsert({
    where: { name: 'Administration' },
    update: {},
    create: { name: 'Administration', description: 'Core Executive & Administrative Operations' },
  });

  const deptManager = await prisma.department.upsert({
    where: { name: 'Manager' },
    update: {},
    create: { name: 'Manager', description: 'Management Department' },
  });

  const deptIT = await prisma.department.upsert({
    where: { name: 'IT' },
    update: {},
    create: { name: 'IT', description: 'Information Technology & Software Engineering' },
  });

  const deptAgent = await prisma.department.upsert({
    where: { name: 'Agent' },
    update: {},
    create: { name: 'Agent', description: 'Agent Department' },
  });

  await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering', description: 'Product & Tech Development' },
  });

  await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: { name: 'Human Resources', description: 'People Operations & Talent Acquisition' },
  });

  await prisma.department.upsert({
    where: { name: 'Sales & Marketing' },
    update: {},
    create: { name: 'Sales & Marketing', description: 'Business Growth & Marketing' },
  });

  console.log('✔ Departments seeded (Manager, IT, Agent, and others)');

  // ─────────────────────────────────────────────────────
  // 3. SEED DESIGNATIONS
  // ─────────────────────────────────────────────────────
  const desgHRManager = await prisma.designation.upsert({
    where: { name: 'HR Manager' },
    update: {},
    create: { name: 'HR Manager', description: 'Department Head, HR' },
  });

  const desgSoftwareEngineer = await prisma.designation.upsert({
    where: { name: 'Software Engineer' },
    update: {},
    create: { name: 'Software Engineer', description: 'Individual Contributor, Engineering' },
  });

  await prisma.designation.upsert({
    where: { name: 'IT Engineer' },
    update: {},
    create: { name: 'IT Engineer', description: 'Information Technology Engineer' },
  });

  await prisma.designation.upsert({
    where: { name: 'Software Developer' },
    update: {},
    create: { name: 'Software Developer', description: 'Software Development Professional' },
  });

  await prisma.designation.upsert({
    where: { name: 'Agent' },
    update: {},
    create: { name: 'Agent', description: 'Agent' },
  });

  await prisma.designation.upsert({
    where: { name: 'Sales Executive' },
    update: {},
    create: { name: 'Sales Executive', description: 'Field Sales Operations' },
  });

  await prisma.designation.upsert({
    where: { name: 'Team Leader' },
    update: {},
    create: { name: 'Team Leader', description: 'Team Leader' },
  });

  await prisma.designation.upsert({
    where: { name: 'Senior Manager' },
    update: {},
    create: { name: 'Senior Manager', description: 'Senior Management Position' },
  });

  console.log('✔ Designations seeded (HR Manager, IT Engineer, Agent, and others)');

  // ─────────────────────────────────────────────────────
  // 4. PRODUCTION HR ADMIN ACCOUNT
  //    Email : sumaiyyatamboli50@gmail.com
  //    Pass  : 123456789
  //    Role  : HR
  //    Code  : FCS-HR-001
  // ─────────────────────────────────────────────────────
  const hrEmail = 'sumaiyyatamboli50@gmail.com';
  const hrCode  = 'FCS-HR-001';

  const existingHRUser = await prisma.user.findUnique({ where: { email: hrEmail } });
  const existingHREmp  = await prisma.employee.findUnique({ where: { employeeId: hrCode } });

  if (existingHRUser || existingHREmp) {
    console.log('✔ Production HR Admin already exists — skipping');
  } else {
    const hashedHRPassword = await bcrypt.hash('123456789', 10);

    const hrUser = await prisma.user.create({
      data: {
        email: hrEmail,
        password: hashedHRPassword,
        roleId: hrRole.id,
        isFirstLogin: false,
        isActive: true,
      },
    });

    await prisma.employee.create({
      data: {
        employeeId: hrCode,
        userId: hrUser.id,
        firstName: 'Sumaiyya',
        lastName: 'Tamboli',
        phone: '9876543220',
        departmentId: deptAdministration.id,
        designationId: desgHRManager.id,
        onboardingStatus: 'VERIFIED',
      },
    });

    await prisma.notificationPreference.create({ data: { userId: hrUser.id } });

    console.log('✔ Production HR Admin created:', hrEmail, '/ FCS-HR-001');
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
  const { seedAttendance } = await import('./seeds/attendance.seed.js');
  await seedAttendance();

  console.log('\n✅ FCS HRMS seeding complete (PRODUCTION MODE).\n');
  console.log('─────────────────────────────────────────────────────');
  console.log('  PRODUCTION HR  → sumaiyyatamboli50@gmail.com / 123456789');
  console.log('─────────────────────────────────────────────────────');
  console.log('  ⚠️  No demo employees created - production ready');
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
