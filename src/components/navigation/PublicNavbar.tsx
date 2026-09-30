'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useLenis } from '@/components/smooth-scroll/LenisProvider';

interface PublicNavbarProps {
  isAuthenticated?: boolean;
}

export function PublicNavbar({ isAuthenticated = false }: PublicNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const { scrollTo } = useLenis();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    e.currentTarget.closest('details')?.removeAttribute('open');
    const element = document.getElementById(targetId);
    if (element) {
      scrollTo(element, { offset: -80 });
    } else {
      router.push(`/#${targetId}`);
    }
  };

  // Context-sensitive logo destination
  const logoHref = isAuthenticated ? '/tasks' : '/';

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 border-b ${
        scrolled
          ? 'bg-cream/90 backdrop-blur-md border-hairline/80 shadow-sm'
          : 'bg-transparent border-hairline/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href={logoHref}
          className="group flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800 rounded px-1"
        >
          <span className="font-extrabold tracking-tight text-xl text-stone-900 group-hover:text-stone-700 transition-colors">
            TODO<span className="font-editorial italic font-normal text-maroon-800 text-2xl">on</span>STEROIDS
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] tracking-wider uppercase font-medium text-stone-600">
          <a
            href="#features"
            onClick={(e) => handleNavClick(e, 'features')}
            className="hover:text-maroon-800 transition-colors focus:outline-none focus-visible:text-maroon-800"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => handleNavClick(e, 'how-it-works')}
            className="hover:text-maroon-800 transition-colors focus:outline-none focus-visible:text-maroon-800"
          >
            How It Works
          </a>
          <a
            href="#is-it-free"
            onClick={(e) => handleNavClick(e, 'is-it-free')}
            className="hover:text-maroon-800 transition-colors text-maroon-800 font-semibold focus:outline-none focus-visible:ring-1 focus-visible:ring-maroon-800 rounded px-1"
          >
            Is It Free
          </a>
          <a
            href="#testimonials"
            onClick={(e) => handleNavClick(e, 'testimonials')}
            className="hover:text-maroon-800 transition-colors focus:outline-none focus-visible:text-maroon-800"
          >
            Testimonials
          </a>
          <a
            href="#faq"
            onClick={(e) => handleNavClick(e, 'faq')}
            className="hover:text-maroon-800 transition-colors focus:outline-none focus-visible:text-maroon-800"
          >
            FAQ
          </a>
          <a
            href="https://himanshupm.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-maroon-800 font-semibold hover:text-maroon-900 transition-colors focus:outline-none focus-visible:text-maroon-900"
          >
            Builder
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-maroon-800 text-cream-50 text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-all shadow-sm active:scale-95"
            >
              Go to App <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold uppercase tracking-wider text-stone-700 hover:text-maroon-800 px-3 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800 rounded"
              >
                Sign In
              </Link>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-maroon-800 text-cream-50 text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-all shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-maroon-800"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Native mobile disclosure keeps the menu toggle responsive before hydration */}
        <div className="flex md:hidden items-center">
          <details className="mobile-menu-details relative">
            <summary
              aria-label="Toggle navigation menu"
              aria-controls="mobile-navigation-menu"
              className="mobile-menu-trigger list-none p-2 text-stone-700 hover:text-maroon-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800 rounded-lg"
            >
              <Menu className="mobile-menu-open-icon w-6 h-6" />
              <X className="mobile-menu-close-icon w-6 h-6" />
            </summary>

            <div
              id="mobile-navigation-menu"
              className="mobile-navigation-drawer fixed inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto bg-cream-50/98 backdrop-blur-lg border-b border-hairline p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200"
            >
              <nav aria-label="Mobile navigation" className="flex flex-col space-y-3 text-sm font-medium uppercase tracking-wider text-stone-700">
                <a href="/#features" onClick={(e) => handleNavClick(e, 'features')} className="py-2 px-3 rounded hover:bg-cream-200 transition-colors">
                  Features
                </a>
                <a href="/#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="py-2 px-3 rounded hover:bg-cream-200 transition-colors">
                  How It Works
                </a>
                <a href="/#is-it-free" onClick={(e) => handleNavClick(e, 'is-it-free')} className="py-2 px-3 rounded text-maroon-800 font-bold bg-maroon-50 transition-colors">
                  Is It Free
                </a>
                <a href="/#testimonials" onClick={(e) => handleNavClick(e, 'testimonials')} className="py-2 px-3 rounded hover:bg-cream-200 transition-colors">
                  Testimonials
                </a>
                <a href="/#faq" onClick={(e) => handleNavClick(e, 'faq')} className="py-2 px-3 rounded hover:bg-cream-200 transition-colors">
                  FAQ
                </a>
                <a href="https://himanshupm.vercel.app" target="_blank" rel="noopener noreferrer" className="py-2 px-3 rounded text-maroon-800 font-bold hover:bg-cream-200 transition-colors">
                  Builder
                </a>
              </nav>

              <div className="pt-4 border-t border-hairline flex flex-col gap-3">
                {isAuthenticated ? (
                  <Link
                    href="/tasks"
                    onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
                    className="w-full text-center py-2.5 rounded-full bg-maroon-800 text-white text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-colors"
                  >
                    Go to App
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
                      className="w-full text-center py-2 rounded-lg border border-hairline text-xs font-semibold uppercase tracking-wider text-stone-800 hover:bg-cream-200 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/get-started"
                      onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
                      className="w-full text-center py-2.5 rounded-full bg-maroon-800 text-white text-xs font-semibold uppercase tracking-wider hover:bg-maroon-900 transition-colors shadow-sm"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
