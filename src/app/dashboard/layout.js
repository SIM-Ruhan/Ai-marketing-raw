import { Suspense } from 'react';
import Link from 'next/link';
import { requirePageSession } from '@/lib/guard';
import WorkspaceSwitcher from '../component/WorkspaceSwitcher';


// Next.js 16 (cacheComponents) requires request-time data (cookies/headers) to be read inside <Suspense>.
// The static fallback shows instantly; the session check streams in after it.
async function DashboardShell({ children }) {
  const session = await requirePageSession(); // not signed in -> /login, no workspace -> /onboarding

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-700">
            <Link href="/" className="font-bold text-slate-900">Marketing OS</Link>
            <Link href="/" className="hover:text-indigo-600">Back to Home</Link>
            <Link href="/dashboard/brands" className="hover:text-indigo-600">Brands</Link>
          </nav>
          <div className="flex items-center gap-4">
            <WorkspaceSwitcher />
            <span className="text-xs text-slate-500 hidden sm:inline">{session.user.email}</span>
          </div>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-10 text-sm text-slate-500">Loading…</div>}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
