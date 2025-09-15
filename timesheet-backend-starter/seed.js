import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Create demo organization
    const org = await prisma.organization.upsert({
      where: { id: 'demo-org' },
      update: {},
      create: {
        id: 'demo-org',
        name: 'Demo Company',
        timezone: 'Asia/Karachi',
      },
    });
    console.log('✅ Created organization:', org.name);
    
    // Get existing users
    const hassan = await prisma.user.findUnique({
      where: { email: 'hassan@company.com' },
    });
    console.log('✅ Found manager:', hassan.name);

    const fawad = await prisma.user.findUnique({
      where: { email: 'fawad@company.com' },
    });
    console.log('✅ Found employee:', fawad.name);

    const hira = await prisma.user.findUnique({
      where: { email: 'hira@company.com' },
    });
    console.log('✅ Found employee:', hira.name);

    const assad = await prisma.user.findUnique({
      where: { email: 'assad@company.com' },
    });
    console.log('✅ Found employee:', assad.name);
    
    // Create the Paper Writing & Submission project
    const project = await prisma.project.upsert({
      where: { id: 'paper-project' },
      update: {},
      create: {
        id: 'paper-project',
        orgId: 'demo-org',
        name: 'Paper Writing & Submission',
        description: 'Research paper on AI/ML topic for academic conference submission',
        status: 'ACTIVE',
        ownerId: hassan.id,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-02-28'),
      },
    });
    console.log('✅ Created project:', project.name);

    // Create Sprint 1
    const sprint = await prisma.sprint.upsert({
      where: { id: 'sprint-1' },
      update: {},
      create: {
        id: 'sprint-1',
        projectId: 'paper-project',
        name: 'Sprint 1',
        goal: 'Complete first draft',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-15'),
      },
    });
    console.log('✅ Created sprint:', sprint.name);

    // Create tasks
    const tasks = [
      {
        id: 'task-1',
        title: 'Select venue & deadline',
        description: 'Research and select appropriate conference venue for paper submission',
        acceptanceCriteria: 'DoD: venue chosen, deadline logged, authors agreed',
        assigneeId: hassan.id,
        dueDate: new Date('2024-12-03'),
        status: 'DONE',
      },
      {
        id: 'task-2',
        title: 'Literature review',
        description: 'Comprehensive review of state-of-the-art research in the field',
        acceptanceCriteria: 'DoD: SOTA table ≥20 refs in Overleaf; gap statement added',
        assigneeId: fawad.id,
        dueDate: new Date('2024-12-08'),
        status: 'IN_PROGRESS',
      },
      {
        id: 'task-3',
        title: 'Methods draft',
        description: 'Draft the methodology section with model architecture and training details',
        acceptanceCriteria: 'DoD: Model + Training drafted; 2 figure placeholders',
        assigneeId: hira.id,
        dueDate: new Date('2024-12-10'),
        status: 'IN_PROGRESS',
      },
      {
        id: 'task-4',
        title: 'Experiments & results',
        description: 'Run experiments, reproduce baselines, and conduct ablation studies',
        acceptanceCriteria: 'DoD: baseline reproduced; ablations A/B/C; results table',
        assigneeId: fawad.id,
        dueDate: new Date('2024-12-12'),
        status: 'IN_PROGRESS',
      },
      {
        id: 'task-5',
        title: 'Full draft & internal review',
        description: 'Complete full paper draft and conduct internal review process',
        acceptanceCriteria: 'DoD: full draft; 2 reviewers; comments addressed',
        assigneeId: hira.id,
        dueDate: new Date('2024-12-15'),
        status: 'TODO',
      },
    ];

    for (const taskData of tasks) {
      const task = await prisma.task.upsert({
        where: { id: taskData.id },
        update: {},
        create: {
          ...taskData,
          projectId: 'paper-project',
          sprintId: 'sprint-1',
        },
      });
      console.log('✅ Created task:', task.title);
    }

    // Create standup template
    const template = await prisma.standupTemplate.upsert({
      where: { id: 'default-template' },
      update: {},
      create: {
        id: 'default-template',
        orgId: 'demo-org',
        name: 'Default Standup Template',
        questions: [
          { id: '1', text: 'What did you accomplish yesterday?' },
          { id: '2', text: 'What are you working on today?' },
          { id: '3', text: 'Are there any blockers or impediments?' },
          { id: '4', text: 'Do you need help with anything?' },
        ],
      },
    });
    console.log('✅ Created standup template');

    // Create backfilled standup sessions for the last few days
    const today = new Date();
    const dates = [
      new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      today, // today
    ];

    const standupData = [
      // Fawad's standups
      {
        userId: fawad.id,
        date: dates[0],
        responses: [
          { questionId: '1', text: 'Finished SOTA table (18/20 references), started gap analysis' },
          { questionId: '2', text: 'Complete literature review and add remaining 2 references' },
          { questionId: '3', text: 'Need access to IEEE Xplore database for 2 key papers' },
          { questionId: '4', text: 'Could use help with citation formatting in Overleaf' },
        ],
      },
      {
        userId: fawad.id,
        date: dates[1],
        responses: [
          { questionId: '1', text: 'Completed literature review with 22 references, added gap statement' },
          { questionId: '2', text: 'Start working on experiments - reproduce baseline first' },
          { questionId: '3', text: 'Blocked on dataset access for ablation B experiment' },
          { questionId: '4', text: 'Waiting for Hassan to approve dataset access request' },
        ],
      },
      {
        userId: fawad.id,
        date: dates[2],
        responses: [
          { questionId: '1', text: 'Reproduced baseline metrics, started ablation A experiment' },
          { questionId: '2', text: 'Continue with ablation B and C experiments' },
          { questionId: '3', text: 'Still blocked on dataset access - need admin privileges' },
          { questionId: '4', text: 'Need help setting up GPU cluster for faster training' },
        ],
      },
      // Hira's standups
      {
        userId: hira.id,
        date: dates[0],
        responses: [
          { questionId: '1', text: 'Reviewed existing model architectures, started methods outline' },
          { questionId: '2', text: 'Draft model architecture section and training procedure' },
          { questionId: '3', text: 'None' },
          { questionId: '4', text: 'Need clarification on which baseline model to compare against' },
        ],
      },
      {
        userId: hira.id,
        date: dates[1],
        responses: [
          { questionId: '1', text: 'Completed model architecture draft, added training details' },
          { questionId: '2', text: 'Create 2 figure placeholders for architecture diagrams' },
          { questionId: '3', text: 'None' },
          { questionId: '4', text: 'None' },
        ],
      },
      {
        userId: hira.id,
        date: dates[2],
        responses: [
          { questionId: '1', text: 'Created architecture diagrams, started full draft integration' },
          { questionId: '2', text: 'Begin full draft writing, integrate all sections' },
          { questionId: '3', text: 'None' },
          { questionId: '4', text: 'None' },
        ],
      },
    ];

    for (const standup of standupData) {
      // Check if session already exists
      const existingSession = await prisma.standupSession.findFirst({
        where: {
          orgId: 'demo-org',
          userId: standup.userId,
          date: standup.date,
        },
      });

      let session;
      if (existingSession) {
        session = existingSession;
        console.log(`✅ Found existing standup for ${standup.userId} on ${standup.date.toDateString()}`);
      } else {
        session = await prisma.standupSession.create({
          data: {
            orgId: 'demo-org',
            userId: standup.userId,
            date: standup.date,
            state: 'SUBMITTED',
            startedAt: new Date(standup.date.getTime() + 9 * 60 * 60 * 1000), // 9 AM
            submittedAt: new Date(standup.date.getTime() + 9 * 30 * 60 * 1000), // 9:30 AM
            durationSec: 1800, // 30 minutes
          },
        });
        console.log(`✅ Created standup for ${standup.userId} on ${standup.date.toDateString()}`);
      }

      // Create responses
      for (const response of standup.responses) {
        await prisma.standupResponse.upsert({
          where: {
            sessionId_questionId: {
              sessionId: session.id,
              questionId: response.questionId,
            }
          },
          update: {},
          create: {
            sessionId: session.id,
            questionId: response.questionId,
            answerText: response.text,
            tokens: response.text.length,
          },
        });
      }
    }
    
    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
