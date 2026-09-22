export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveToday: number;
  pendingLeaves: number;
  openPositions: number;
  todayAttendance: number;
  [key: string]: number;
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  on_leave: number;
}

export interface LeaveDistribution {
  leave_type: string;
  count: number;
}

export interface DepartmentCount {
  department: string;
  count: number;
}
