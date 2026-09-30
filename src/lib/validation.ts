import { z } from 'zod';

export const importTopicSchema = z.object({
  name: z.string().min(1, 'Topic name is required').max(120, 'Topic name too long'),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
});

export const importSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(80, 'Subject name too long'),
  topics: z.array(importTopicSchema).min(1, 'Each subject must have at least 1 topic').max(100),
});

export const importTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(150, 'Task title too long'),
  subjectName: z.string().min(1, 'Subject reference is required'),
  topicName: z.string().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduledDate must be YYYY-MM-DD'),
  durationMinutes: z.number().int().min(5, 'Minimum 5 minutes').max(720, 'Maximum 12 hours').default(45),
  status: z.enum(['pending', 'completed', 'skipped']).default('pending'),
  timeSlot: z.string().optional(),
});

export const importPlanSchema = z.object({
  examName: z.string().min(2, 'Exam name must be at least 2 characters').max(100, 'Exam name too long'),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'examDate must be YYYY-MM-DD'),
  monthlyGoals: z.array(z.string().max(200)).max(30).optional().default([]),
  subjects: z.array(importSubjectSchema).min(1, 'Plan must contain at least 1 subject').max(20),
  tasks: z.array(importTaskSchema).min(1, 'Plan must contain at least 1 task').max(500),
});

export const manualTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(150, 'Task title too long'),
  subject_id: z.string().min(1, 'Subject is required'),
  topic_id: z.string().optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  duration: z.number().int().min(5).max(720).default(45),
  time_slot: z.string().optional(),
});

export type ImportPlanInput = z.infer<typeof importPlanSchema>;
export type ManualTaskInput = z.infer<typeof manualTaskSchema>;
