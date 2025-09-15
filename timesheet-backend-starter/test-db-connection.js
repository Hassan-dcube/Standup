import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if we can see the data
    const orgCount = await prisma.organization.count();
    console.log(`📊 Organizations in database: ${orgCount}`);
    
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);
    
    // Try to find specific records
    const org = await prisma.organization.findUnique({
      where: { id: 'demo-org' }
    });
    console.log('🏢 Found organization:', org ? `${org.id}: ${org.name}` : 'NOT FOUND');
    
    const user = await prisma.user.findUnique({
      where: { id: 'demo-user' }
    });
    console.log('👤 Found user:', user ? `${user.id}: ${user.name}` : 'NOT FOUND');
    
    // Test the exact query that's failing
    console.log('\n🧪 Testing the failing query...');
    try {
      const session = await prisma.standupSession.create({
        data: {
          orgId: 'demo-org',
          userId: 'demo-user',
          date: new Date(),
          startedAt: new Date()
        }
      });
      console.log('✅ Session creation successful:', session.id);
      
      // Clean up - delete the test session
      await prisma.standupSession.delete({
        where: { id: session.id }
      });
      console.log('🧹 Test session cleaned up');
      
    } catch (error) {
      console.error('❌ Session creation failed:', error.message);
      console.error('Error code:', error.code);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();


