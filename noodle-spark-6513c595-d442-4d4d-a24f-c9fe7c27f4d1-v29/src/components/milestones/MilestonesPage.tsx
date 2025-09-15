import React, { useState } from 'react';
import { MilestoneTimeline } from './MilestoneTimeline';
import { MilestoneKanban } from './MilestoneKanban';
import { MilestoneCalendar } from './MilestoneCalendar';
import { Calendar, BarChart3, Kanban, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export function MilestonesPage() {
  const [activeView, setActiveView] = useState<'timeline' | 'kanban' | 'calendar'>('timeline');

  const views = [
    { id: 'timeline', name: 'Timeline View', icon: BarChart3 },
    { id: 'kanban', name: 'Kanban Board', icon: Kanban },
    { id: 'calendar', name: 'Calendar View', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Link 
              to="/projects" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Projects"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Milestone Tracking</h1>
              <p className="text-gray-600 mt-1">
                Track programme milestones and deliverables across all projects.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-lg font-semibold text-green-600">68%</p>
            </div>
            <div className="h-12 w-px bg-gray-300"></div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-lg font-semibold text-red-600">3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center',
                  activeView === view.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <view.icon className="h-5 w-5 mr-2" />
                {view.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeView === 'timeline' && <MilestoneTimeline />}
          {activeView === 'kanban' && <MilestoneKanban />}
          {activeView === 'calendar' && <MilestoneCalendar />}
        </div>
      </div>
    </div>
  );
}