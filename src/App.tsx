import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import ChatButton from './components/ChatButton';
import VotingStatusBar from './components/VotingStatusBar';
import Login from './pages/Login';
import Home from './pages/Home';
import VotingCategories from './pages/VotingCategories';
import EmployeeVoting from './pages/EmployeeVoting';
import EventVoting from './pages/EventVoting';
import EmployeeDetails from './pages/EmployeeDetails';
import EventDetails from './pages/EventDetails';
import AdminDashboard_2 from './pages/AdminDashboard_2';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import EmployeeRegister from './pages/EmployeeRegister';
import ProxyAppointmentForm from './pages/ProxyAppointmentForm';
import ProxyFormManager from './pages/ProxyFormManager';
import ViewMyProxy from './pages/ViewMyProxy';
import AdminAuditReports from './components/AdminAuditReports';
import EmployeeLoginRegister from './pages/EmployeeLoginRegister';
import AdminApprovals from './pages/AdminApprovals';
import ProxyChoicePage from './pages/ProxyChoicePage';
import ProxyAppointmentFormAsignee from './pages/ProxyAppointmentFormAsignee';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0072CE]"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0072CE]"></div>
      </div>
    );
  }
  
  return user && user.role === 'admin' ? <>{children}</> : <Navigate to="/home" replace />;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0072CE]"></div>
      </div>
    );
  }
  
  // Allow both role_id 0 (super admin) and role_id 1 (admin)
  const roleId = user?.role_id ? parseInt(user.role_id) : null;
  const isSuperAdmin = user && (roleId === 0 || roleId === 1 || user.role === 'admin');
  return isSuperAdmin ? <>{children}</> : <Navigate to="/home" replace />;
};


const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0072CE] mx-auto mb-4"></div>
          <p className="text-[#464B4B] text-lg">Loading WeVote...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      {/* Top Banner Advertisement - Only show when user is logged in */}
      {/* {user && (
        <div className="fixed top-20 left-0 right-0 z-30">
          <AdvertisingBanner position="banner" />
        </div>
      )} */}

      {user && <Header />}
      
      <div className={user ? "pt-4" : ""}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
          <Route path="/employee-register" element={<EmployeeRegister />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/voting" element={<ProtectedRoute><VotingCategories /></ProtectedRoute>} />
          <Route path="/voting/employees" element={<ProtectedRoute><EmployeeVoting /></ProtectedRoute>} />
          <Route path="/voting/resolutions" element={<ProtectedRoute><EventVoting /></ProtectedRoute>} />
          <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetails /></ProtectedRoute>} />
          <Route path="/resolutions/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard_2 /></AdminRoute>} />
          <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
          <Route path="/admin/audit-reports" element={<AdminRoute><AdminAuditReports /></AdminRoute>} />
          <Route path="/admin/proxy-forms" element={<AdminRoute><ProxyFormManager /></AdminRoute>} />
          <Route path="/view-my-proxy" element={<ProtectedRoute><ViewMyProxy /></ProtectedRoute>} />
          <Route path="/proxy-choice/:id" element={<ProxyChoicePage />} />
          <Route path="/proxy-form/assignee/:id" element={<ProxyAppointmentFormAsignee />} />
          <Route path="/proxy-form/:id" element={<ProxyAppointmentForm />} />
          <Route path="/employee-login-register" element={<EmployeeLoginRegister />} />
          <Route path="/admin/approvals" element={<ProtectedRoute><AdminApprovals /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to={user ? "/home" : "/login"} replace />} />
          <Route path="*" element={<Navigate to={user ? "/home" : "/login"} replace />} />
        </Routes>
      </div>
      
      {/* Chat Button - Always available when user is logged in */}
      {user && <ChatButton />}
      
      {/* Voting Status Bar - Shows voting progress and proxy info */}
      {user && <VotingStatusBar />}
 
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;