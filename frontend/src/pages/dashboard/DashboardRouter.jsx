import { useAppSelector } from '../../store/hooks';
import { selectUserRole } from '../../store/slices/authSlice';
import { ROLES } from '../../config/roles';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import HRDashboard from './HRDashboard';
import EmployeeDashboard from './EmployeeDashboard';

export default function DashboardRouter() {
  const role = useAppSelector(selectUserRole);

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
