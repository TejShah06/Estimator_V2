import { BrowserRouter, Routes, Route } from "react-router-dom";

// ── Existing Pages ──
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Calculator from "./pages/Calculator";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AIEstimation from "./pages/AIEstimation";
import EstimationReport from "./pages/EstimationReport";
import AnalysisReport from "./pages/AnalysisReport";
import About from "./pages/company/About";
import Blog from "./pages/company/Blog";
import Contact from "./pages/company/Contact";

// ── Route Guards ──
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminGuard from "./components/AdminGuard";

// ── Admin Pages ──
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLogs from "./pages/admin/AdminLogs";

// ── 3D Model Pages ──
import ThreeDService from "./pages/ThreeDService";
import ThreeDViewer from "./pages/ThreeDViewer";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public Routes ── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />

        {/* ── Protected User Routes ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calculator"
          element={
            <ProtectedRoute>
              <Calculator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-estimation"
          element={
            <ProtectedRoute>
              <AIEstimation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimation-report/:id"
          element={
            <ProtectedRoute>
              <EstimationReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/:projectId"
          element={
            <ProtectedRoute>
              <AnalysisReport />
            </ProtectedRoute>
          }
        />

        {/* ── 3D Model Routes (Protected) ── */}
        <Route
          path="/3d-service"
          element={
            <ProtectedRoute>
              <ThreeDService />
            </ProtectedRoute>
          }
        />
        <Route
          path="/3d-viewer/:project_id"
          element={
            <ProtectedRoute>
              <ThreeDViewer />
            </ProtectedRoute>
          }
        />

        {/* ── Admin Protected Routes ── */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminGuard>
              <AdminUsers />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <AdminGuard>
              <AdminProjects />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminGuard>
              <AdminAnalytics />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminGuard>
              <AdminSettings />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <AdminGuard>
              <AdminLogs />
            </AdminGuard>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;