export interface OrgChartNode {
  id: number;
  user_id: number;
  manager_id: number | null;
  department: string | null;
  designation: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    work_email: string;
    profile_photo: string | null;
    role: string;
  };
  manager?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

export interface DirectoryEmployee {
  id: number;
  first_name: string;
  last_name: string;
  work_email: string;
  emp_id: string | null;
  role: string;
  profile_photo: string | null;
  office_location: string;
  doj: string | null;
  is_active: boolean;
  profile?: {
    phone: string | null;
    gender: string | null;
  } | null;
  reportingManager?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}
