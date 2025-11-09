import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import MainApplication from './components/MainApplication';
//import Login from './components/Auth/Login0411';
//import Register from './components/Auth/Register0411'a
//;
import Login from './components/Auth/Loginpage';
import RegisterStaff from './components/Auth/RegisterStaff';
import RegisterDonor from './components/Auth/RegisterDonor';
import RegisterOrg from './components/Auth/RegisterUpdated'
//import Dashboard from './components/Dashboard/ComprehensiveAnalytics_UTD_colors';
import ProtectedRoute from './components/ProtectedRoute';
import AdminCreateStaff from './components/Auth/AdminCreateStaff'
import InviteUser from './components/Auth/InviteUser';
import DonationPage from './components/DonationPage';
import RegisterUserRequest from './components/Auth/RegisterUserRequest';
import UserRegistrationAdmin from './components/Auth/UserRegistrationAdmin';
import CompleteInvitation from './components/Auth/CompleteInvitation';
//import RegisterOrg from './components/Auth/RegisterUpdated'
import Dashboard from './components/Dashboard/ComprehensiveAnalytics_UTD_colors';
//import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

           {/* Public Landing Page */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Auth Routes - these should be accessible even if logged in */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register-organization" element={<RegisterOrg />} />
	  	    <Route path="/register-donor" element={<RegisterDonor />} />
	            <Route path="/register-user" element={<RegisterUserRequest />} />
<Route path="/admin/registration-requests" element={<UserRegistrationAdmin />} />
	  //<Route path="/register-staff" element={<RegisterStaff />} />
		    //<Route path="/complete-invitation" element={<CompleteInvitation />} />
	  <Route path="/donor-portal/donate/:id" element={<DonationPage />} />  {/* ← NEW */}
		      <Route 
          path="/admin/create-staff" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminCreateStaff />
            </ProtectedRoute>
          } 
        />
// Admin Routes (Protected)
                    {/* Protected Dashboard Route - Now using MainApplication with tabs */}
                    <Route
                      path="/dashboard/*"
                      element={
                        <ProtectedRoute>
                          <MainApplication />
                        </ProtectedRoute>
                      }
                    />

                    {/* Catch all - redirect to landing page */}
                    <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

