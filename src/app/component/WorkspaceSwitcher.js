'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function WorkspaceSwitcher() {
  const router = useRouter();
  const { data: orgs } = authClient.useListOrganizations();
  const { data: active } = authClient.useActiveOrganization();
  const [busy, setBusy] = useState(false);

  async function switchTo(organizationId) {
    if (!organizationId || organizationId === active?.id) return;
    setBusy(true);
    await authClient.organization.setActive({ organizationId });
    router.refresh();
    window.location.reload(); // simplest way to reset all client data for the new workspace
  }

  async function createNew() {
    const name = window.prompt('Name for the new workspace');
    if (!name?.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6);
    const { data } = await authClient.organization.create({ name: name.trim(), slug });
    if (data) await switchTo(data.id);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={active?.id || ''}
        disabled={busy || !orgs}
        onChange={(e) => switchTo(e.target.value)}
        className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
        aria-label="Switch workspace"
      >
        {(orgs || []).map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <button onClick={createNew} className="text-sm px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">
        New workspace
      </button>
    </div>
  );
}
