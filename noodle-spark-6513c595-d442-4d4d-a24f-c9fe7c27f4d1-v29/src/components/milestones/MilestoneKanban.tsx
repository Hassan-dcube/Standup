import React from 'react';
import { Calendar, User, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface MilestoneCard {
  id: string;
  title: string;
  project: string;
  owner: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  progress?: number;
}

const columns = {
  pending: {
    title: 'Pending',
    milestones: [
      {
        id: '5',
        title: 'Integration Testing Complete',
        project: 'Project Gamma',
        owner: 'Hira',
        dueDate: '2025-09-01',
        priority: 'high'
      },
      {
        id: '6',
        title: 'Production Deployment',
        project: 'Project Alpha',
        owner: 'Assad',
        dueDate: '2025-09-15',
        priority: 'medium'
      }
    ]
  },
  'in-progress': {
    title: 'In Progress',
    milestones: [
      {
        id: '3',
        title: 'Beta Release Deployment',
        project: 'Project Beta',
        owner: 'Fawad',
        dueDate: '2025-08-15',
        priority: 'high',
        progress: 75
      }
    ]
  },
  review: {
    title: 'Under Review',
    milestones: [
      {
        id: '4',
        title: 'Security Audit Completion',
        project: 'Security',
        owner: 'Saad',
        dueDate: '2025-08-10',
        priority: 'high',
        progress: 90
      }
    ]
  },
  completed: {
    title: 'Completed',
    milestones: [
      {
        id: '1',
        title: 'Project Alpha Phase 1 Completion',
        project: 'Project Alpha',
        owner: 'Hira',
        dueDate: '2025-08-15',
        priority: 'high'
      },
      {
        id: '2',
        title: 'UI/UX Design System Launch',
        project: 'Design System',
        owner: 'Assad',
        dueDate: '2025-08-01',
        priority: 'medium'
      }
    ]
  }
};

export function MilestoneKanban() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'completed' && new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-6">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{columns.pending.milestones.length}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">{columns['in-progress'].milestones.length}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-600">{columns.review.milestones.length}</p>
            <p className="text-sm text-gray-600">Under Review</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{columns.completed.milestones.length}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Object.entries(columns).map(([status, column]) => (
          <div key={status} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {column.milestones.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {column.milestones.map((milestone) => (
                <div 
                  key={milestone.id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {milestone.title}
                    </h4>
                    <span className={clsx(
                      'ml-2 px-2 py-1 text-xs font-medium rounded border',
                      getPriorityColor(milestone.priority)
                    )}>
                      {milestone.priority}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span className="truncate">{milestone.project}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-2" />
                      <span className="truncate">{milestone.owner}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-2" />
                      <span className={clsx(
                        isOverdue(milestone.dueDate, status) ? 'text-red-600' : 'text-gray-600'
                      )}>
                        {formatDate(milestone.dueDate)}
                      </span>
                    </div>
                  </div>
                  
                  {milestone.progress !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-900 font-medium">{milestone.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${milestone.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {isOverdue(milestone.dueDate, status) && (
                    <div className="mt-2 flex items-center text-xs text-red-600">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Overdue</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Workflow Guidelines</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-700">
          <div>
            <p className="font-medium mb-1">Moving to In Progress:</p>
            <p>• Resources allocated and work has begun</p>
            <p>• Dependencies resolved or mitigation plan in place</p>
          </div>
          <div>
            <p className="font-medium mb-1">Moving to Under Review:</p>
            <p>• All deliverables completed and ready for review</p>
            <p>• Quality assurance checks completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}