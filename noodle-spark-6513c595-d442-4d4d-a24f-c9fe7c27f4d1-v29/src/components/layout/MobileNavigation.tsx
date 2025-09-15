import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, FileText, TrendingUp, Target, Bot } from 'lucide-react';
import { clsx } from 'clsx';

export function MobileNavigation() {
  const { user } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'manager', 'programme-manager'] },
    { name: 'Standup', href: '/standup', icon: Bot, roles: ['employee', 'manager', 'programme-manager'] },
    { name: 'Reports', href: '/reports', icon: FileText, roles: ['manager', 'programme-manager'] },
    { name: 'Forecast', href: '/forecasting', icon: TrendingUp, roles: ['programme-manager'] },
    { name: 'Goals', href: '/milestones', icon: Target, roles: ['programme-manager'] }
  ];

  const filteredItems = navigationItems.filter(item => 
    user && item.roles.includes(user.role)
  ).slice(0, 5); // Limit to 5 items for mobile

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-30 safe-area-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors duration-150 min-h-[60px] min-w-[60px]',
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}