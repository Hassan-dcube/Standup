import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight,
  Users,
  Calendar,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface TaskMovement {
  taskId: string;
  taskTitle: string;
  projectName: string;
  previousPercent: number;
  currentPercent: number;
  percentChange: number;
  evidence: string[];
  assignees: string[];
  lastUpdated: string;
}

interface BlockerInfo {
  taskId: string;
  taskTitle: string;
  projectName: string;
  assignees: string[];
  blockerQuotes: string[];
  blockedSince: string;
  daysBlocked: number;
}

interface AtRiskTask {
  taskId: string;
  taskTitle: string;
  projectName: string;
  dueDate: string;
  currentProgress: number;
  confidence: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  assignees: string[];
  daysUntilDue: number;
}

interface AnalyticsSummary {
  whatMoved: {
    count: number;
    topChange: number;
    tasks: TaskMovement[];
  };
  blockers: {
    count: number;
    longestBlocked: number;
    tasks: BlockerInfo[];
  };
  atRisk: {
    count: number;
    highRisk: number;
    tasks: AtRiskTask[];
  };
  generatedAt: string;
}

const AnalyticsCards: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsSummary();
  }, []);

  const fetchAnalyticsSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/analytics-insights/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err) {
      setError('Network error while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (riskLevel) {
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>{error || 'No analytics data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* What Moved Yesterday */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">What Moved Yesterday</h3>
          </div>
          <Link
            to="/analytics-insights/what-moved"
            className="text-gray-400 hover:text-gray-600"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <div className="mb-4">
          <div className="text-2xl font-bold text-green-600">
            {summary.whatMoved.count}
          </div>
          <div className="text-sm text-gray-600">
            tasks with positive progress
          </div>
          {summary.whatMoved.topChange > 0 && (
            <div className="text-xs text-green-600 mt-1">
              Biggest change: +{Math.round(summary.whatMoved.topChange * 100)}%
            </div>
          )}
        </div>

        <div className="space-y-2">
          {summary.whatMoved.tasks.slice(0, 2).map((task) => (
            <div key={task.taskId} className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{task.taskTitle}</p>
                <p className="text-gray-500 text-xs">{task.projectName}</p>
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <ArrowUpRight className="w-3 h-3" />
                <span className="font-medium">+{Math.round(task.percentChange * 100)}%</span>
              </div>
            </div>
          ))}
        </div>

        {summary.whatMoved.count > 2 && (
          <Link
            to="/analytics-insights/what-moved"
            className="flex items-center text-sm text-blue-600 hover:text-blue-700 mt-3"
          >
            View all {summary.whatMoved.count} tasks
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        )}
      </div>

      {/* Top Blockers */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Top Blockers</h3>
          </div>
          <Link
            to="/analytics-insights/blockers"
            className="text-gray-400 hover:text-gray-600"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <div className="mb-4">
          <div className="text-2xl font-bold text-red-600">
            {summary.blockers.count}
          </div>
          <div className="text-sm text-gray-600">
            tasks blocked in last 48h
          </div>
          {summary.blockers.longestBlocked > 0 && (
            <div className="text-xs text-red-600 mt-1">
              Longest: {summary.blockers.longestBlocked} days
            </div>
          )}
        </div>

        <div className="space-y-2">
          {summary.blockers.tasks.slice(0, 2).map((blocker) => (
            <div key={blocker.taskId} className="text-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{blocker.taskTitle}</p>
                  <p className="text-gray-500 text-xs">{blocker.projectName}</p>
                </div>
                <div className="text-red-600 text-xs font-medium">
                  {blocker.daysBlocked}d
                </div>
              </div>
              {blocker.blockerQuotes.length > 0 && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                  "{blocker.blockerQuotes[0]}"
                </p>
              )}
            </div>
          ))}
        </div>

        {summary.blockers.count > 2 && (
          <Link
            to="/analytics-insights/blockers"
            className="flex items-center text-sm text-blue-600 hover:text-blue-700 mt-3"
          >
            View all {summary.blockers.count} blockers
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        )}
      </div>

      {/* At Risk This Week */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">At Risk This Week</h3>
          </div>
          <Link
            to="/analytics-insights/at-risk"
            className="text-gray-400 hover:text-gray-600"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <div className="mb-4">
          <div className="text-2xl font-bold text-yellow-600">
            {summary.atRisk.count}
          </div>
          <div className="text-sm text-gray-600">
            tasks due within 7 days
          </div>
          {summary.atRisk.highRisk > 0 && (
            <div className="text-xs text-red-600 mt-1">
              {summary.atRisk.highRisk} high risk
            </div>
          )}
        </div>

        <div className="space-y-2">
          {summary.atRisk.tasks.slice(0, 2).map((task) => (
            <div key={task.taskId} className="text-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{task.taskTitle}</p>
                  <p className="text-gray-500 text-xs">{task.projectName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(task.riskLevel)}`}>
                    {task.riskLevel}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {task.daysUntilDue}d
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-blue-600 h-1 rounded-full"
                    style={{ width: `${task.currentProgress * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(task.currentProgress * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {summary.atRisk.count > 2 && (
          <Link
            to="/analytics-insights/at-risk"
            className="flex items-center text-sm text-blue-600 hover:text-blue-700 mt-3"
          >
            View all {summary.atRisk.count} at-risk tasks
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCards;
