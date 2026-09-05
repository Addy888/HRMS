/**
 * Test script to verify HR Actions endpoint and data flow
 * Run with: npx ts-node test-hr-actions-endpoint.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testHRActionsDataFlow() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('       HR ACTIONS DATA FLOW VERIFICATION');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: Find FCS-HRA-0002
    console.log('📋 STEP 1: Looking for HR Action FCS-HRA-0002...\n');
    
    const hrAction = await prisma.hRAction.findUnique({
      where: { actionNumber: 'FCS-HRA-0002' },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        issuedBy: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!hrAction) {
      console.log('❌ HR Action FCS-HRA-0002 not found in database');
      return;
    }

    console.log('✅ HR Action Found:');
    console.log('   Action Number:', hrAction.actionNumber);
    console.log('   Employee:', hrAction.employee.firstName, hrAction.employee.lastName);
    console.log('   Employee ID:', hrAction.employee.employeeId);
    console.log('   Employee DB ID:', hrAction.employeeId);
    console.log('   User ID:', hrAction.employee.userId);
    console.log('   User Email:', hrAction.employee.user.email);
    console.log('   Type:', hrAction.actionType);
    console.log('   Severity:', hrAction.severity);
    console.log('   Subject:', hrAction.subject);
    console.log('   Status:', hrAction.status);
    console.log('   Created:', hrAction.createdAt.toLocaleDateString());
    console.log('   Issued At:', hrAction.issuedAt || 'Not yet issued');
    console.log('   Issued By:', hrAction.issuedBy.email);
    console.log('');

    // Step 2: Check if employee can see it
    console.log('📋 STEP 2: Checking employee visibility...\n');

    const visibleToEmployee = await prisma.hRAction.findMany({
      where: {
        employeeId: hrAction.employeeId,
        organizationId: hrAction.organizationId,
        status: {
          notIn: ['DRAFT'],
        },
      },
    });

    console.log(`   Actions visible to employee (excluding DRAFT): ${visibleToEmployee.length}`);
    
    if (hrAction.status === 'DRAFT') {
      console.log('   ⚠️  This action is in DRAFT status');
      console.log('   ⚠️  Employee CANNOT see this action yet');
      console.log('   ✅ This is CORRECT behavior');
      console.log('   📝 HR must ISSUE this action to make it visible');
    } else {
      console.log('   ✅ This action is in', hrAction.status, 'status');
      console.log('   ✅ Employee CAN see this action');
      console.log('   ✅ Employee portal will display it');
    }
    console.log('');

    // Step 3: Simulate getMyActions query
    console.log('📋 STEP 3: Simulating employee portal query...\n');
    console.log('   User ID:', hrAction.employee.userId);
    console.log('   Employee ID:', hrAction.employeeId);
    console.log('');

    const employeeActions = await prisma.hRAction.findMany({
      where: {
        employeeId: hrAction.employeeId,
        organizationId: hrAction.organizationId,
        status: {
          notIn: ['DRAFT'],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        actionNumber: true,
        actionType: true,
        severity: true,
        subject: true,
        status: true,
        incidentDate: true,
        issuedAt: true,
      },
    });

    console.log(`   Query result: ${employeeActions.length} action(s) found`);
    
    if (employeeActions.length > 0) {
      console.log('   ✅ Employee portal will display:');
      employeeActions.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action.actionNumber} - ${action.actionType} (${action.status})`);
      });
    } else {
      console.log('   ℹ️  No actions visible to employee');
      console.log('   ℹ️  All actions are in DRAFT status');
    }
    console.log('');

    // Step 4: Recommendations
    console.log('📋 STEP 4: Recommendations...\n');
    
    if (hrAction.status === 'DRAFT') {
      console.log('   🎯 TO MAKE THIS ACTION VISIBLE:');
      console.log('   1. Login as HR admin');
      console.log('   2. Navigate to: HR Portal → HR Actions');
      console.log('   3. Find action: FCS-HRA-0002');
      console.log('   4. Click "Issue" button');
      console.log('   5. Status will change to: ISSUED');
      console.log('   6. Employee will immediately see it in their portal');
      console.log('   7. Employee will receive a notification');
    } else {
      console.log('   ✅ Action is already issued');
      console.log('   ✅ Employee should see it in: Employee Portal → HR Actions');
      console.log('   ✅ If not visible, check:');
      console.log('      - Backend server is running');
      console.log('      - Employee is logged in with correct account');
      console.log('      - API endpoint /hr-actions/my/actions is working');
      console.log('      - Browser console for any errors');
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('                  VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testHRActionsDataFlow()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
