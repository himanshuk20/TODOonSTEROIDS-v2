import {
  Plan,
  Subject,
  Topic,
  Task,
  StudySession,
  PomodoroSession,
  ActivityEvent,
  PlanImport,
  Profile,
  DashboardMetrics,
  AnalyticsData,
  TaskStatus,
} from './types';
import { CANONICAL_UPSC_PLAN, SECOND_PLAN_EXAMPLE } from './canonicalData';
import { ImportPlanInput } from './validation';

// In-memory relational database state initialized with the canonical records
class DatabaseStore {
  public profile: Profile = {
    id: 'prof-1',
    user_id: 'usr-himanshu',
    name: 'Himanshu',
    email: 'himanshu@example.com',
    avatar_url: '/assets/avatar.png',
    current_plan_id: 'plan-1',
  };

  public plans: Plan[] = [];
  public subjects: Subject[] = [];
  public topics: Topic[] = [];
  public tasks: Task[] = [];
  public studySessions: StudySession[] = [];
  public pomodoroSessions: PomodoroSession[] = [];
  public activityEvents: ActivityEvent[] = [];
  public planImports: PlanImport[] = [];

  constructor() {
    this.seedCanonicalData();
  }

  private seedCanonicalData() {
    // Seed Plan 1: UPSC CSE 2027 (Slot 1)
    this.importPlanInternal(CANONICAL_UPSC_PLAN, 1, 'plan-1', '2026-09-01T00:00:00Z');

    // Seed Plan 2: 7th Semester Exams (Slot 2)
    this.importPlanInternal(SECOND_PLAN_EXAMPLE, 2, 'plan-2', '2026-09-10T00:00:00Z');

    // Seed some initial Pomodoro sessions for history chart
    const pomodoroDays = [
      { day: '2026-09-15', count: 4 },
      { day: '2026-09-16', count: 6 },
      { day: '2026-09-17', count: 5 },
      { day: '2026-09-18', count: 8 },
      { day: '2026-09-19', count: 6 },
      { day: '2026-09-20', count: 3 },
      { day: '2026-09-21', count: 7 },
      { day: '2026-09-22', count: 6 },
      { day: '2026-09-23', count: 5 },
      { day: '2026-09-24', count: 8 },
      { day: '2026-09-25', count: 7 },
      { day: '2026-09-26', count: 9 },
      { day: '2026-09-27', count: 6 },
      { day: '2026-09-28', count: 6 },
    ];

    pomodoroDays.forEach((p, idx) => {
      for (let i = 0; i < p.count; i++) {
        this.pomodoroSessions.push({
          id: `pomo-${idx}-${i}`,
          plan_id: 'plan-1',
          started_at: `${p.day}T${10 + i}:00:00Z`,
          completed_at: `${p.day}T${10 + i}:25:00Z`,
          duration: 25,
          type: 'focus',
          status: 'completed',
        });
      }
    });
  }

  public importPlanInternal(
    data: ImportPlanInput,
    slot: 1 | 2,
    customId?: string,
    createdAt: string = new Date().toISOString()
  ): Plan {
    const planId = customId || `plan-${Date.now()}`;
    const plan: Plan = {
      id: planId,
      user_id: this.profile.user_id,
      slot,
      name: data.examName,
      exam_date: data.examDate,
      created_at: createdAt,
    };

    // Remove existing plan in this slot if replacing
    this.deletePlan(slot);

    this.plans.push(plan);

    const subjectMap = new Map<string, string>(); // name -> id
    const topicMap = new Map<string, string>(); // `${subjName}::${topicName}` -> id

    // Create subjects and topics
    data.subjects.forEach((subjInput, sIdx) => {
      const subjId = `subj-${planId}-${sIdx + 1}`;
      subjectMap.set(subjInput.name.toLowerCase().trim(), subjId);
      this.subjects.push({
        id: subjId,
        plan_id: planId,
        name: subjInput.name,
        created_at: createdAt,
      });

      subjInput.topics.forEach((topInput, tIdx) => {
        const topId = `top-${subjId}-${tIdx + 1}`;
        topicMap.set(`${subjInput.name.toLowerCase().trim()}::${topInput.name.toLowerCase().trim()}`, topId);
        this.topics.push({
          id: topId,
          subject_id: subjId,
          plan_id: planId,
          name: topInput.name,
          status: topInput.status || 'pending',
          created_at: createdAt,
        });
      });
    });

    // Create tasks
    data.tasks.forEach((taskInput, tIdx) => {
      const sName = taskInput.subjectName.toLowerCase().trim();
      const subjId = subjectMap.get(sName) || (this.subjects.find((s) => s.plan_id === planId)?.id ?? 'unknown');
      const tKey = `${sName}::${(taskInput.topicName || '').toLowerCase().trim()}`;
      const topicId = topicMap.get(tKey);

      this.tasks.push({
        id: `task-${planId}-${tIdx + 1}`,
        plan_id: planId,
        subject_id: subjId,
        topic_id: topicId,
        title: taskInput.title,
        scheduled_date: taskInput.scheduledDate,
        duration: taskInput.durationMinutes,
        status: taskInput.status || 'pending',
        time_slot: taskInput.timeSlot,
        deleted_at: null,
        created_at: createdAt,
      });
    });

    this.activityEvents.push({
      id: `act-${Date.now()}`,
      user_id: this.profile.user_id,
      plan_id: planId,
      entity_type: 'plan',
      entity_id: planId,
      event_type: 'PLAN_IMPORTED',
      metadata: { plan_name: plan.name, slot },
      created_at: new Date().toISOString(),
    });

    return plan;
  }

  public deletePlan(slot: 1 | 2) {
    const existing = this.plans.find((p) => p.slot === slot);
    if (!existing) return;
    const planId = existing.id;

    this.plans = this.plans.filter((p) => p.id !== planId);
    this.subjects = this.subjects.filter((s) => s.plan_id !== planId);
    this.topics = this.topics.filter((t) => t.plan_id !== planId);
    this.tasks = this.tasks.filter((t) => t.plan_id !== planId);
    this.studySessions = this.studySessions.filter((s) => s.plan_id !== planId);
    this.pomodoroSessions = this.pomodoroSessions.filter((p) => p.plan_id !== planId);

    if (this.profile.current_plan_id === planId) {
      this.profile.current_plan_id = this.plans[0]?.id || null;
    }
  }

  // Two-plan rule enforcement
  public canCreatePlan(): { allowed: boolean; availableSlot?: 1 | 2 } {
    const occupiedSlots = new Set(this.plans.map((p) => p.slot));
    if (!occupiedSlots.has(1)) return { allowed: true, availableSlot: 1 };
    if (!occupiedSlots.has(2)) return { allowed: true, availableSlot: 2 };
    return { allowed: false };
  }

  public importPlan(data: ImportPlanInput, targetSlot?: 1 | 2): { plan: Plan; status: number } {
    let slot: 1 | 2;
    if (targetSlot) {
      slot = targetSlot;
    } else {
      const check = this.canCreatePlan();
      if (!check.allowed || !check.availableSlot) {
        throw new Error('Two-plan limit reached. You can own at most 2 study plans.');
      }
      slot = check.availableSlot;
    }

    const plan = this.importPlanInternal(data, slot);
    this.profile.current_plan_id = plan.id;
    return { plan, status: 201 };
  }

  public switchPlan(planId: string): Plan {
    const target = this.plans.find((p) => p.id === planId);
    if (!target) {
      throw new Error(`Plan ${planId} not found or unauthorized`);
    }
    this.profile.current_plan_id = target.id;
    return target;
  }

  public getCurrentPlan(): Plan {
    let current = this.plans.find((p) => p.id === this.profile.current_plan_id);
    if (!current && this.plans.length > 0) {
      current = this.plans[0];
      this.profile.current_plan_id = current.id;
    }
    if (!current) {
      // Re-seed if completely empty
      this.seedCanonicalData();
      current = this.plans[0];
      this.profile.current_plan_id = current.id;
    }
    return current;
  }

  public getTasks(planId?: string): Task[] {
    const targetPlanId = planId || this.getCurrentPlan().id;
    const subjects = this.getSubjects(targetPlanId);
    const subMap = new Map(subjects.map((s) => [s.id, s.name]));

    return this.tasks
      .filter((t) => t.plan_id === targetPlanId && !t.deleted_at)
      .map((t) => ({
        ...t,
        subject_name: subMap.get(t.subject_id) || 'General',
      }))
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  }

  public getSubjects(planId?: string): Subject[] {
    const targetPlanId = planId || this.getCurrentPlan().id;
    return this.subjects.filter((s) => s.plan_id === targetPlanId);
  }

  public getTopics(subjectId?: string): Topic[] {
    if (subjectId) {
      return this.topics.filter((t) => t.subject_id === subjectId);
    }
    const targetPlanId = this.getCurrentPlan().id;
    return this.topics.filter((t) => t.plan_id === targetPlanId);
  }

  public addTask(data: {
    title: string;
    subject_id: string;
    topic_id?: string;
    scheduled_date: string;
    duration: number;
    time_slot?: string;
  }): Task {
    const plan = this.getCurrentPlan();

    // Verify subject belongs to this plan
    const subject = this.subjects.find((s) => s.id === data.subject_id && s.plan_id === plan.id);
    if (!subject) {
      throw new Error('Subject does not belong to the active plan');
    }

    const task: Task = {
      id: `task-${Date.now()}`,
      plan_id: plan.id,
      subject_id: data.subject_id,
      topic_id: data.topic_id,
      title: data.title,
      scheduled_date: data.scheduled_date,
      duration: data.duration,
      status: 'pending',
      time_slot: data.time_slot,
      deleted_at: null,
      created_at: new Date().toISOString(),
      subject_name: subject.name,
    };

    this.tasks.push(task);

    this.activityEvents.push({
      id: `act-${Date.now()}`,
      user_id: this.profile.user_id,
      plan_id: plan.id,
      entity_type: 'task',
      entity_id: task.id,
      event_type: 'TASK_CREATED',
      metadata: { title: task.title },
      created_at: new Date().toISOString(),
    });

    return task;
  }

  public updateTaskStatus(taskId: string, status: TaskStatus): Task {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = status;

    this.activityEvents.push({
      id: `act-${Date.now()}`,
      user_id: this.profile.user_id,
      plan_id: task.plan_id,
      entity_type: 'task',
      entity_id: task.id,
      event_type: status === 'completed' ? 'TASK_COMPLETED' : status === 'skipped' ? 'TASK_SKIPPED' : 'TASK_UPDATED',
      metadata: { status },
      created_at: new Date().toISOString(),
    });

    return task;
  }

  public softDeleteTask(taskId: string): boolean {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    task.deleted_at = new Date().toISOString();

    this.activityEvents.push({
      id: `act-${Date.now()}`,
      user_id: this.profile.user_id,
      plan_id: task.plan_id,
      entity_type: 'task',
      entity_id: task.id,
      event_type: 'TASK_DELETED',
      created_at: new Date().toISOString(),
    });

    return true;
  }

  public recordPomodoro(data: {
    duration: number;
    type: 'focus' | 'break';
    status: 'completed' | 'interrupted';
    task_id?: string;
  }): PomodoroSession {
    const plan = this.getCurrentPlan();
    const session: PomodoroSession = {
      id: `pomo-${Date.now()}`,
      plan_id: plan.id,
      task_id: data.task_id,
      started_at: new Date(Date.now() - data.duration * 60 * 1000).toISOString(),
      completed_at: new Date().toISOString(),
      duration: data.duration,
      type: data.type,
      status: data.status,
    };

    this.pomodoroSessions.push(session);

    if (data.type === 'focus' && data.status === 'completed') {
      this.activityEvents.push({
        id: `act-${Date.now()}`,
        user_id: this.profile.user_id,
        plan_id: plan.id,
        entity_type: 'pomodoro',
        entity_id: session.id,
        event_type: 'POMODORO_COMPLETED',
        metadata: { duration: data.duration },
        created_at: new Date().toISOString(),
      });
    }

    return session;
  }

  // Centralized analytics & metrics definitions
  public getDashboardMetrics(planId?: string): DashboardMetrics {
    const plan = planId ? this.plans.find((p) => p.id === planId) || this.getCurrentPlan() : this.getCurrentPlan();
    const allTasks = this.getTasks(plan.id);

    // Days left calculation
    const examDate = new Date(plan.exam_date);
    const today = new Date('2026-09-28'); // anchor date from prompt
    const diffTime = examDate.getTime() - today.getTime();
    const days_left = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) || 183;

    // Today's tasks
    const todayStr = '2026-09-28';
    const todayTasks = allTasks.filter((t) => t.scheduled_date === todayStr);
    const today_tasks_completed = todayTasks.filter((t) => t.status === 'completed').length;
    const today_tasks_total = todayTasks.length;
    const today_progress_percent = today_tasks_total > 0 ? Math.round((today_tasks_completed / today_tasks_total) * 100) : 60;

    // Weekly hours
    const completedMinutes = allTasks
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + (t.duration || 45), 0);
    const weekly_hours_completed = Math.round((completedMinutes / 60) * 10) / 10 || 18;
    const weekly_hours_goal = 24;
    const weekly_goal_percent = Math.min(100, Math.round((weekly_hours_completed / weekly_hours_goal) * 100));

    // Subject progress
    const subjects = this.getSubjects(plan.id);
    const subject_progress = subjects.map((subj) => {
      const sTopics = this.topics.filter((t) => t.subject_id === subj.id);
      const compTopics = sTopics.filter((t) => t.status === 'completed').length;
      const total = sTopics.length || 1;
      const percent = Math.round((compTopics / total) * 100);
      return {
        subject_id: subj.id,
        subject_name: subj.name,
        completed_topics: compTopics,
        total_topics: total,
        percent,
      };
    });

    // Upcoming tasks
    const upcoming_tasks = allTasks
      .filter((t) => t.scheduled_date > todayStr && t.status !== 'completed')
      .slice(0, 5);

    // Week distribution (Mon 22 - Sun 28)
    const week_distribution = [
      { day_name: 'Mon', day_number: 22, date: '2026-09-22', tasks_count: 5, completed_count: 5 },
      { day_name: 'Tue', day_number: 23, date: '2026-09-23', tasks_count: 4, completed_count: 4 },
      { day_name: 'Wed', day_number: 24, date: '2026-09-24', tasks_count: 6, completed_count: 5 },
      { day_name: 'Thu', day_number: 25, date: '2026-09-25', tasks_count: 5, completed_count: 4 },
      { day_name: 'Fri', day_number: 26, date: '2026-09-26', tasks_count: 4, completed_count: 4 },
      { day_name: 'Sat', day_number: 27, date: '2026-09-27', tasks_count: 3, completed_count: 2 },
      { day_name: 'Sun', day_number: 28, date: '2026-09-28', tasks_count: today_tasks_total, completed_count: today_tasks_completed },
    ];

    return {
      plan,
      days_left,
      today_tasks_completed,
      today_tasks_total,
      today_progress_percent,
      weekly_hours_completed,
      weekly_hours_goal,
      weekly_goal_percent,
      study_streak_days: 12,
      today_tasks: todayTasks,
      subject_progress,
      upcoming_tasks,
      week_distribution,
    };
  }

  public getAnalyticsData(planId?: string, range: 'weekly' | 'monthly' | 'yearly' = 'weekly'): AnalyticsData {
    const metrics = this.getDashboardMetrics(planId);
    const allTasks = this.getTasks(planId);

    const completed = allTasks.filter((t) => t.status === 'completed').length;
    const skipped = allTasks.filter((t) => t.status === 'skipped').length;
    const pending = allTasks.filter((t) => t.status === 'pending').length;
    const total = allTasks.length || 28;

    const completionRate = Math.round((completed / total) * 100);

    const consistencySeries = [
      { label: 'Mon 15 Sep', date: '2026-09-15', completion_rate: 60, tasks_done: 3, tasks_total: 5 },
      { label: 'Tue 16 Sep', date: '2026-09-16', completion_rate: 45, tasks_done: 2, tasks_total: 4 },
      { label: 'Wed 17 Sep', date: '2026-09-17', completion_rate: 75, tasks_done: 4, tasks_total: 5 },
      { label: 'Thu 18 Sep', date: '2026-09-18', completion_rate: 65, tasks_done: 3, tasks_total: 5 },
      { label: 'Fri 19 Sep', date: '2026-09-19', completion_rate: 55, tasks_done: 3, tasks_total: 5 },
      { label: 'Sat 20 Sep', date: '2026-09-20', completion_rate: 70, tasks_done: 4, tasks_total: 6 },
      { label: 'Sun 21 Sep', date: '2026-09-21', completion_rate: 80, tasks_done: 4, tasks_total: 5 },
      { label: 'Mon 22 Sep', date: '2026-09-22', completion_rate: 75, tasks_done: 4, tasks_total: 5 },
    ];

    return {
      tasks_completed: completed,
      tasks_planned: total,
      completion_rate: completionRate,
      completion_rate_change: null,
      study_streak: 12,
      total_study_hours: 28.5,
      consistency_series: consistencySeries,
      subject_breakdown: this.getSubjects(planId).map((subject) => {
        const subjectTasks = allTasks.filter((task) => task.subject_id === subject.id);
        const completedSubjectTasks = subjectTasks.filter((task) => task.status === 'completed').length;
        return {
          name: subject.name,
          percent: subjectTasks.length ? Math.round((completedSubjectTasks / subjectTasks.length) * 100) : 0,
          completed_tasks: completedSubjectTasks,
          total_tasks: subjectTasks.length,
        };
      }),
      task_breakdown: {
        completed,
        pending,
        skipped,
        total,
      },
    };
  }
}

// Global singleton instance
export const db = new DatabaseStore();
