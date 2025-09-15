import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, X, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Blocker {
  id: string;
  employee: string;
  blocker: string;
  date: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Only show for managers
  if (!user || user.role !== 'manager') {
    return null;
  }

  // Fetch blockers on component mount
  useEffect(() => {
    fetchBlockers();
  }, []);

  const fetchBlockers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/chatbot/blockers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBlockers(data.blockers || []);
      } else {
        console.error('Failed to fetch blockers:', response.statusText);
        setBlockers([]);
      }
    } catch (error) {
      console.error('Error fetching blockers:', error);
      setBlockers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!isOpen) {
      fetchBlockers();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        onClick={handleBellClick}
      >
        <Bell className="w-5 h-5" />
        {blockers.length > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">{blockers.length}</span>
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                Team Blockers
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Loading blockers...</p>
              </div>
            ) : blockers.length > 0 ? (
              <div className="p-2">
                {blockers.map((blocker) => (
                  <div key={blocker.id} className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-orange-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">{blocker.employee}</p>
                          <span className="text-xs text-gray-500">{blocker.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{blocker.blocker}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>No blockers reported today</p>
              </div>
            )}
          </div>

          {blockers.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  // This could open the AI assistant with a specific query
                  setIsOpen(false);
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Get AI insights on these blockers
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
