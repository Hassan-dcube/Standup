import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, LayoutDashboard, FileText, TrendingUp, Target, Bot, MessageCircle, X, FolderOpen, Users } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { name: 'Standup', href: '/standup', icon: Bot, roles: ['employee'], priority: 1 },
    { name: 'Projects', href: '/projects', icon: FolderOpen, roles: ['employee'], priority: 2 },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['employee'], priority: 3 },
    { name: 'Projects', href: '/projects', icon: FolderOpen, roles: ['manager', 'programme-manager'], priority: 1 },
    { name: 'Standup', href: '/standup', icon: Bot, roles: ['manager', 'programme-manager'], priority: 2 },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['manager', 'programme-manager'], priority: 3 },
    { name: 'Analytics', href: '/reports', icon: FileText, roles: ['manager', 'programme-manager'], priority: 4 },
    { name: 'Employees', href: '/employees', icon: Users, roles: ['manager', 'programme-manager'], priority: 5 },
    { name: 'Forecasting', href: '/forecasting', icon: TrendingUp, roles: ['programme-manager'], priority: 6 },
    { name: 'Milestones', href: '/milestones', icon: Target, roles: ['programme-manager'], priority: 7 }
  ];

  const filteredItems = navigationItems
    .filter(item => user && item.roles.includes(user.role))
    .sort((a, b) => a.priority - b.priority);

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg border-r border-gray-200 h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-blue-600 rounded-lg p-2">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Enterprise</h1>
            <p className="text-xs text-gray-600">Portal</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            type="button"
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose} // Close mobile sidebar when item is clicked
              className={clsx(
                'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={clsx(
                'mr-3 h-5 w-5 transition-colors duration-150',
                isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role.replace('-', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}