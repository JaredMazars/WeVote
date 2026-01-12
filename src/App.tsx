import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import EmployeeRegister from './pages/EmployeeRegister';
import ForgotPassword from './pages/ForgotPassword';
import VotingSelection from './pages/VotingSelection';
import CandidateVoting from './pages/CandidateVoting';
import ResolutionVoting from './pages/ResolutionVoting';
import ProxyAssignment from './pages/ProxyAssignment';
import ProxyAppointmentForm from './components/ProxyAppointmentForm';
import AdminDashboard from './pages/AdminDashboard';
import AdminApprovals from './pages/AdminApprovals';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ProfilePage from './pages/ProfilePage';
import ProfileSettings from './pages/ProfileSettings';
import VoteVerification from './pages/VoteVerification';
import FeaturesDemoPage from './pages/FeaturesDemoPage';
import LiveQAPage from './pages/LiveQAPage';
import MeetingManagement from './pages/MeetingManagement';
import NotificationsPage from './pages/NotificationsPage';
import AdminManagementDashboard from './pages/AdminManagementDashboard';
import AuditorPortal from './pages/AuditorPortal';
import LiveSupportWidget from './components/LiveSupportWidget';
import CandidateCheckIn from './pages/CandidateCheckIn';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/employee-register" element={<EmployeeRegister />} />
          <Route path="/employee-login-register" element={<EmployeeRegister />} />
          
          {/* Protected Routes - All Authenticated Users */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/voting" element={
            <ProtectedRoute>
              <VotingSelection />
            </ProtectedRoute>
          } />
          <Route path="/voting/candidates" element={
            <ProtectedRoute>
              <CandidateVoting />
            </ProtectedRoute>
          } />
          <Route path="/voting/resolutions" element={
            <ProtectedRoute>
              <ResolutionVoting />
            </ProtectedRoute>
          } />
          <Route path="/proxy-assignment" element={
            <ProtectedRoute>
              <ProxyAssignment />
            </ProtectedRoute>
          } />
          <Route path="/proxy-assignment/:id" element={
            <ProtectedRoute>
              <ProxyAssignment />
            </ProtectedRoute>
          } />
          <Route path="/proxy-form" element={
            <ProtectedRoute>
              <ProxyAppointmentForm />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          } />
          <Route path="/verify" element={
            <ProtectedRoute>
              <VoteVerification />
            </ProtectedRoute>
          } />
          <Route path="/demo" element={
            <ProtectedRoute>
              <FeaturesDemoPage />
            </ProtectedRoute>
          } />
          <Route path="/meetings" element={
            <ProtectedRoute>
              <MeetingManagement />
            </ProtectedRoute>
          } />
          <Route path="/qa" element={
            <ProtectedRoute>
              <LiveQAPage />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/check-in" element={
            <ProtectedRoute>
              <CandidateCheckIn />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes - Only Admin & Super Admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/approvals" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminApprovals />
            </ProtectedRoute>
          } />
          <Route path="/admin-manage" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminManagementDashboard />
            </ProtectedRoute>
          } />
          
          {/* Super Admin Routes - Only Super Admin */}
          <Route path="/superadmin" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Auditor Routes - Only Auditor & Super Admin */}
          <Route path="/auditor" element={
            <ProtectedRoute allowedRoles={['auditor', 'super_admin']}>
              <AuditorPortal />
            </ProtectedRoute>
          } />
          
          {/* Catch All */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <LiveSupportWidget />
      </Router>
    </AuthProvider>
  );
}

export default App;

