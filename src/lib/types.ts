export type TaskStatus = 'pending' | 'completed' | 'skipped';
export type TopicStatus = 'pending' | 'in_progress' | 'completed';
export type PomodoroType = 'focus' | 'break';
export type PomodoroStatus = 'completed' | 'interrupted';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  current_plan_id: string | null;
}

export interface Plan {
  id: string;
  user_id: string;
  slot: 1 | 2;
  name: string;
  exam_date: string; // ISO date string YYYY-MM-DD
  created_at: string;
}

export interface Subject {
  id: string;
  plan_id: string;
  name: string;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  plan_id: string;
  name: string;
  status: TopicStatus;
  created_at: string;
}

export interface Task {
  id: string;
  plan_id: string;
  subject_id: string;
  topic_id?: string;
  title: string;
  scheduled_date: string; // YYYY-MM-DD
  duration: number; // minutes
  status: TaskStatus;
  time_slot?: string; // e.g. "8:00 AM - 11:00 AM"
  deleted_at?: string | null;
  created_at: string;
  // Denormalized/joined helpers for presentation:
  subject_name?: string;
  topic_name?: string;
}

export interface StudySession {
  id: string;
  plan_id: string;
  task_id?: string;
  started_at: string;
  ended_at: string;
  minutes: number;
}

export interface PomodoroSession {
  id: string;
  plan_id: string;
  task_id?: string;
  started_at: string;
  completed_at?: string;
  duration: number; // minutes, default 25
  type: PomodoroType;
  status: PomodoroStatus;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  plan_id: string;
  entity_type: 'task' | 'plan' | 'pomodoro' | 'subject';
  entity_id: string;
  event_type: 'TASK_CREATED' | 'TASK_COMPLETED' | 'TASK_DELETED' | 'TASK_SKIPPED' | 'TASK_UPDATED' | 'PLAN_IMPORTED' | 'POMODORO_COMPLETED';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface PlanImport {
  id: string;
  user_id: string;
  plan_id: string;
  raw_json: string;
  version: string;
  idempotency_key: string;
  created_at: string;
}

// Analytics and Dashboard aggregated views:
export interface DashboardMetrics {
  plan: Plan;
  days_left: number;
  today_tasks_completed: number;
  today_tasks_total: number;
  today_progress_percent: number;
  weekly_hours_completed: number;
  weekly_hours_goal: number;
  weekly_goal_percent: number;
  study_streak_days: number;
  today_tasks: Task[];
  subject_progress: {
    subject_id: string;
    subject_name: string;
    completed_topics: number;
    total_topics: number;
    percent: number;
  }[];
  upcoming_tasks: Task[];
  week_distribution: {
    day_name: string;
    day_number: number;
    date: string;
    tasks_count: number;
    completed_count: number;
  }[];
}

export interface AnalyticsData {
  tasks_completed: number;
  tasks_planned: number;
  completion_rate: number;
  completion_rate_change: number | null;
  study_streak: number;
  total_study_hours: number;
  consistency_series: {
    label: string; // e.g. "Mon 15 Sep"
    date: string;
    completion_rate: number;
    tasks_done: number;
    tasks_total: number;
  }[];
  subject_breakdown: {
    name: string;
    percent: number;
    completed_tasks: number;
    total_tasks: number;
  }[];
  task_breakdown: {
    completed: number;
    pending: number;
    skipped: number;
    total: number;
  };
}
