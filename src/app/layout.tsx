import type { Metadata } from 'next';
import './globals.css';
import { ReactQueryProvider } from '@/lib/queryClient';
import { LenisProvider } from '@/components/smooth-scroll/LenisProvider';
import { CustomCursor } from '@/components/cursor/CustomCursor';

export const metadata: Metadata = {
  title: 'TODOonSTEROIDS — Turn your syllabus into a study plan',
  description:
    'Transform ChatGPT-generated study plans into organized daily tasks, weekly goals, and progress tracking with advanced analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream selection:bg-maroon-100 selection:text-maroon-900 font-sans">
        <ReactQueryProvider>
          <LenisProvider>
            <CustomCursor />
            {children}
          </LenisProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
