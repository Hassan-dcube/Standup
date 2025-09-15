import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface CalendarMilestone {
  id: string;
  title: string;
  project: string;
  status: 'completed' | 'in-progress' | 'pending' | 'overdue';
  priority: 'high' | 'medium' | 'low';
}

const milestonesByDate: Record<string, CalendarMilestone[]> = {
  '2025-08-05': [
    { id: '1', title: 'Security Review', project: 'Project Alpha', status: 'completed', priority: 'high' }
  ],
  '2025-08-10': [
    { id: '2', title: 'Security Audit', project: 'Security', status: 'overdue', priority: 'high' }
  ],
  '2025-08-15': [
    { id: '3', title: 'Beta Release', project: 'Project Beta', status: 'in-progress', priority: 'high' },
    { id: '4', title: 'Code Review', project: 'Project Alpha', status: 'completed', priority: 'medium' }
  ],
  '2025-08-22': [
    { id: '5', title: 'Integration Testing', project: 'Project Gamma', status: 'pending', priority: 'medium' }
  ],
  '2025-08-28': [
    { id: '6', title: 'Performance Testing', project: 'Project Beta', status: 'pending', priority: 'high' }
  ],
  '2025-09-01': [
    { id: '7', title: 'Final Testing', project: 'Project Gamma', status: 'pending', priority: 'high' }
  ],
  '2025-09-08': [
    { id: '8', title: 'Documentation Review', project: 'All Projects', status: 'pending', priority: 'low' }
  ],
  '2025-09-15': [
    { id: '9', title: 'Production Deployment', project: 'Project Alpha', status: 'pending', priority: 'high' }
  ]
};

export function MilestoneCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 1)); // August 2025
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = new Date();

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    return today.getDate() === day &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear();
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getMilestonesForDay = (day: number) => {
    const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
    return milestonesByDate[dateKey] || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-400';
    }
  };

  const selectedMilestones = selectedDate ? milestonesByDate[selectedDate] || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`empty-${i}`} className="p-2 h-24"></div>
              ))}
              
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayMilestones = getMilestonesForDay(day);
                
                return (
                  <div
                    key={day}
                    className={clsx(
                      'p-2 h-24 border rounded-lg cursor-pointer hover:bg-gray-50 overflow-hidden',
                      isToday(day) ? 'bg-blue-100 border-blue-500' : 'border-gray-200',
                      selectedDate === dateKey ? 'ring-2 ring-blue-500' : ''
                    )}
                    onClick={() => setSelectedDate(dateKey)}
                  >
                    <div className={clsx(
                      'text-sm font-medium mb-1',
                      isToday(day) ? 'text-blue-700' : 'text-gray-900'
                    )}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayMilestones.slice(0, 2).map((milestone) => (
                        <div
                          key={milestone.id}
                          className={clsx(
                            'text-xs p-1 rounded truncate',
                            getStatusColor(milestone.status),
                            'text-white'
                          )}
                          title={milestone.title}
                        >
                          {milestone.title}
                        </div>
                      ))}
                      {dayMilestones.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayMilestones.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              {selectedDate ? `Milestones for ${new Date(selectedDate).toLocaleDateString()}` : 'Select a date'}
            </h4>
            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          {selectedMilestones.length > 0 ? (
            <div className="space-y-3">
              {selectedMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={clsx(
                    'p-3 border-l-4 bg-gray-50 rounded-r-lg',
                    getPriorityColor(milestone.priority)
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-sm font-medium text-gray-900">{milestone.title}</h5>
                    <div className={clsx(
                      'w-3 h-3 rounded-full',
                      getStatusColor(milestone.status)
                    )}></div>
                  </div>
                  <p className="text-xs text-gray-600">{milestone.project}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className={clsx(
                      'text-xs px-2 py-1 rounded-full',
                      milestone.priority === 'high' ? 'bg-red-100 text-red-700' :
                      milestone.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {milestone.priority} priority
                    </span>
                    <span className={clsx(
                      'text-xs px-2 py-1 rounded-full',
                      milestone.status === 'completed' ? 'bg-green-100 text-green-700' :
                      milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      milestone.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    )}>
                      {milestone.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              {selectedDate ? 'No milestones scheduled for this date.' : 'Click on a date to view milestones.'}
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-3">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-blue-700">Completed</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-blue-700">In Progress</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-blue-700">Overdue</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              <span className="text-blue-700">Pending</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Upcoming This Week</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Aug 15 - Beta Release</span>
              <span className="text-blue-600 font-medium">In Progress</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Aug 22 - Integration Testing</span>
              <span className="text-gray-600">Pending</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Aug 28 - Performance Testing</span>
              <span className="text-gray-600">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}