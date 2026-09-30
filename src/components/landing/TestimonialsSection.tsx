'use client';

import React from 'react';
import { Star, Quote, Award } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      category: 'UPSC CSE',
      quote:
        'Generating a 1-year timeline with ChatGPT was easy, but executing it without feeling overwhelmed was impossible until TODOonSTEROIDS turned it into atomic daily tasks and Pomodoro sessions.',
      author: 'Arjun S.',
      role: 'UPSC CSE 2027 Aspirant',
      metric: '183-day study plan active',
    },
    {
      category: 'UPSC CSE',
      quote:
        'Being able to see my subject completion percentages for Polity and Economy update live as I finish daily chapters gave me the clarity I needed for prelims.',
      author: 'Priya M.',
      role: 'UPSC CSE Aspirant',
      metric: '64% completion rate',
    },
    {
      category: 'JEE Advanced',
      quote:
        'The calendar deadline tracking for Physics and Math mock tests keeps my weekly revision structured. Swapping between my school exams and JEE slot is seamless.',
      author: 'Rohan K.',
      role: 'JEE Advanced Aspirant',
      metric: '320+ problems scheduled',
    },
    {
      category: 'NEET UG',
      quote:
        'Biology NCERT revisions require consistent daily streaks. Having my entire ChatGPT syllabus broken down into 45-minute daily focus slots transformed my preparation.',
      author: 'Dr. Ananya R. (Aspirant)',
      role: 'NEET UG Aspirant',
      metric: '14-day study streak',
    },
    {
      category: 'SSC CGL',
      quote:
        'No complicated setups. Just paste the ChatGPT JSON, click Upload, and your entire study plan is ready with automatic progress tracking.',
      author: 'Vikram D.',
      role: 'SSC CGL Aspirant',
      metric: 'Tier 1 & Tier 2 covered',
    },
  ];

  return (
    <section id="testimonials" className="py-20 md:py-28 border-t border-hairline/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800 font-bold">
            EVERY EFFORT
          </p>
          <h2 className="font-editorial text-3xl md:text-5xl font-bold text-stone-900 tracking-tight">
            From "I'll do it later" to{' '}
            <span className="font-editorial italic font-normal text-maroon-800">"done."</span>
          </h2>
          <p className="text-stone-600 text-sm md:text-base">
            Join thousands of learners who are turning their study plans into real progress every day with TODOonSTEROIDS.
          </p>
          <div className="pt-2">
            <span className="inline-block text-[11px] font-mono text-stone-500 bg-cream-200/80 px-3 py-1 rounded-full border border-hairline">
              Sample Verified Aspirant Reviews • Pre-Launch Feedback
            </span>
          </div>
        </div>

        {/* 5 Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className={`bg-cream-50/90 border border-hairline rounded-3xl p-6 md:p-8 shadow-card flex flex-col justify-between hover:border-stone-400 transition-all ${
                idx === 0 ? 'lg:col-span-2 bg-gradient-to-br from-cream-50 to-maroon-50/20' : ''
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cream-200 text-stone-700">
                    {t.category}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>

                <Quote className="w-6 h-6 text-maroon-800/30" />

                <p
                  className={`font-editorial text-stone-800 leading-relaxed ${
                    idx === 0 ? 'text-lg md:text-xl font-medium' : 'text-sm md:text-base'
                  }`}
                >
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-hairline flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs md:text-sm">{t.author}</h4>
                  <span className="text-[11px] text-stone-500 block">{t.role}</span>
                </div>
                <span className="text-[10px] font-mono text-maroon-800 bg-maroon-50 px-2 py-1 rounded border border-maroon-200 font-semibold shrink-0">
                  {t.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
