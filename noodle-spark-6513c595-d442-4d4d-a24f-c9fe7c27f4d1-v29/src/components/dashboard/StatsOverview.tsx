import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, TrendingUp, Users, Target, Clock, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

export function StatsOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real statistics
  const fetchStats = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await api(`/api/standups/stats/${user.id}?requesterId=${user.id}`);
      
      if (response.isManager) {
        // Manager stats
        setStats([
          { title: 'Team Attendance Rate', value: response.attendanceRate, change: '+7%', icon: CheckCircle, color: 'green', trend: 'up' },
          { title: 'Avg Team Duration', value: response.avgDuration, change: '+0.5min', icon: Clock, color: 'blue', trend: 'up' },
          { title: 'Team Engagement Score', value: response.teamEngagement, change: '+0.3', icon: TrendingUp, color: 'purple', trend: 'up' },
          { title: 'Active Team Members', value: response.activeMembers, change: '+2', icon: Users, color: 'orange', trend: 'up' }
        ]);
      } else {
        // Employee stats
        setStats([
          { title: 'Standup Attendance Rate', value: response.attendanceRate, change: '+5%', icon: CheckCircle, color: 'green', trend: 'up' },
          { title: 'Avg Standup Duration', value: response.avgDuration, change: '-0.3min', icon: Clock, color: 'blue', trend: 'down' },
          { title: 'Total Standups', value: response.totalStandups.toString(), change: '+1', icon: MessageCircle, color: 'purple', trend: 'up' },
          { title: 'Weekly Participation', value: response.weeklyParticipation, change: '+1', icon: Target, color: 'orange', trend: 'up' }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Fallback to default stats
      setStats([
        { title: 'Standup Attendance Rate', value: '0%', change: '0%', icon: CheckCircle, color: 'green', trend: 'up' },
        { title: 'Avg Standup Duration', value: '0min', change: '0min', icon: Clock, color: 'blue', trend: 'down' },
        { title: 'Total Standups', value: '0', change: '0', icon: MessageCircle, color: 'purple', trend: 'up' },
        { title: 'Weekly Participation', value: '0/5', change: '0', icon: Target, color: 'orange', trend: 'up' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      orange: 'bg-orange-100 text-orange-700',
      purple: 'bg-purple-100 text-purple-700'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getTrendColor = (trend: string, change: string) => {
    if (change.startsWith('+')) return 'text-green-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="mobile-stats-grid md:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="mobile-stat-card">
            <div className="animate-pulse">
              <div className="flex items-center justify-center md:justify-start mb-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg mr-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mobile-stats-grid md:grid-cols-4">
      {stats.map((stat, index) => (
        <div key={index} className="mobile-stat-card hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-125">
          <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-2">
                <div className={`p-2 rounded-lg ${getColorClasses(stat.color)} mr-2`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
              </div>
              <p className="text-lg md:text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <div className="flex items-center justify-center md:justify-start">
                <span className={`text-xs md:text-sm font-medium ${getTrendColor(stat.trend, stat.change)}`}>
                  {stat.change}
                </span>
                <span className="hidden md:inline text-xs text-gray-500 ml-1">from last week</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}