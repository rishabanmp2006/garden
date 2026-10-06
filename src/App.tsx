import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ExploreProjects } from './pages/projects/ExploreProjects';
import { ProjectPage } from './pages/projects/ProjectPage';
import { CreateProjectPage } from './pages/projects/CreateProjectPage';
import { MyApplications } from './pages/projects/MyApplications';
import { WorkspacePage } from './pages/workspace/WorkspacePage';
import { AIPage } from './pages/ai/AIPage';
import { ContributionsPage } from './pages/contributions/ContributionsPage';
import { CreditsPage } from './pages/credits/CreditsPage';
import { PortfolioPage } from './pages/portfolio/PortfolioPage';
import { RatingsPage } from './pages/ratings/RatingsPage';
import { MatchingPage } from './pages/matching/MatchingPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { MilestonesPage } from './pages/milestones/MilestonesPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';

// Admin Pages
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminVerificationPage } from './pages/admin/AdminVerificationPage';
import { AdminDisputesPage } from './pages/admin/AdminDisputesPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#64748B]">Verifying authenticated session...</p>
        </div>
      </div>
    );
  }

  // Redirect to real login page if unauthenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Authenticated Onboarding */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Application Shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Research & Projects */}
            <Route path="/projects" element={<ExploreProjects />} />
            <Route path="/projects/create" element={<CreateProjectPage />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/applications" element={<MyApplications />} />
            <Route path="/applicants" element={<MyApplications />} />

            {/* Workspaces & Collaboration */}
            <Route path="/workspaces" element={<WorkspacePage />} />
            <Route path="/workspace/:id" element={<WorkspacePage />} />
            <Route path="/workspace/:id/ai" element={<AIPage />} />

            {/* Tools & Provenance */}
            <Route path="/ai" element={<AIPage />} />
            <Route path="/contributions" element={<ContributionsPage />} />
            <Route path="/matching" element={<MatchingPage />} />

            {/* Economics & Reputation */}
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/escrow" element={<CreditsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/portfolio/:userId" element={<PortfolioPage />} />
            <Route path="/ratings" element={<RatingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/milestones" element={<MilestonesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reviews" element={<ContributionsPage />} />

            {/* Admin & Governance */}
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/verification" element={<AdminVerificationPage />} />
            <Route path="/admin/disputes" element={<AdminDisputesPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
            <Route path="/admin/security" element={<AdminSecurityPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
