import type { UserSummary } from './user.types';

export interface Team {
  id: number;
  name: string;
  description: string | null;
  manager_id: number;
  color: string;
  created_at: string;
  updated_at: string;
  manager?: UserSummary;
  members?: TeamMember[];
  projects?: Project[];
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  tech_role: string | null;
  responsibilities: string | null;
  member_deadline: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
  team?: Team;
  employee?: UserSummary;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  team_id: number;
  manager_id: number;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  tech_stack: string | null;
  created_at: string;
  updated_at: string;
  team?: Team;
  manager?: UserSummary;
  tasks?: Task[];
  updates?: ProjectUpdate[];
  messages?: ProjectMessage[];
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: number;
  project_id: number;
  assigned_to: number;
  assigned_by: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  project?: Project;
  assignee?: UserSummary;
  assigner?: UserSummary;
  updates?: TaskUpdate[];
}

export interface TaskUpdate {
  id: number;
  task_id: number;
  user_id: number;
  message: string;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
  author?: UserSummary;
}

export interface ProjectUpdate {
  id: number;
  project_id: number;
  user_id: number;
  message: string;
  progress_pct: number | null;
  created_at: string;
  author?: UserSummary;
}

export type ProjectMessageType = 'announcement' | 'query' | 'reply';

export interface ProjectMessage {
  id: number;
  project_id: number;
  sender_id: number;
  target_user_id: number | null;
  parent_id: number | null;
  message: string;
  type: ProjectMessageType;
  created_at: string;
  updated_at: string;
  sender?: UserSummary;
  targetUser?: UserSummary | null;
  replies?: ProjectMessage[];
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface AddTeamMemberRequest {
  user_id: number;
  tech_role?: string;
  responsibilities?: string;
  member_deadline?: string;
}

export interface CreateProjectRequest {
  name: string;
  team_id: number;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  tech_stack?: string;
}

export interface CreateTaskRequest {
  project_id: number;
  assigned_to: number;
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string;
}
