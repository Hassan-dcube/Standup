import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  Mail, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  Play,
  Trash2,
  Settings,
  Bell,
  BellOff
} from 'lucide-react';
import AddMemberModal from './AddMemberModal';

interface Member {
  id: string;
  userId: string;
  role: 'MANAGER' | 'STUDENT' | 'CONTRIBUTOR';
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DOING' | 'BLOCKED' | 'DONE';
  assignees: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
    };
  }>;
}

interface Project {
  id: string;
  name: string;
  members: Member[];
  tasks: Task[];
}

interface ProjectMembersProps {
  project: Project;
  onMemberUpdate: () => void;
  isManager: boolean;
}

const ProjectMembers: React.FC<ProjectMembersProps> = ({ 
  project, 
  onMemberUpdate, 
  isManager 
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const getMemberTaskStats = (memberId: string) => {
    const memberTasks = project.tasks.filter(task => 
      task.assignees.some(assignee => assignee.userId === memberId)
    );

    return {
      total: memberTasks.length,
      todo: memberTasks.filter(task => task.status === 'TODO').length,
      doing: memberTasks.filter(task => task.status === 'DOING').length,
      blocked: memberTasks.filter(task => task.status === 'BLOCKED').length,
      done: memberTasks.filter(task => task.status === 'DONE').length
    };
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-purple-100 text-purple-800';
      case 'STUDENT': return 'bg-blue-100 text-blue-800';
      case 'CONTRIBUTOR': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'MANAGER': return <Settings className="w-4 h-4" />;
      case 'STUDENT': return <Users className="w-4 h-4" />;
      case 'CONTRIBUTOR': return <UserPlus className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <Circle className="w-3 h-3 text-gray-400" />;
      case 'DOING': return <Play className="w-3 h-3 text-blue-500" />;
      case 'BLOCKED': return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'DONE': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      default: return <Circle className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Members</h3>
          <p className="text-sm text-gray-600">{project.members.length} members</p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowAddMember(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {project.members.map(member => {
            const taskStats = getMemberTaskStats(member.userId);
            
            return (
              <div key={member.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{member.user.name}</h4>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{taskStats.total}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600">{taskStats.done}</div>
                      <div className="text-xs text-gray-500">Done</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-600">{taskStats.doing}</div>
                      <div className="text-xs text-gray-500">Doing</div>
                    </div>
                    {taskStats.blocked > 0 && (
                      <div className="text-center">
                        <div className="text-sm font-medium text-red-600">{taskStats.blocked}</div>
                        <div className="text-xs text-gray-500">Blocked</div>
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                      <span className="ml-1">{member.role.toLowerCase()}</span>
                    </span>
                    {isManager && (
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {project.members.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
          <p className="text-gray-500 mb-4">Add team members to start collaborating on this project</p>
          {isManager && (
            <button
              onClick={() => setShowAddMember(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Member
            </button>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onSuccess={() => {
          setShowAddMember(false);
          onMemberUpdate();
        }}
        projectId={project.id}
        existingMembers={project.members.map(m => m.userId)}
      />

      {/* Member Actions Modal Placeholder */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedMember(null)}></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Actions</h3>
              <p className="text-gray-600 mb-4">Actions for {selectedMember.user.name}</p>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  <Bell className="w-4 h-4 inline mr-2" />
                  Toggle Notifications
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  <Settings className="w-4 h-4 inline mr-2" />
                  Change Role
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Remove from Project
                </button>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMembers;
