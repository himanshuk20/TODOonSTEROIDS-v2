'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, Minus, ArrowUpRight } from 'lucide-react';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First open by default

  const faqs = [
    {
      id: 'is-it-free',
      question: 'Is TODOonSTEROIDS free?',
      answer:
        'Yes TODOonSTEROIDS is completely free for upto 2 plans per user with all advanced analytics and every details you want.',
      highlight: true,
    },
    {
      id: 'what-is-todoonsteroids',
      question: 'What is TODOonSTEROIDS?',
      answer:
        'TODOonSTEROIDS is an opinionated study-planning and execution platform. Instead of creating plans from scratch, you generate structured study plans using ChatGPT or any LLM, and TODOonSTEROIDS parses, validates, and transforms them into an actionable daily system with Pomodoro timers, subject tracking, and progress analytics.',
    },
    {
      id: 'chatgpt-import',
      question: 'How does the ChatGPT study plan import work?',
      answer:
        'We provide a tailored prompt template that asks ChatGPT for a specific JSON schema covering your exam date, subjects, topics, and daily scheduled tasks. You simply paste the JSON into our import editor, click Upload, and your entire study plan is immediately ready on your dashboard.',
    },
    {
      id: 'manual-tasks',
      question: 'Can I create tasks manually?',
      answer:
        'Yes! You can create, edit, reschedule, mark completed, skip, or soft-delete tasks manually at any time across Home, Tasks, and Calendar. Manually created tasks are treated as the exact same task entity as imported tasks.',
    },
    {
      id: 'progress-tracking',
      question: 'Does it track my progress?',
      answer:
        'Every task completion, Pomodoro session, and topic finished is recorded in your plan-scoped relational database. Our analytics engine automatically derives your daily streak, study hours, consistency curve, and subject-wise completion rates.',
    },
    {
      id: 'other-exams',
      question: 'Can I use it for other exams besides UPSC?',
      answer:
        'Absolutely. TODOonSTEROIDS is completely exam-agnostic. Whether you are preparing for UPSC CSE, JEE Advanced, NEET UG, GATE, CAT, USMLE, or university semester exams, the prompt template will tailor the syllabus and daily tasks to your exact needs.',
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 border-t border-hairline/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800 font-bold mb-1">
              FAQ
            </p>
            <h2 className="font-editorial text-3xl md:text-5xl font-bold text-stone-900 tracking-tight">
              Questions, answered.
            </h2>
          </div>

          <a
            href="mailto:support@todoonsteroids.com"
            className="text-xs font-semibold text-stone-600 hover:text-maroon-800 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            STILL HAVE QUESTIONS? Contact support <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id}
                id={faq.id}
                className={`bg-cream-50/90 border rounded-2xl transition-all duration-200 ${
                  faq.highlight
                    ? 'border-maroon-800/60 bg-maroon-50/30'
                    : 'border-hairline hover:border-stone-400'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full p-5 md:p-6 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800 rounded-2xl"
                >
                  <span
                    className={`font-editorial text-lg md:text-xl font-bold ${
                      faq.highlight ? 'text-maroon-900' : 'text-stone-900'
                    }`}
                  >
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-maroon-800 text-cream' : 'bg-cream-200 text-stone-700'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 md:px-6 md:pb-6 text-stone-600 text-sm leading-relaxed border-t border-hairline/60 pt-4 animate-in fade-in duration-150">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
