// This page is deprecated. Tasks have been replaced by project-based daily updates.
// Redirects to My Projects page.
import { Navigate } from 'react-router-dom';
export default function MyTasksPage() {
  return <Navigate to="/my-projects" replace />;
}
