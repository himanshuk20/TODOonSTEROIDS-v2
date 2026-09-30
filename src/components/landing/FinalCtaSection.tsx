'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function FinalCtaSection() {
  return (
    <section className="py-20 md:py-28 border-t border-hairline/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-cream-50/90 border border-hairline rounded-3xl p-10 md:p-16 shadow-preview space-y-6">
          <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800 font-bold">
            GET STARTED TODAY
          </p>

          <h2 className="font-editorial text-3xl md:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight max-w-2xl mx-auto">
            Your next study session{' '}
            <span className="font-editorial italic font-normal text-maroon-800">starts here.</span>
          </h2>

          <p className="text-stone-600 text-sm md:text-base max-w-lg mx-auto">
            Stop organizing tasks manually in disjointed notebooks. Turn your ChatGPT syllabus into daily progress today.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/get-started"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-maroon-800 text-cream text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-all shadow-md active:scale-95"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-[11px] font-mono text-stone-400 tracking-wider">
            FREE • NO CREDIT CARD • SETUP IN 2 MINUTES
          </p>
        </div>
      </div>
    </section>
  );
}
