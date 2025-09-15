import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Filter, User, Mail, Calendar, Target, CheckCircle, Clock, AlertCircle, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { AddEmployeeModal } from './AddEmployeeModal';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  projects: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    projectId: string;
    projectName: string;
  }>;
  standups: Array<{
    id: string;
    date: string;
    state: string;
    projectName?: string;
  }>;
}

export function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<string | null>(null);

  // Fetch employees data
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api('/api/employees');
      setEmployees(response.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Delete employee
  const deleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    setDeletingEmployee(employeeId);
    try {
      await api(`/api/employees/${employeeId}`, { method: 'DELETE' });
      setEmployees(employees.filter(emp => emp.id !== employeeId));
      if (selectedEmployee?.id === employeeId) {
        setSelectedEmployee(null);
      }
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Failed to delete employee. Please try again.');
    } finally {
      setDeletingEmployee(null);
    }
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'DOING':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'BLOCKED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800';
      case 'DOING':
        return 'bg-blue-100 text-blue-800';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/projects"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600">Manage your team members and their activities</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddEmployee(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employees List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedEmployee?.id === employee.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {employee.projects.length} projects
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEmployee(employee.id);
                        }}
                        disabled={deletingEmployee === employee.id}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Delete employee"
                      >
                        {deletingEmployee === employee.id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No employees found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Employee Details */}
        <div className="lg:col-span-2">
          {selectedEmployee ? (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedEmployee.name}</h2>
                      <p className="text-gray-600">{selectedEmployee.email}</p>
                      <p className="text-sm text-gray-500">Joined {formatDate(selectedEmployee.createdAt)}</p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Projects */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Projects ({selectedEmployee.projects.length})
                </h3>
                {selectedEmployee.projects.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedEmployee.projects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <p className="text-sm text-gray-500">Role: {project.role}</p>
                        </div>
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Project
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No projects assigned</p>
                )}
              </div>

              {/* Tasks */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Tasks ({selectedEmployee.tasks.length})
                </h3>
                {selectedEmployee.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmployee.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(task.status)}
                          <div>
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-500">{task.projectName}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No tasks assigned</p>
                )}
              </div>

              {/* Recent Standups */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Recent Standups ({selectedEmployee.standups.length})
                </h3>
                {selectedEmployee.standups.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmployee.standups.slice(0, 5).map((standup) => (
                      <div key={standup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{formatDate(standup.date)}</h4>
                          {standup.projectName && (
                            <p className="text-sm text-gray-500">Project: {standup.projectName}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          standup.state === 'SUBMITTED' ? 'bg-green-100 text-green-800' :
                          standup.state === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {standup.state}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No standups recorded</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Employee</h3>
              <p className="text-gray-500">Choose an employee from the list to view their details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onSuccess={fetchEmployees}
      />
    </div>
  );
}
