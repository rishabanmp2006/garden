import { useAuth } from '../../contexts/AuthContext';
import { StudentDashboard } from './StudentDashboard';
import { OrgDashboard } from './OrgDashboard';
import { MentorDashboard } from './MentorDashboard';
import { AdminDashboard } from './AdminDashboard';

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'organization':
      return <OrgDashboard />;
    case 'mentor':
      return <MentorDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
}
