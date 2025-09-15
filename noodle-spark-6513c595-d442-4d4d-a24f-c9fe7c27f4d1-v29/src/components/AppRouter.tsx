import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './auth/LoginPage';
import { DashboardLayout } from './layout/DashboardLayout';
import { Dashboard } from './dashboard/Dashboard';
import { ReportsPage } from './reports/ReportsPage';
import { ForecastingPage } from './forecasting/ForecastingPage';
import { MilestonesPage } from './milestones/MilestonesPage';
import { StandupPage } from './standup/StandupPage';
import ProjectsListPage from './projects/ProjectsListPage';
import ProjectDetailPage from './projects/ProjectDetailPage';
import { EmployeesPage } from './employees/EmployeesPage';

export function AppRouter() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Role-based landing page
  const getLandingPage = () => {
    if (user?.role === 'manager' || user?.role === 'programme-manager') {
      return '/projects';
    }
    return '/standup';
  };

  // Check if user is on a page they shouldn't have access to
  const isUnauthorizedPage = () => {
    if (!user) return false;
    
    // Only programme managers should access forecasting and milestones
    if (user.role !== 'programme-manager' && 
        (location.pathname === '/forecasting' || location.pathname === '/milestones')) {
      return true;
    }
    
    return false;
  };

  // Redirect unauthorized users to their landing page
  useEffect(() => {
    if (isAuthenticated && user && isUnauthorizedPage()) {
      navigate(getLandingPage(), { replace: true });
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  // Redirect to correct landing page when user changes (e.g., login/logout)
  useEffect(() => {
    if (isAuthenticated && user) {
      const currentPath = location.pathname;
      const expectedLandingPage = getLandingPage();
      
      // Always redirect to correct landing page if:
      // 1. User is on root path
      // Note: Both managers and employees can access projects page
      // Note: Managers can freely navigate to standup page
      if (currentPath === '/') {
        navigate(expectedLandingPage, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname]);

  // Force redirect to landing page when user changes (more aggressive approach)
  useEffect(() => {
    if (isAuthenticated && user) {
      const currentPath = location.pathname;
      const expectedLandingPage = getLandingPage();
      
      // Only redirect if user is on root path
      // Both managers and employees can access projects page
      // Managers can freely navigate to standup page
      if (currentPath === '/') {
        navigate(expectedLandingPage, { replace: true });
      }
    }
  }, [user?.id, isAuthenticated, navigate, location.pathname]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout key={user?.id}>
      <Routes>
        <Route path="/" element={<Navigate to={getLandingPage()} replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/forecasting" element={<ForecastingPage />} />
        <Route path="/milestones" element={<MilestonesPage />} />
        <Route path="/standup" element={<StandupPage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
      </Routes>
    </DashboardLayout>
  );
}