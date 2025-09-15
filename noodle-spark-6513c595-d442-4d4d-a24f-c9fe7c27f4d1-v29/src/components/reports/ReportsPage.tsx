import React, { useState } from 'react';
import { ReportFilters } from './ReportFilters';
import { ContinuousImprovementDashboard } from '../analytics/ContinuousImprovementDashboard';
import { Download, FileText, TrendingUp, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ReportsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('last-30-days');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [activeView, setActiveView] = useState<'reports' | 'analytics'>('reports');

  // Only show analytics for programme managers
  const views = [
    { id: 'reports', name: 'Reports', icon: FileText },
    ...(user?.role === 'programme-manager' ? [{ id: 'analytics', name: 'AI Analytics', icon: TrendingUp }] : [])
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Link 
              to={user?.role === 'manager' || user?.role === 'programme-manager' ? "/projects" : "/standup"} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={user?.role === 'manager' || user?.role === 'programme-manager' ? "Back to Projects" : "Back to Standup"}
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="text-gray-600 text-sm mt-1">
                Team performance insights and business analytics.
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </button>
            <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex px-4">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={clsx(
                  'py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center mr-6',
                  activeView === view.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <view.icon className="h-4 w-4 mr-2" />
                {view.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          {activeView === 'reports' && (
            <div className="space-y-4">
              <ReportFilters
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                selectedTeam={selectedTeam}
                onTeamChange={setSelectedTeam}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
              />
              <div className="text-center py-8 text-gray-500">
                <p>Reports and analytics will be available here.</p>
              </div>
            </div>
          )}
          {activeView === 'analytics' && user?.role === 'programme-manager' && <ContinuousImprovementDashboard />}
        </div>
      </div>
    </div>
  );
}