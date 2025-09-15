import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Clock, FileText, TrendingUp, Target, Plus, Upload } from 'lucide-react';

export function QuickActions() {
  const { user } = useAuth();

  const getActionsForRole = () => {
    switch (user?.role) {
      case 'employee':
        return [
          { title: 'Log Time', href: '/timesheet', icon: Clock, color: 'blue' },
          { title: 'Submit Expenses', href: '/timesheet', icon: Upload, color: 'green' },
          { title: 'View Tasks', href: '/dashboard', icon: Target, color: 'orange' }
        ];
      case 'manager':
        return [
          { title: 'Team Reports', href: '/reports', icon: FileText, color: 'blue' },
          { title: 'Approve Timesheets', href: '/timesheet', icon: Clock, color: 'green' },
          { title: 'Review Milestones', href: '/milestones', icon: Target, color: 'orange' }
        ];
      case 'programme-manager':
        return [
          { title: 'Update Forecast', href: '/forecasting', icon: TrendingUp, color: 'blue' },
          { title: 'Track Milestones', href: '/milestones', icon: Target, color: 'green' },
          { title: 'Generate Reports', href: '/reports', icon: FileText, color: 'orange' }
        ];
      default:
        return [
          { title: 'View Analytics', href: '/reports', icon: TrendingUp, color: 'blue' },
          { title: 'Manage Budgets', href: '/forecasting', icon: FileText, color: 'green' },
          { title: 'HR Dashboard', href: '/dashboard', icon: Plus, color: 'orange' }
        ];
    }
  };

  const actions = getActionsForRole();

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',
      orange: 'bg-orange-600 hover:bg-orange-700'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>
      <div className="mobile-card-content">
        <div className="space-y-3 md:space-y-4">
          {actions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className={`mobile-form-button ${getColorClasses(action.color)}`}
            >
              <action.icon className="h-5 w-5" />
              <span className="font-medium">{action.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}