import { prisma } from '../db.js';
import { progressEngine } from '../services/progressEngine.js';
async function testProgressEngine() {
    try {
        console.log('🚀 Testing LLM Progress Engine...\n');
        // Find the dummy project
        const project = await prisma.project.findFirst({
            where: { name: 'Paper Writing & Submission' },
            include: {
                tasks: {
                    include: {
                        assignees: {
                            include: { user: { select: { id: true, name: true } } }
                        }
                    }
                }
            }
        });
        if (!project) {
            console.log('❌ Dummy project not found. Please run the seed script first.');
            return;
        }
        console.log(`📋 Found project: ${project.name}`);
        console.log(`📊 Tasks: ${project.tasks.length}\n`);
        // Test progress analysis for each task
        for (const task of project.tasks) {
            console.log(`\n🔍 Analyzing task: ${task.title}`);
            console.log(`👥 Assignees: ${task.assignees.map(a => a.user.name).join(', ')}`);
            const analysis = await progressEngine.analyzeTaskProgress(task.id);
            if (analysis) {
                console.log(`📈 Progress: ${(analysis.percent * 100).toFixed(1)}%`);
                console.log(`📊 Status: ${analysis.status}`);
                console.log(`🎯 Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
                console.log(`📝 Summary: ${analysis.summary}`);
                if (analysis.evidence.length > 0) {
                    console.log(`🔍 Evidence: ${analysis.evidence.join(', ')}`);
                }
                // Persist the analysis
                await progressEngine.persistProgress(task.id, analysis);
                console.log('✅ Progress saved to database');
            }
            else {
                console.log('❌ Failed to analyze progress');
            }
            // Add delay between tasks
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        console.log('\n🎉 Progress engine test completed!');
        // Show final project progress summary
        console.log('\n📊 Project Progress Summary:');
        const updatedProject = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                tasks: {
                    include: {
                        progress: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });
        if (updatedProject) {
            const totalTasks = updatedProject.tasks.length;
            const completedTasks = updatedProject.tasks.filter(t => t.status === 'DONE').length;
            const averageProgress = totalTasks > 0
                ? updatedProject.tasks.reduce((sum, task) => {
                    const latestProgress = task.progress[0];
                    return sum + (latestProgress?.percent || 0);
                }, 0) / totalTasks
                : 0;
            console.log(`📋 Total Tasks: ${totalTasks}`);
            console.log(`✅ Completed: ${completedTasks}`);
            console.log(`📈 Average Progress: ${(averageProgress * 100).toFixed(1)}%`);
        }
    }
    catch (error) {
        console.error('❌ Error testing progress engine:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Run the test
testProgressEngine();
