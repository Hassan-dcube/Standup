/**
 * Routing Example
 * 
 * This file demonstrates how to implement routing with react-router-dom.
 * This is commented out and serves as a reference implementation for the AI
 * to use when generating customized navigation.
 * 
 * Libraries demonstrated:
 * - react-router-dom
 * - @heroicons/react
 */

/*
import React from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useParams, useNavigate } from 'react-router-dom';
import { HomeIcon, UserIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/solid';

// Simple home page component
const Home = () => (
  <div className="page">
    <h2>Home Page</h2>
    <p>Welcome to the example application. Use the navigation to explore different pages.</p>
    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
      <div className="card">
        <h3>Features</h3>
        <p>Explore the different features of this application</p>
      </div>
      <div className="card">
        <h3>Dashboard</h3>
        <p>View your personalized dashboard</p>
      </div>
    </div>
  </div>
);

// Dashboard page with dynamic routes
const Dashboard = () => (
  <div className="page">
    <h2>Dashboard</h2>
    <p>This is your dashboard. Select a section below:</p>
    <nav style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
      <Link to="/dashboard/overview" className="nav-link">Overview</Link>
      <Link to="/dashboard/analytics" className="nav-link">Analytics</Link>
      <Link to="/dashboard/settings" className="nav-link">Settings</Link>
    </nav>
    <div className="content">
      <Outlet /> {/* Child routes render here */}
    </div>
  </div>
);

// Nested dashboard routes
const DashboardOverview = () => <div>Overview content goes here</div>;
const DashboardAnalytics = () => <div>Analytics content goes here</div>;
const DashboardSettings = () => <div>Settings content goes here</div>;

// Profile page with URL parameters
const Profile = () => {
  // Get URL parameters
  const { userId } = useParams();
  // Navigation programmatically
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>User Profile</h2>
      <p>Viewing profile for user ID: {userId || 'default'}</p>
      <button onClick={() => navigate(-1)} className="button">
        Go Back
      </button>
    </div>
  );
};

// Page not found component
const NotFound = () => (
  <div className="page">
    <h2>404 - Page Not Found</h2>
    <p>The page you are looking for does not exist.</p>
    <Link to="/" className="button">Go Home</Link>
  </div>
);

// Main navigation component
const Navigation = () => (
  <nav style={{ display: 'flex', background: '#f0f0f0', padding: '10px' }}>
    <Link to="/" className="nav-item">
      <HomeIcon width={20} height={20} />
      <span>Home</span>
    </Link>
    <Link to="/dashboard" className="nav-item">
      <ChartBarIcon width={20} height={20} />
      <span>Dashboard</span>
    </Link>
    <Link to="/profile/123" className="nav-item">
      <UserIcon width={20} height={20} />
      <span>Profile</span>
    </Link>
    <Link to="/settings" className="nav-item">
      <CogIcon width={20} height={20} />
      <span>Settings</span>
    </Link>
  </nav>
);

// Main layout component with navigation and content area
const Layout = () => (
  <div>
    <Navigation />
    <main style={{ padding: '20px' }}>
      <Outlet /> {/* Main routes render here */}
    </main>
    <footer style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #eaeaea', textAlign: 'center' }}>
      <p>© {new Date().getFullYear()} Example Application</p>
    </footer>
  </div>
);

// Main component that sets up the router
const RoutingExample = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />}>
            <Route index element={<DashboardOverview />} />
            <Route path="overview" element={<DashboardOverview />} />
            <Route path="analytics" element={<DashboardAnalytics />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Route>
          <Route path="profile/:userId?" element={<Profile />} />
          <Route path="settings" element={<div className="page"><h2>Settings</h2><p>Application settings go here</p></div>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default RoutingExample;
*/
