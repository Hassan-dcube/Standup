import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDB() {
  try {
    console.log('🔍 Checking database contents...');
    
    // Check organizations
    const orgs = await prisma.organization.findMany();
    console.log('\n📋 Organizations:', orgs.length);
    orgs.forEach(org => console.log(`  - ${org.id}: ${org.name}`));
    
    // Check users
    const users = await prisma.user.findMany();
    console.log('\n👥 Users:', users.length);
    users.forEach(user => console.log(`  - ${user.id}: ${user.name} (${user.email})`));
    
    // Check standup sessions
    const sessions = await prisma.standupSession.findMany();
    console.log('\n📝 Standup Sessions:', sessions.length);
    sessions.forEach(session => console.log(`  - ${session.id}: ${session.userId} on ${session.date}`));
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
