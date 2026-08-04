import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
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

  console.log('Roles seeded:', { hrRole, empRole });

  // 2. Default HR User
  const defaultHREmail = 'hr@fcs.com';
  const hashedHRPassword = await bcrypt.hash('hrpassword123', 10);
  const hrUser = await prisma.user.upsert({
    where: { email: defaultHREmail },
    update: {},
    create: {
      email: defaultHREmail,
      password: hashedHRPassword,
      roleId: hrRole.id,
      isFirstLogin: false,
      isActive: true,
    },
  });

  // Create HR Employee profile
  await prisma.employee.upsert({
    where: { userId: hrUser.id },
    update: {},
    create: {
      employeeId: 'FCS-ADMIN-01',
      userId: hrUser.id,
      firstName: 'FCS',
      lastName: 'HR Admin',
      phone: '1234567890',
      onboardingStatus: 'VERIFIED',
    },
  });

  console.log('Default HR Admin user created:', defaultHREmail);

  // 3. Departments
  const deptEngineering = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering', description: 'Product & Tech Development' },
  });

  const deptHR = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: { name: 'Human Resources', description: 'People Operations & Talent Acquisition' },
  });

  const deptSales = await prisma.department.upsert({
    where: { name: 'Sales & Marketing' },
    update: {},
    create: { name: 'Sales & Marketing', description: 'Business Growth & Marketing' },
  });

  console.log('Departments seeded');

  // 4. Designations
  const desSoftwareEngineer = await prisma.designation.upsert({
    where: { name: 'Software Engineer' },
    update: {},
    create: { name: 'Software Engineer', description: 'Individual Contributor, Engineering' },
  });

  const desHRManager = await prisma.designation.upsert({
    where: { name: 'HR Manager' },
    update: {},
    create: { name: 'HR Manager', description: 'Department Head, HR' },
  });

  const desSalesExec = await prisma.designation.upsert({
    where: { name: 'Sales Executive' },
    update: {},
    create: { name: 'Sales Executive', description: 'Field Sales Operations' },
  });

  console.log('Designations seeded');

  // 5. Default Policies
  const policiesList = [
    {
      title: 'Attendance Policy',
      type: 'ATTENDANCE',
      content: `Standard working hours at FCS are 9:00 AM to 6:00 PM, Monday through Friday. 
A grace period of 15 minutes is allowed. 
Any arrival after 9:15 AM will be marked as late. 
Three late arrivals in a month will result in a half-day salary deduction.`,
    },
    {
      title: 'Leave Policy',
      type: 'LEAVE',
      content: `FCS provides 18 Paid Leaves (PL), 12 Casual/Sick Leaves (CL/SL) annually. 
Leaves must be requested at least 48 hours in advance through the HR portal. 
In case of emergency medical leave, notification should be sent before 10:00 AM on the day of absence.`,
    },
    {
      title: 'Code of Conduct',
      type: 'CODE_OF_CONDUCT',
      content: `FCS holds all employees to the highest ethical and professional standards. 
Discrimination, harassment, and workplace violence are strictly prohibited. 
All professional communications should be clear, polite, and inclusive.`,
    },
    {
      title: 'Data Privacy Policy',
      type: 'DATA_PRIVACY',
      content: `Employees must respect the privacy of customer, partner, and colleague personal data. 
All handling of personal identifiable info (PII) must comply with corporate guidelines and local privacy regulations.`,
    },
    {
      title: 'POSH Policy',
      type: 'POSH',
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
        type: pol.type,
        content: pol.content,
        version: 1,
      },
    });
  }

  console.log('Standard Policies seeded successfully');
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
