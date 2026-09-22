import type { UserSummary } from './user.types';

export type HolidayType = 'national' | 'festival' | 'optional';

export interface Holiday {
  id: number;
  date: string;
  name: string;
  type: HolidayType;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  creator?: UserSummary;
}

export interface CreateHolidayRequest {
  date: string;
  name: string;
  type?: HolidayType;
}
