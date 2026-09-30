import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-hairline/80 py-12 bg-cream-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-1.5">
          <span className="font-extrabold tracking-tight text-lg text-stone-900">
            TODO<span className="font-editorial italic font-normal text-maroon-800 text-xl">on</span>STEROIDS
          </span>
        </Link>

        <div className="flex items-center gap-6 text-xs text-stone-500 font-medium uppercase tracking-wider">
          <a href="#features" className="hover:text-maroon-800 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-maroon-800 transition-colors">
            How It Works
          </a>
          <a href="#is-it-free" className="hover:text-maroon-800 transition-colors">
            Is It Free
          </a>
          <a href="#testimonials" className="hover:text-maroon-800 transition-colors">
            Testimonials
          </a>
          <a href="#faq" className="hover:text-maroon-800 transition-colors">
            FAQ
          </a>
          <a href="https://himanshupm.vercel.app" target="_blank" rel="noopener noreferrer" className="text-maroon-800 font-semibold hover:text-maroon-900 transition-colors">
            Builder
          </a>
        </div>

        <p className="text-xs text-stone-400 font-mono">
          © 2026 TODOonSTEROIDS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
