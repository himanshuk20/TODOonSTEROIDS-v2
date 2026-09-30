import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function NoPlanEmptyState() {
  return (
    <div className="grid min-h-[60vh] place-items-center animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-hairline bg-cream-50/90 p-8 text-center shadow-card sm:p-10">
        <p className="text-[11px] font-mono uppercase tracking-widest text-maroon-800">YOUR STUDY SPACE</p>
        <h1 className="mt-2 font-editorial text-3xl font-bold text-stone-900">Add a plan to get started</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600">
          Import a study plan to see your tasks, subjects, and progress here.
        </p>
        <Link
          href="/get-started"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-maroon-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-maroon-900"
        >
          Add a plan <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
