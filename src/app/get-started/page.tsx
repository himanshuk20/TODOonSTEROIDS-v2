'use client';

import React, { useRef, useState } from 'react';
import styles from '../publicGrid.module.css';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  UploadCloud,
  FileCode,
  Sparkles,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  CheckSquare,
} from 'lucide-react';
import { PublicNavbar } from '@/components/navigation/PublicNavbar';
import { CHATGPT_PROMPT_TEMPLATE, CANONICAL_UPSC_PLAN } from '@/lib/canonicalData';
import { importPlanSchema, type ImportPlanInput } from '@/lib/validation';
import { getIndiaDateKey } from '@/lib/date';
import type { Plan } from '@/lib/types';

export default function GetStartedPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [planJsonText, setPlanJsonText] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any | null>(null);
  const importKeyRef = useRef<string | null>(null);

  // Copy Prompt with robust fallback
  const handleCopyPrompt = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(CHATGPT_PROMPT_TEMPLATE);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2500);
      } else {
        // Fallback for older browsers or restricted contexts
        const textarea = document.createElement('textarea');
        textarea.value = CHATGPT_PROMPT_TEMPLATE;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (success) {
          setCopiedPrompt(true);
          setTimeout(() => setCopiedPrompt(false), 2500);
        } else {
          throw new Error('Clipboard copy not permitted');
        }
      }
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  // Build a fresh version every time so the sample never starts in the past or
  // carries pre-completed progress from the canonical fixture.
  const handleUseExample = () => {
    const freshExample = buildCurrentDateExample();
    importKeyRef.current = null;
    const formatted = JSON.stringify(freshExample, null, 2);
    setPlanJsonText(formatted);
    setErrorMsg(null);
    setSuccessMsg('Fresh example loaded for today. All tasks and topics are pending.');
    setParsedPreview(freshExample);
  };

  // Handle live textarea editing and preview parsing
  const handleTextChange = (text: string) => {
    importKeyRef.current = null;
    setPlanJsonText(text);
    setErrorMsg(null);
    if (!text.trim()) {
      setParsedPreview(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const validation = importPlanSchema.safeParse(parsed);
      if (validation.success) {
        setParsedPreview(validation.data);
      } else {
        setParsedPreview(null);
      }
    } catch {
      setParsedPreview(null);
    }
  };

  // Upload plan
  const handleUploadPlan = async () => {
    if (!planJsonText.trim()) {
      setErrorMsg('Please paste your study plan JSON or click "Use Example".');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(planJsonText);
    } catch {
      setIsUploading(false);
      setErrorMsg('Invalid JSON format. Please ensure valid syntax with quotes and braces.');
      return;
    }

    // Validate with Zod client-side
    const validation = importPlanSchema.safeParse(parsedPayload);
    if (!validation.success) {
      setIsUploading(false);
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || 'Validation error in JSON structure';
      setErrorMsg(`Validation error: ${firstError}`);
      return;
    }

    try {
      const idempotencyKey = importKeyRef.current ?? `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      importKeyRef.current = idempotencyKey;
      const res = await fetch('/api/plans/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planData: validation.data,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrorMsg(
            'Two-plan limit reached! You can have at most 2 study plans at a time. Please manage or switch your existing plans.'
          );
        } else {
          setErrorMsg(data.error || 'Failed to import plan');
        }
        setIsUploading(false);
        return;
      }

      if (data.plan) {
        // Keep the plan switcher current immediately, then mark plan-scoped data stale
        // so the dashboard loads the newly imported plan and its own tasks/analytics.
        queryClient.setQueryData<{
          plans: Plan[];
          currentPlanId: string | null;
          canCreate: boolean;
        }>(['plans'], (current) => {
          const plans = (current?.plans ?? []).filter((plan) => plan.id !== data.plan.id);
          plans.push(data.plan as Plan);
          plans.sort((a, b) => a.slot - b.slot);
          return {
            plans,
            currentPlanId: data.plan.id,
            canCreate: plans.length < 2,
          };
        });
      }
      await queryClient.invalidateQueries();

      setSuccessMsg('Plan imported successfully! Redirecting to your dashboard...');
      // Clear draft in memory as per architecture
      importKeyRef.current = null;
      setPlanJsonText('');
      setTimeout(() => {
        router.push('/home');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred while importing plan');
      setIsUploading(false);
    }
  };

  return (
    <div className={`${styles.page} min-h-screen bg-cream flex flex-col`}>
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Navigation & Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-maroon-800 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <h1 className="font-editorial text-3xl md:text-5xl font-bold text-stone-900 tracking-tight">
            Import Your Study Plan
          </h1>
          <p className="league-script-regular text-3xl md:text-4xl font-semibold leading-tight text-maroon-800 mt-1 mb-2">
            Hassle once, get better daily
          </p>
          <p className="text-stone-600 text-sm md:text-base mt-1 max-w-3xl">
            Copy the prompt, paste it into ChatGPT, upload your syllabus and daily commitment hours, then press Enter. → Paste ChatGPT’s JSON code here and click Upload Plan. Boom—you’ll have a detailed exam dashboard with daily tasks and advanced analytics to keep you motivated.{' '}
            <span className="box-decoration-clone rounded bg-maroon-100 px-1.5 py-0.5">
              Or use our example to see how it works.
            </span>
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Step 1 Prompt Template & Example */}
          <div className="space-y-6">
            <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-maroon-800">
                  STEP 1: GENERATE IN CHATGPT
                </span>

                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    copiedPrompt
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : copyError
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-white border border-hairline text-stone-700 hover:bg-cream-200 hover:border-stone-400'
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" /> Copied!
                    </>
                  ) : copyError ? (
                    'Copy Failed'
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Prompt
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-stone-600 mb-3">
                Copy this prompt template, customize your exam and subjects, and send it to ChatGPT:
              </p>

              {/* Prompt Text Container */}
              <div
                data-lenis-prevent="true"
                className="bg-white border border-hairline rounded-xl p-4 font-mono text-[11px] leading-relaxed text-stone-700 max-h-72 overflow-y-auto whitespace-pre-wrap select-all scrollable-content"
              >
                {CHATGPT_PROMPT_TEMPLATE}
              </div>
            </div>

            {/* Quick Load Example Card */}
            <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-lg font-bold text-stone-900">
                  Try with Example Plan
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Load the approved UPSC CSE 2027 plan immediately to test the full experience.
                </p>
              </div>
              <button
                type="button"
                onClick={handleUseExample}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-cream text-xs font-semibold hover:bg-stone-800 transition-colors shadow-xs shrink-0 ml-4 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Use Example
              </button>
            </div>
          </div>

          {/* Right Column: Step 2 Paste & Import (NO STRAY LINE NUMBER ARTIFACT) */}
          <div className="space-y-6">
            <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-maroon-800">
                  STEP 2: PASTE & IMPORT
                </span>
                {parsedPreview && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3" /> Valid Schema
                  </span>
                )}
              </div>

              {/* Error or Success feedback */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in duration-150">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Clean JSON Textarea Editor (Stray 1-12 artifact explicitly removed) */}
              <div className="relative">
                <label htmlFor="plan-editor" className="sr-only">
                  Paste Study Plan JSON
                </label>
                <textarea
                  id="plan-editor"
                  data-lenis-prevent="true"
                  rows={14}
                  placeholder={`{\n  "examName": "UPSC CSE 2027",\n  "examDate": "2027-05-30",\n  "subjects": [...],\n  "tasks": [...]\n}`}
                  value={planJsonText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="w-full font-mono text-xs p-4 bg-white border border-hairline rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800 leading-relaxed text-stone-800 placeholder:text-stone-300 resize-y"
                  spellCheck={false}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPlanJsonText('');
                    setParsedPreview(null);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-stone-500 hover:text-stone-800 underline"
                >
                  Clear Editor
                </button>

                <button
                  type="button"
                  onClick={handleUploadPlan}
                  disabled={isUploading || !planJsonText.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-maroon-800 text-cream text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                      Validating & Importing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" /> Upload Plan
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Interpreted Plan Preview */}
            {parsedPreview && (
              <div className="bg-cream-50/90 border border-hairline rounded-2xl p-6 shadow-card space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-stone-800">
                  <Eye className="w-4 h-4 text-maroon-800" />
                  <h3 className="font-editorial text-lg font-bold">Interpreted Plan Preview</h3>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-hairline">
                    <span className="block text-[10px] text-stone-500 uppercase font-mono">Exam</span>
                    <span className="block text-xs font-bold text-stone-900 truncate">
                      {parsedPreview.examName}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-hairline">
                    <span className="block text-[10px] text-stone-500 uppercase font-mono">
                      Subjects
                    </span>
                    <span className="block text-xs font-bold text-stone-900">
                      {parsedPreview.subjects?.length || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-hairline">
                    <span className="block text-[10px] text-stone-500 uppercase font-mono">Tasks</span>
                    <span className="block text-xs font-bold text-stone-900">
                      {parsedPreview.tasks?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Sample tasks snippet */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Sample Scheduled Tasks
                  </span>
                  {parsedPreview.tasks?.slice(0, 3).map((t: any, i: number) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-white border border-hairline text-xs flex justify-between items-center"
                    >
                      <span className="font-medium text-stone-800 truncate mr-2">{t.title}</span>
                      <span className="font-mono text-[10px] text-stone-500 shrink-0">
                        {t.durationMinutes || t.duration || 45}m • {t.scheduledDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


function buildCurrentDateExample(): ImportPlanInput {
  const plan = structuredClone(CANONICAL_UPSC_PLAN);
  const today = getIndiaDateKey();
  const todayUtc = Date.parse(`${today}T00:00:00Z`);
  const earliestTaskUtc = Math.min(
    ...plan.tasks.map((task) => Date.parse(`${task.scheduledDate}T00:00:00Z`))
  );
  const offsetDays = Math.round((todayUtc - earliestTaskUtc) / 86_400_000);

  return {
    ...plan,
    subjects: plan.subjects.map((subject) => ({
      ...subject,
      topics: subject.topics.map((topic) => ({ ...topic, status: 'pending' as const })),
    })),
    tasks: plan.tasks.map((task) => ({
      ...task,
      scheduledDate: new Date(
        Date.parse(`${task.scheduledDate}T00:00:00Z`) + offsetDays * 86_400_000
      ).toISOString().slice(0, 10),
      status: 'pending' as const,
    })),
  };
}
