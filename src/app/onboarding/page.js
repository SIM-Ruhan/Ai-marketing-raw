'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

function slugify(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace';
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Returning user who has workspaces but none active yet: activate the first and continue.
  useEffect(() => {
    (async () => {
      const { data } = await authClient.organization.list();
      if (data && data.length > 0) {
        await authClient.organization.setActive({ organizationId: data[0].id });
        router.replace('/dashboard');
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    const { data, error } = await authClient.organization.create({
      name: name.trim(),
      slug: slugify(name),
    });
    if (error || !data) {
      setError(error?.message || 'Could not create the workspace');
      setBusy(false);
      return;
    }
    await authClient.organization.setActive({ organizationId: data.id });
    router.replace('/dashboard/user');
  }

  if (checking) return <main className="p-10 text-slate-600">Loading…</main>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleCreate} className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Create your workspace</h1>
        <p className="mt-2 text-sm text-slate-600">
          A workspace holds your brands and audits. Agencies can create one per client.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Marketing"
          maxLength={80}
          required
          className="mt-6 w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="mt-6 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create workspace'}
        </button>
      </form>
    </main>
  );
}
