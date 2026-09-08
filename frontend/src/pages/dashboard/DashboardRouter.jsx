import useAuthStore from '../../store/authStore';
import { ROLES } from '../../config/roles';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import HRDashboard from './HRDashboard';
import EmployeeDashboard from './EmployeeDashboard';

export default function DashboardRouter() {
  const role = useAuthStore((s) => s.user?.role);

  const dashboardMap = {
    [ROLES.SUPER_ADMIN]: <AdminDashboard />,
    [ROLES.MANAGER]: <ManagerDashboard />,
    [ROLES.HR]: <HRDashboard />,
    [ROLES.EMPLOYEE]: <EmployeeDashboard />,
    [ROLES.IT]: <EmployeeDashboard />,
    [ROLES.PAYROLL]: <EmployeeDashboard />,
  };

  return dashboardMap[role] || <EmployeeDashboard />;
}
