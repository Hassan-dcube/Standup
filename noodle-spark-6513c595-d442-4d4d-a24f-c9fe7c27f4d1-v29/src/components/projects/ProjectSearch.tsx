import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  MessageSquare, 
  Calendar, 
  User,
  Clock,
  Tag,
  ExternalLink
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'DOING' | 'BLOCKED' | 'DONE';
  dueDate: string | null;
  assignees: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
    };
  }>;
  progress: Array<{
    id: string;
    source: 'LLM' | 'MANUAL';
    percent: number;
    summary: string | null;
    createdAt: string;
  }>;
}

interface StandupSnippet {
  id: string;
  content: string;
  date: string;
  user: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

interface ProjectSearchProps {
  project: Project;
  onTaskClick: (task: Task) => void;
  isManager: boolean;
}

const ProjectSearch: React.FC<ProjectSearchProps> = ({ 
  project, 
  onTaskClick, 
  isManager 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{
    tasks: Task[];
    standups: StandupSnippet[];
  }>({ tasks: [], standups: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'tasks' | 'standups'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Mock standup snippets - in a real app, these would come from the API
  const mockStandupSnippets: StandupSnippet[] = [
    {
      id: '1',
      content: 'Working on implementing the user authentication system. Completed the login form and started on password validation.',
      date: '2024-01-15',
      user: { id: '1', name: 'Fawad' },
      task: { id: 'task1', title: 'Implement User Authentication' }
    },
    {
      id: '2',
      content: 'Blocked on the database migration. Need to resolve the foreign key constraint issue before proceeding.',
      date: '2024-01-14',
      user: { id: '2', name: 'Hira' },
      task: { id: 'task2', title: 'Database Migration' }
    },
    {
      id: '3',
      content: 'Completed the API documentation. Ready for review and testing.',
      date: '2024-01-13',
      user: { id: '1', name: 'Fawad' },
      task: { id: 'task3', title: 'API Documentation' }
    }
  ];

  useEffect(() => {
    if (searchTerm.trim()) {
      performSearch();
    } else {
      setSearchResults({ tasks: [], standups: [] });
    }
  }, [searchTerm, searchType]);

  const performSearch = async () => {
    setIsSearching(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const term = searchTerm.toLowerCase();
    let filteredTasks: Task[] = [];
    let filteredStandups: StandupSnippet[] = [];

    if (searchType === 'all' || searchType === 'tasks') {
      filteredTasks = project.tasks.filter(task => 
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term) ||
        task.assignees.some(assignee => assignee.user.name.toLowerCase().includes(term))
      );
    }

    if (searchType === 'all' || searchType === 'standups') {
      filteredStandups = mockStandupSnippets.filter(snippet =>
        snippet.content.toLowerCase().includes(term) ||
        snippet.user.name.toLowerCase().includes(term) ||
        (snippet.task && snippet.task.title.toLowerCase().includes(term))
      );
    }

    setSearchResults({ tasks: filteredTasks, standups: filteredStandups });
    setIsSearching(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return formatDate(dateString);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'text-gray-600 bg-gray-100';
      case 'DOING': return 'text-blue-600 bg-blue-100';
      case 'BLOCKED': return 'text-red-600 bg-red-100';
      case 'DONE': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Search</h3>
        <p className="text-sm text-gray-600">Search across tasks and standup updates in this project</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks, standups, or team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Search Type Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Search in:</span>
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="searchType"
                    value="all"
                    checked={searchType === 'all'}
                    onChange={(e) => setSearchType(e.target.value as 'all' | 'tasks' | 'standups')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">All</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="searchType"
                    value="tasks"
                    checked={searchType === 'tasks'}
                    onChange={(e) => setSearchType(e.target.value as 'all' | 'tasks' | 'standups')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Tasks Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="searchType"
                    value="standups"
                    checked={searchType === 'standups'}
                    onChange={(e) => setSearchType(e.target.value as 'all' | 'tasks' | 'standups')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Standups Only</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchTerm && (
        <div className="space-y-6">
          {/* Loading State */}
          {isSearching && (
            <div className="text-center py-8">
              <div className="inline-flex items-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Searching...
              </div>
            </div>
          )}

          {/* No Results */}
          {!isSearching && searchResults.tasks.length === 0 && searchResults.standups.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">Try adjusting your search terms or filters</p>
            </div>
          )}

          {/* Task Results */}
          {!isSearching && searchResults.tasks.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Tasks ({searchResults.tasks.length})
              </h4>
              <div className="space-y-3">
                {searchResults.tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">
                          {highlightText(task.title, searchTerm)}
                        </h5>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {highlightText(task.description.substring(0, 150), searchTerm)}
                            {task.description.length > 150 && '...'}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                          {task.assignees.length > 0 && (
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {task.assignees.map(a => a.user.name).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standup Results */}
          {!isSearching && searchResults.standups.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Standup Updates ({searchResults.standups.length})
              </h4>
              <div className="space-y-3">
                {searchResults.standups.map(snippet => (
                  <div key={snippet.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {snippet.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{snippet.user.name}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{getTimeAgo(snippet.date)}</span>
                      </div>
                      {snippet.task && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {snippet.task.title}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">
                      {highlightText(snippet.content, searchTerm)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State - No Search */}
      {!searchTerm && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search Project Content</h3>
          <p className="text-gray-500 mb-4">Enter a search term to find tasks, standup updates, or team members</p>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• Search by task title, description, or assignee</p>
            <p>• Find standup updates by content or team member</p>
            <p>• Use filters to narrow down results</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSearch;
