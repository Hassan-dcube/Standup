import React, { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { clsx } from 'clsx';

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'pending' | 'overdue';
  project: string;
  owner: string;
  progress: number;
  dependencies?: string[];
}

const milestones: Milestone[] = [
  {
    id: '1',
    title: 'Project Alpha Phase 1 Completion',
    description: 'Complete initial development and testing phase',
    dueDate: '2025-08-15',
    status: 'completed',
    project: 'Project Alpha',
    owner: 'Hira',
    progress: 100
  },
  {
    id: '2',
    title: 'UI/UX Design System Launch',
    description: 'Deploy comprehensive design system across all products',
    dueDate: '2025-08-01',
    status: 'completed',
    project: 'Design System',
    owner: 'Assad',
    progress: 100
  },
  {
    id: '3',
    title: 'Beta Release Deployment',
    description: 'Deploy beta version to staging environment',
    dueDate: '2025-08-15',
    status: 'in-progress',
    project: 'Project Beta',
    owner: 'Fawad',
    progress: 75
  },
  {
    id: '4',
    title: 'Security Audit Completion',
    description: 'Complete comprehensive security audit and remediation',
    dueDate: '2025-08-10',
    status: 'overdue',
    project: 'Security',
    owner: 'Saad',
    progress: 60
  },
  {
    id: '5',
    title: 'Integration Testing Complete',
    description: 'Finish all integration testing with external APIs',
    dueDate: '2025-09-01',
    status: 'pending',
    project: 'Project Gamma',
    owner: 'Hira',
    progress: 0
  },
  {
    id: '6',
    title: 'Production Deployment',
    description: 'Deploy to production environment with monitoring',
    dueDate: '2025-09-15',
    status: 'pending',
    project: 'Project Alpha',
    owner: 'Assad',
    progress: 0,
    dependencies: ['3']
  }
];

export function MilestoneTimeline() {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openMilestoneDetails = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">2</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">1</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">1</p>
            <p className="text-sm text-gray-600">Overdue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">2</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative flex items-start space-x-4">
              <div className="flex-shrink-0 relative z-10 bg-white">
                {getStatusIcon(milestone.status)}
              </div>
              
              <div 
                className="flex-1 bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openMilestoneDetails(milestone)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{milestone.title}</h4>
                    <p className="text-gray-600 mt-1">{milestone.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <span className={clsx(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(milestone.status)
                    )}>
                      {milestone.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Project:</span>
                    <span className="ml-2 font-medium">{milestone.project}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Owner:</span>
                    <span className="ml-2 font-medium">{milestone.owner}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Due:</span>
                    <span className={clsx(
                      'ml-2 font-medium',
                      milestone.status === 'overdue' ? 'text-red-600' : 'text-gray-900'
                    )}>
                      {formatDate(milestone.dueDate)}
                    </span>
                  </div>
                </div>
                
                {milestone.status !== 'completed' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="text-gray-900 font-medium">{milestone.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={clsx(
                          'h-2 rounded-full transition-all duration-300',
                          milestone.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${milestone.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog.Root open={showDetails} onOpenChange={setShowDetails}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
            {selectedMilestone && (
              <div>
                <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
                  {selectedMilestone.title}
                </Dialog.Title>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedMilestone.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Project</h4>
                      <p className="text-gray-600">{selectedMilestone.project}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Owner</h4>
                      <p className="text-gray-600">{selectedMilestone.owner}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Due Date</h4>
                      <p className="text-gray-600">{formatDate(selectedMilestone.dueDate)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                      <span className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(selectedMilestone.status)
                      )}>
                        {selectedMilestone.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                  
                  {selectedMilestone.dependencies && selectedMilestone.dependencies.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Dependencies</h4>
                      <div className="space-y-2">
                        {selectedMilestone.dependencies.map(depId => {
                          const dependency = milestones.find(m => m.id === depId);
                          return dependency ? (
                            <div key={depId} className="flex items-center space-x-2 text-sm">
                              {getStatusIcon(dependency.status)}
                              <span>{dependency.title}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {selectedMilestone.status !== 'completed' && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Progress</h4>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Completion</span>
                        <span className="text-gray-900 font-medium">{selectedMilestone.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={clsx(
                            'h-3 rounded-full transition-all duration-300',
                            selectedMilestone.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'
                          )}
                          style={{ width: `${selectedMilestone.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      Close
                    </button>
                  </Dialog.Close>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Edit Milestone
                  </button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}