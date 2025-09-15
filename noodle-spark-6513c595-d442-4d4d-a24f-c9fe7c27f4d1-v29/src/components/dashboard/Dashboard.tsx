import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarView } from './CalendarView';
import { RecentActivity } from './RecentActivity';
import { NotificationBell } from './NotificationBell';
import { FloatingChatbot } from '../chatbot/FloatingChatbot';
import { Calendar, Grid, List, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'calendar' | 'grid'>('calendar');

  return (
    <div className="space-y-4">
      {/* Header with back button, notifications and view toggles */}
      <div className="flex justify-between items-center">
        {/* Back Button - Projects for managers, Standup for employees */}
        <Link 
          to={user?.role === 'manager' || user?.role === 'programme-manager' ? "/projects" : "/standup"} 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={user?.role === 'manager' || user?.role === 'programme-manager' ? "Back to Projects" : "Back to Standup"}
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        
        <div className="flex items-center space-x-2">
        {/* Notification Bell for Managers */}
        {user?.role === 'manager' && <NotificationBell />}
        
        {/* View mode toggles */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={clsx(
              'p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center',
              viewMode === 'calendar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Calendar className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-md transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center',
              viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
        </div>
        </div>
      </div>


      {/* Calendar at the top for managers */}
      {user?.role === 'manager' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Team Calendar</h2>
          </div>
          <div className="p-4">
            <CalendarView />
          </div>
        </div>
      )}



      {/* Main Content - Mobile-optimized layout */}
      <div className="block lg:hidden">
        {/* Mobile Layout - Always grid view */}
        <div className="space-y-4">
          <RecentActivity />
        </div>
      </div>

      {/* Desktop Layout - Only for non-managers */}
      {user?.role !== 'manager' && (
        <div className="hidden lg:block">
          {viewMode === 'calendar' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <CalendarView />
              </div>
              <div className="space-y-4">
                <RecentActivity />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <RecentActivity />
            </div>
          )}
        </div>
      )}
      
      {/* Floating AI Assistant */}
      <FloatingChatbot />
    </div>
  );
}