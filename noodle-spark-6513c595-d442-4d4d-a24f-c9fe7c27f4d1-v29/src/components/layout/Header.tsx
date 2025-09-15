import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Search, LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { logout, user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          {/* Mobile menu button */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 mr-4"
            type="button"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Search - hidden on mobile, visible on larger screens */}
          <div className="hidden sm:block max-w-md w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                placeholder="Search..."
                type="search"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search button for mobile */}
          <button className="sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100" type="button" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative" type="button" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
          </button>

          {/* User info - hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role.replace('-', ' ')}</p>
            </div>
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            type="button"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}