// AttendancePage redirects to MyAttendancePage
import { Navigate } from 'react-router-dom';
export default function AttendancePage() {
  return <Navigate to="/attendance/my" replace />;
}
