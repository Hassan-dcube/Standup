import React, { useState } from 'react';
import { CheckCircle, X, Users, Calendar, Target, UserPlus, Play } from 'lucide-react';

interface FirstRunChecklistProps {
  projectId: string;
  onDismiss: () => void;
}

const FirstRunChecklist: React.FC<FirstRunChecklistProps> = ({ projectId, onDismiss }) => {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const checklistItems = [
    {
      id: 'members',
      title: 'Add/confirm members',
      description: 'Review and add team members to the project',
      icon: Users,
      action: 'Manage Members'
    },
    {
      id: 'sprint',
      title: 'Review Sprint 1 dates & goal',
      description: 'Verify sprint timeline and objectives',
      icon: Calendar,
      action: 'Edit Sprint'
    },
    {
      id: 'tasks',
      title: 'Add/edit tasks & DoD',
      description: 'Create or modify tasks with clear acceptance criteria',
      icon: Target,
      action: 'Manage Tasks'
    },
    {
      id: 'assignments',
      title: 'Assign tasks',
      description: 'Assign tasks to team members',
      icon: UserPlus,
      action: 'Assign Tasks'
    },
    {
      id: 'progress',
      title: 'Run a progress check now',
      description: 'Execute LLM analysis to get initial progress',
      icon: Play,
      action: 'Run Analysis'
    }
  ];

  const toggleItem = (itemId: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const allCompleted = completedItems.size === checklistItems.length;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">Getting Started</h3>
          <p className="text-sm text-blue-700 mt-1">
            Complete these steps to set up your project for success
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-blue-400 hover:text-blue-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {checklistItems.map((item) => {
          const isCompleted = completedItems.has(item.id);
          const Icon = item.icon;
          
          return (
            <div
              key={item.id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isCompleted 
                  ? 'bg-green-100 border border-green-200' 
                  : 'bg-white border border-blue-200'
              }`}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-blue-300 hover:border-blue-500'
                }`}
              >
                {isCompleted && <CheckCircle className="w-4 h-4" />}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                  <h4 className={`font-medium ${isCompleted ? 'text-green-900 line-through' : 'text-blue-900'}`}>
                    {item.title}
                  </h4>
                </div>
                <p className={`text-sm mt-1 ${isCompleted ? 'text-green-700' : 'text-blue-700'}`}>
                  {item.description}
                </p>
              </div>
              
              <button
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  isCompleted
                    ? 'bg-green-200 text-green-800'
                    : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                }`}
              >
                {item.action}
              </button>
            </div>
          );
        })}
      </div>

      {allCompleted && (
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              Great! Your project is all set up and ready to go.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <p className="text-xs text-blue-600">
          {completedItems.size} of {checklistItems.length} items completed
        </p>
        <button
          onClick={onDismiss}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Dismiss checklist
        </button>
      </div>
    </div>
  );
};

export default FirstRunChecklist;
