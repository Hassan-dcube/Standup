import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface StandupSession {
  date: string | number;
  state: 'DRAFT' | 'SUBMITTED' | 'MISSED';
  submittedAt?: string;
  project?: {
    id: string;
    name: string;
  };
}

interface StandupWeekCalendarProps {
  userId?: string;
}

export const StandupWeekCalendar: React.FC<StandupWeekCalendarProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<StandupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);

  // Generate current week dates
  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    startOfWeek.setDate(diff);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    setCurrentWeek(week);
  }, []);

  // Fetch standup sessions for the current week
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const startDate = currentWeek[0]?.toISOString().split('T')[0];
        const endDate = currentWeek[6]?.toISOString().split('T')[0];
        
        if (!startDate || !endDate) return;

        const response = await fetch(
          `http://localhost:4000/api/standups/calendar/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSessions(data.standups || []);
        }
      } catch (error) {
        console.error('Failed to fetch standup sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentWeek.length > 0) {
      fetchSessions();
    }
  }, [currentWeek, userId]);

  const getSessionForDate = (date: Date): StandupSession | null => {
    const dayOfMonth = date.getDate();
    return sessions.find(session => {
      // Handle both formats: full date string or just day number
      if (typeof session.date === 'string') {
        return session.date.startsWith(date.toISOString().split('T')[0]);
      } else {
        return session.date === dayOfMonth;
      }
    }) || null;
  };

  const getStatusIcon = (session: StandupSession | null, date: Date) => {
    if (!session) {
      // Check if it's a future date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return <XCircle className="w-5 h-5 text-red-500" />;
      }
      return <Clock className="w-5 h-5 text-gray-400" />;
    }

    switch (session.state) {
      case 'SUBMITTED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'MISSED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'DRAFT':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (session: StandupSession | null, date: Date) => {
    if (!session) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return 'Missed';
      }
      return 'Pending';
    }

    switch (session.state) {
      case 'SUBMITTED':
        return 'Completed';
      case 'MISSED':
        return 'Missed';
      case 'DRAFT':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (session: StandupSession | null, date: Date) => {
    if (!session) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return 'bg-red-50 border-red-200 text-red-700';
      }
      return 'bg-gray-50 border-gray-200 text-gray-600';
    }

    switch (session.state) {
      case 'SUBMITTED':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'MISSED':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'DRAFT':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-medium text-gray-900">This Week's Standups</h3>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {currentWeek.map((date, index) => {
          const session = getSessionForDate(date);
          const statusColor = getStatusColor(session, date);
          const statusIcon = getStatusIcon(session, date);
          const statusText = getStatusText(session, date);
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              className={`relative border rounded-lg p-3 text-center ${statusColor} ${
                isTodayDate ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              {/* Date */}
              <div className="text-xs font-medium mb-2">
                {formatDate(date)}
              </div>
              
              {/* Status Icon */}
              <div className="flex justify-center mb-2">
                {statusIcon}
              </div>
              
              {/* Status Text */}
              <div className="text-xs font-medium">
                {statusText}
              </div>

              {/* Project Name */}
              {session?.project && (
                <div className="text-xs text-gray-500 mt-1 truncate" title={session.project.name}>
                  {session.project.name}
                </div>
              )}

              {/* Today indicator */}
              {isTodayDate && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center space-x-1">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <span className="text-gray-600">In Progress</span>
        </div>
        <div className="flex items-center space-x-1">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-gray-600">Missed</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Pending</span>
        </div>
      </div>
    </div>
  );
};
