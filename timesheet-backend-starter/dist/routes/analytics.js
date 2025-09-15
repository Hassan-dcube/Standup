import { Router } from 'express';
import { requireAuth, allow } from '../auth.js';
import { analytics } from '../services/analytics.js';
import { logger } from '../services/logger.js';
const router = Router();
/**
 * Get comprehensive analytics insights for managers
 */
router.get('/insights', requireAuth, allow('MANAGER'), async (req, res) => {
    try {
        const insights = await analytics.getAnalyticsInsights();
        res.json({
            success: true,
            insights
        });
    }
    catch (error) {
        logger.error('Failed to fetch analytics insights', {
            error: error instanceof Error ? error.message : String(error)
        }, { userId: req.user?.id });
        res.status(500).json({
            error: 'Failed to fetch analytics insights'
        });
    }
});
/**
 * Get "What moved yesterday?" insights
 */
router.get('/what-moved', requireAuth, allow('MANAGER'), async (req, res) => {
    try {
        const whatMoved = await analytics.getWhatMovedYesterday();
        res.json({
            success: true,
            whatMoved
        });
    }
    catch (error) {
        logger.error('Failed to fetch what moved yesterday', {
            error: error instanceof Error ? error.message : String(error)
        }, { userId: req.user?.id });
        res.status(500).json({
            error: 'Failed to fetch what moved yesterday'
        });
    }
});
/**
 * Get "Top blockers" insights
 */
router.get('/blockers', requireAuth, allow('MANAGER'), async (req, res) => {
    try {
        const blockers = await analytics.getTopBlockers();
        res.json({
            success: true,
            blockers
        });
    }
    catch (error) {
        logger.error('Failed to fetch top blockers', {
            error: error instanceof Error ? error.message : String(error)
        }, { userId: req.user?.id });
        res.status(500).json({
            error: 'Failed to fetch top blockers'
        });
    }
});
/**
 * Get "At-risk this week" insights
 */
router.get('/at-risk', requireAuth, allow('MANAGER'), async (req, res) => {
    try {
        const atRisk = await analytics.getAtRiskThisWeek();
        res.json({
            success: true,
            atRisk
        });
    }
    catch (error) {
        logger.error('Failed to fetch at-risk tasks', {
            error: error instanceof Error ? error.message : String(error)
        }, { userId: req.user?.id });
        res.status(500).json({
            error: 'Failed to fetch at-risk tasks'
        });
    }
});
/**
 * Get analytics summary for dashboard cards
 */
router.get('/summary', requireAuth, allow('MANAGER'), async (req, res) => {
    try {
        const [whatMoved, blockers, atRisk] = await Promise.all([
            analytics.getWhatMovedYesterday(),
            analytics.getTopBlockers(),
            analytics.getAtRiskThisWeek()
        ]);
        const summary = {
            whatMoved: {
                count: whatMoved.length,
                topChange: whatMoved[0]?.percentChange || 0,
                tasks: whatMoved.slice(0, 3) // Top 3 for summary
            },
            blockers: {
                count: blockers.length,
                longestBlocked: blockers[0]?.daysBlocked || 0,
                tasks: blockers.slice(0, 3) // Top 3 for summary
            },
            atRisk: {
                count: atRisk.length,
                highRisk: atRisk.filter(t => t.riskLevel === 'HIGH').length,
                tasks: atRisk.slice(0, 3) // Top 3 for summary
            },
            generatedAt: new Date()
        };
        res.json({
            success: true,
            summary
        });
    }
    catch (error) {
        logger.error('Failed to fetch analytics summary', {
            error: error instanceof Error ? error.message : String(error)
        }, { userId: req.user?.id });
        res.status(500).json({
            error: 'Failed to fetch analytics summary'
        });
    }
});
export default router;
