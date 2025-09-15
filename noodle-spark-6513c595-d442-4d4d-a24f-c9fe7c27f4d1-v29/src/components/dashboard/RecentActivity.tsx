import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, CheckCircle, AlertCircle, User } from 'lucide-react';
import { api } from '../../lib/api';

export function RecentActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real activity data
  const fetchActivities = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      if (user.role === 'manager') {
        // For managers, get team standup activity
        const response = await api(`/api/standups/calendar/${user.id}?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}&requesterId=${user.id}`);
        const recentStandups = response.standups.slice(0, 3);
        
        const managerActivities = recentStandups.map((standup: any) => ({
          type: 'standup',
          message: `Reviewed ${standup.user.name}'s standup`,
          time: new Date(standup.submittedAt).toLocaleDateString(),
          icon: CheckCircle,
          color: 'green'
        }));
        
        setActivities(managerActivities);
      } else {
        // For employees, get their own standup history
        const response = await api(`/api/standups/user/${user.id}/history?limit=3`);
        const recentStandups = response.standups;
        
        const employeeActivities = recentStandups.map((standup: any) => ({
          type: 'standup',
          message: 'Completed daily standup session',
          time: new Date(standup.submittedAt).toLocaleDateString(),
          icon: CheckCircle,
          color: 'green'
        }));
        
        setActivities(employeeActivities);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [user?.id]);

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      orange: 'bg-orange-100 text-orange-700',
      purple: 'bg-purple-100 text-purple-700'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="mobile-card-content">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getColorClasses(activity.color)}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">Complete a standup to see activity here</p>
          </div>
        )}
        <div className="mobile-card-footer">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2">
            View all activity
          </button>
        </div>
      </div>
    </div>
  );
}