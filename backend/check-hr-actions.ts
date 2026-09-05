import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHRActions() {
  console.log('Checking all HR Actions in database...\n');

  const actions = await prisma.hRAction.findMany({
    include: {
      employee: {
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Total HR Actions found: ${actions.length}\n`);

  if (actions.length > 0) {
    actions.forEach((action, index) => {
      console.log(`${index + 1}. ${action.actionNumber}`);
      console.log(`   Employee: ${action.employee.firstName} ${action.employee.lastName} (${action.employee.employeeId})`);
      console.log(`   Type: ${action.actionType}`);
      console.log(`   Status: ${action.status}`);
      console.log(`   Subject: ${action.subject}`);
      console.log(`   Created: ${action.createdAt}`);
      console.log('');
    });
  } else {
    console.log('No HR Actions found in database.');
    console.log('\nNote: You mentioned seeing FCS-HRA-0002 in the HR portal.');
    console.log('This suggests the action might need to be created first.');
    console.log('\nTo create it:');
    console.log('1. Login as HR');
    console.log('2. Navigate to HR Actions → Create New');
    console.log('3. Fill in the details for Aditya Shastri (FCS0151)');
    console.log('4. Save as DRAFT first (to test the workflow)');
    console.log('5. Then use "Issue" to make it visible to employee');
  }

  await prisma.$disconnect();
}

checkHRActions().catch(console.error);
