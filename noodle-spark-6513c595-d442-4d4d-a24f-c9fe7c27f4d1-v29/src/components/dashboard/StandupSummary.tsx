import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Users, CheckCircle, AlertTriangle, MessageCircle, Clock, TrendingUp } from 'lucide-react';

interface StandupSummaryData {
  date: string;
  summary: {
    totalEmployees: number;
    submittedCount: number;
    attendanceRate: string;
    missingCount: number;
  };
  accomplishments: Array<{
    employee: string;
    accomplishment: string;
  }>;
  blockers: Array<{
    employee: string;
    blocker: string;
  }>;
  helpRequests: Array<{
    employee: string;
    request: string;
  }>;
  comments: Array<{
    employee: string;
    question: string;
    comment: string;
    manager: string;
    replies: number;
    createdAt: string;
  }>;
  missingEmployees: Array<{
    name: string;
    email: string;
  }>;
  standups: Array<{
    id: string;
    employee: string;
    submittedAt: string;
    responses: Array<{
      questionId: string;
      answer: string;
    }>;
  }>;
}

export function StandupSummary() {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState<StandupSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (!user?.id || user.role !== 'manager') return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api(`/api/standups/summary/today/${user.id}`);
      setSummaryData(response);
    } catch (error) {
      console.error('Failed to fetch standup summary:', error);
      setError('Failed to load standup summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="mobile-card">
        <div className="mobile-card-header">
          <h3 className="text-lg font-semibold text-gray-900">Today's Standup Summary</h3>
        </div>
        <div className="mobile-card-content">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading summary...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-card">
        <div className="mobile-card-header">
          <h3 className="text-lg font-semibold text-gray-900">Today's Standup Summary</h3>
        </div>
        <div className="mobile-card-content">
          <div className="text-center py-8">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchSummary}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return null;
  }

  const { summary, accomplishments, blockers, helpRequests, comments, missingEmployees } = summaryData;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <h3 className="text-lg font-semibold text-gray-900">Today's Standup Summary</h3>
          <p className="text-sm text-gray-600">{new Date(summaryData.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        <div className="mobile-card-content">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">Submitted</p>
                  <p className="text-lg font-bold text-green-700">{summary.submittedCount}/{summary.totalEmployees}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Attendance</p>
                  <p className="text-lg font-bold text-blue-700">{summary.attendanceRate}</p>
                </div>
              </div>
            </div>
          </div>
          
          {summary.missingCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Missing Standups</p>
                  <p className="text-sm text-orange-700">
                    {missingEmployees.map(emp => emp.name).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accomplishments */}
      {accomplishments.length > 0 && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <h3 className="text-lg font-semibold text-gray-900">Team Accomplishments</h3>
          </div>
          <div className="mobile-card-content">
            <div className="space-y-3">
              {accomplishments.map((item, index) => (
                <div key={index} className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                  <p className="text-sm font-medium text-green-800">{item.employee}</p>
                  <p className="text-sm text-green-700 mt-1">{item.accomplishment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <h3 className="text-lg font-semibold text-gray-900">Blockers & Issues</h3>
          </div>
          <div className="mobile-card-content">
            <div className="space-y-3">
              {blockers.map((item, index) => (
                <div key={index} className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                  <p className="text-sm font-medium text-red-800">{item.employee}</p>
                  <p className="text-sm text-red-700 mt-1">{item.blocker}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help Requests */}
      {helpRequests.length > 0 && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <h3 className="text-lg font-semibold text-gray-900">Help Requests</h3>
          </div>
          <div className="mobile-card-content">
            <div className="space-y-3">
              {helpRequests.map((item, index) => (
                <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="text-sm font-medium text-yellow-800">{item.employee}</p>
                  <p className="text-sm text-yellow-700 mt-1">{item.request}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manager Comments */}
      {comments.length > 0 && (
        <div className="mobile-card">
          <div className="mobile-card-header">
            <h3 className="text-lg font-semibold text-gray-900">Manager Feedback</h3>
          </div>
          <div className="mobile-card-content">
            <div className="space-y-3">
              {comments.map((comment, index) => (
                <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-blue-800">{comment.employee} - {comment.question}</p>
                      <p className="text-sm text-blue-700 mt-1">{comment.comment}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        - {comment.manager} • {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {comment.replies > 0 && (
                      <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {comment.replies} replies
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mobile-card">
        <div className="mobile-card-header">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="mobile-card-content">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={fetchSummary}
              className="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Clock className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Refresh</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-800">Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

