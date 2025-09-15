import { Router } from 'express';
import { prisma } from '../db.js';
const router = Router();
router.get('/overview', async (req, res) => {
    const orgId = String(req.query.orgId || '');
    const userId = String(req.query.userId || '');
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const totalExpected = 5;
    const completedThisWeek = await prisma.standupSession.count({
        where: { orgId, userId, state: 'SUBMITTED', date: { gte: weekAgo } }
    });
    const attendanceRate = Math.round((completedThisWeek / totalExpected) * 100);
    const avgDuration = await prisma.standupSession.aggregate({
        _avg: { durationSec: true },
        where: { orgId, userId, state: 'SUBMITTED', date: { gte: weekAgo } }
    });
    const minutesSum = await prisma.standupSession.aggregate({
        _sum: { durationSec: true },
        where: { orgId, userId, state: 'SUBMITTED', date: { gte: weekAgo } }
    });
    res.json({
        attendanceRate,
        avgStandupDurationMin: avgDuration._avg.durationSec ? Math.round((avgDuration._avg.durationSec || 0) / 60 * 10) / 10 : 0,
        standupMinutesThisWeek: Math.round(((minutesSum._sum.durationSec || 0) / 60)),
        weeklyParticipation: `${completedThisWeek}/5`
    });
});
export default router;
