import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getMe } from "./api/api.js";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";
import Companies from "./pages/Companies.jsx";
import CompanyDetails from "./pages/CompanyDetails.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import PendingCompanies from "./pages/PendingCompanies.jsx";
import UsersManagement from "./pages/UsersManagement.jsx";
import ActivityLog from "./pages/ActivityLog.jsx";
import SubscriptionManagement from "./pages/SubscriptionManagement.jsx";
import PaymentHistory from "./pages/PaymentHistory.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import SupportTickets from "./pages/SupportTickets.jsx";
import SupportTicketDetails from "./pages/SupportTicketDetails.jsx";
import Alerts from "./pages/Alerts.jsx";
import Invoices from "./pages/Invoices.jsx";
import InvoiceDetails from "./pages/InvoiceDetails.jsx";
import CreateInvoice from "./pages/CreateInvoice.jsx";
import CommunicationCenter from "./pages/CommunicationCenter.jsx";
import UserActivityMonitor from "./pages/UserActivityMonitor.jsx";
import SessionManagement from "./pages/SessionManagement.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          // Try to verify with server
          const response = await getMe();
          if (response.success) {
            setUser(response.user);
            localStorage.setItem("user", JSON.stringify(response.user));
          } else {
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      } catch (error) {
        // Not authenticated
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const PublicRoute = ({ children }) => {
    if (loading) return <div>Loading...</div>;
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
  };

  const PrivateRoute = ({ children }) => {
    if (loading) return <div>Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/" replace />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <AnalyticsDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/home"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/companies"
            element={
              <PrivateRoute>
                <Companies />
              </PrivateRoute>
            }
          />
          <Route
            path="/companies/:companyId"
            element={
              <PrivateRoute>
                <CompanyDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/pending-companies"
            element={
              <PrivateRoute>
                <PendingCompanies />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <UsersManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <PrivateRoute>
                <ActivityLog />
              </PrivateRoute>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <PrivateRoute>
                <SubscriptionManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <PrivateRoute>
                <PaymentHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/support-tickets"
            element={
              <PrivateRoute>
                <SupportTickets />
              </PrivateRoute>
            }
          />
          <Route
            path="/support-tickets/:id"
            element={
              <PrivateRoute>
                <SupportTicketDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <PrivateRoute>
                <Alerts />
              </PrivateRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <PrivateRoute>
                <Invoices />
              </PrivateRoute>
            }
          />
          <Route
            path="/invoices/create"
            element={
              <PrivateRoute>
                <CreateInvoice />
              </PrivateRoute>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <PrivateRoute>
                <InvoiceDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/communication"
            element={
              <PrivateRoute>
                <CommunicationCenter />
              </PrivateRoute>
            }
          />
          <Route
            path="/user-activity"
            element={
              <PrivateRoute>
                <UserActivityMonitor />
              </PrivateRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <PrivateRoute>
                <SessionManagement />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {isAuthenticated && <Footer />}
    </div>
  );
}

export default App;
