import React from 'react';
import Link from 'next/link';
import styles from './publicGrid.module.css';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { PublicNavbar } from '@/components/navigation/PublicNavbar';
import { DashboardPreview } from '@/components/dashboard/DashboardPreview';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className={`${styles.page} min-h-screen bg-cream flex flex-col`}>
      {/* Public Navigation */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Content (5-6 cols) */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-4">
                <p
                  aria-label="Plan / Study / Track / Succeed"
                  className="landing-tagline-reveal text-[11px] font-mono uppercase tracking-widest text-maroon-800 font-bold"
                >
                  PLAN / STUDY / TRACK / SUCCEED
                </p>

                <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-bold text-stone-900 tracking-tight leading-[1.08]">
                  Turn your syllabus into a{' '}
                  <span className="font-editorial italic font-normal text-maroon-800">
                    study plan.
                  </span>
                </h1>

                <p className="text-stone-600 text-base md:text-lg max-w-xl leading-relaxed">
                  Transform ChatGPT-generated study plans into organized daily tasks, weekly goals, and progress tracking with advanced analytics.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-maroon-800 text-cream text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-all shadow-md active:scale-95"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-stone-300 bg-white/60 hover:bg-cream-200/80 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  See How It Works
                </a>
              </div>

              {/* Stats Strip */}
              <div className="pt-6 border-t border-hairline/80 flex items-center justify-between sm:justify-start sm:gap-12 text-stone-800">
                <div>
                  <span className="block text-xl font-bold tracking-tight">10K+</span>
                  <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider">
                    Students Planning
                  </span>
                </div>
                <div>
                  <span className="block text-xl font-bold tracking-tight">4.8/5</span>
                  <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider">
                    User Rating
                  </span>
                </div>
                <div>
                  <span className="block text-xl font-bold tracking-tight text-maroon-800">FREE</span>
                  <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider">
                    No Credit Card
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Right Composition: Full Responsive Dashboard Preview (6 cols) */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-xl lg:max-w-none transform transition-transform hover:scale-[1.01] duration-300">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </div>

        {/* Subtle scroll cue */}
        <div className="hidden lg:flex absolute left-8 bottom-6 items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-stone-400 rotate-90 origin-bottom-left">
          <span>SCROLL</span>
          <span className="w-8 h-px bg-stone-300" />
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* FAQ Section */}
      <FaqSection />

      {/* Testimonials Section (Positioned below FAQ as requested in Section 3) */}
      <TestimonialsSection />

      {/* Final Call to Action */}
      <FinalCtaSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
