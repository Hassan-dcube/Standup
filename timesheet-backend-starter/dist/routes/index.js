import { Router } from 'express';
import standups from './standups.js';
import analytics from './stats.js';
import analyticsInsights from './analytics.js';
import rag from './rag.js';
import chatbot from './chatbot.js';
import projects from './projects.js';
import sprints from './sprints.js';
import tasks from './tasks.js';
import progress from './progress.js';
import projectProgress from './projectProgress.js';
import taskProgress from './taskProgress.js';
import progressRetrieval from './progressRetrieval.js';
import llmAssessor from './llmAssessor.js';
import projectRecompute from './projectRecompute.js';
import employees from './employees.js';
// import { requireAuth } from '../auth.js';
const router = Router();
// Temporarily disabled auth for smoke testing; re-enable for production
// router.use(requireAuth);
router.use('/standups', standups);
router.use('/analytics', analytics);
router.use('/analytics-insights', analyticsInsights);
router.use('/rag', rag);
router.use('/chatbot', chatbot);
router.use('/projects', projects);
router.use('/sprints', sprints);
router.use('/tasks', tasks);
router.use('/progress', progress);
router.use('/project-progress', projectProgress);
router.use('/task-progress', taskProgress);
router.use('/progress-retrieval', progressRetrieval);
router.use('/llm-assessor', llmAssessor);
router.use('/project-recompute', projectRecompute);
router.use('/employees', employees);
// GET /api/users - Get users for dropdowns (Demo users for project creation)
router.get('/users', async (req, res) => {
    try {
        // Return demo users for project creation
        const demoUsers = [
            { id: '1', name: 'Fawad', email: 'fawad@company.com', role: 'employee' },
            { id: '2', name: 'Hira', email: 'hira@company.com', role: 'employee' },
            { id: '3', name: 'Assad', email: 'assad@company.com', role: 'employee' },
            { id: '4', name: 'Saad', email: 'saad@company.com', role: 'employee' },
            { id: 'hassan-manager', name: 'Hassan', email: 'hassan@company.com', role: 'manager' }
        ];
        res.json({ users: demoUsers });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
export default router;
