'use client';

import { useEffect, useState } from 'react';
import { useJobPoll } from '@/lib/useJobPoll';
import AuditReport from './AuditReport';

const STEP_LABEL = {
  queued: 'Waiting to start…',
  crawling: 'Reading your website…',
  analyzing: 'Analyzing with AI…',
  finished: 'Finishing up…',
};

// Same behavior as the Phase 1 brand page, moved into a tab.
export default function AuditPanel({ brandId }) {
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const { start, stop } = useJobPoll();

  const isDone = (d) => d.audit.status === 'done' || d.audit.status === 'failed';
  const onData = (d, err) => (err ? setError(err) : setAudit(d.audit));

  useEffect(() => {
    (async () => {
      const list = await (await fetch(`/api/brands/${brandId}/audits`)).json();
      const latest = list.audits?.[0];
      if (!latest) return;
      const full = await (await fetch(`/api/audits/${latest._id}`)).json();
      setAudit(full.audit);
      if (!isDone(full)) start(`/api/audits/${latest._id}`, onData, isDone);
    })();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  async function runAudit() {
    setStarting(true);
    setError('');
    const res = await fetch(`/api/brands/${brandId}/audits`, { method: 'POST' });
    const data = await res.json();
    setStarting(false);
    if (res.status === 409 && data.auditId) return start(`/api/audits/${data.auditId}`, onData, isDone);
    if (!res.ok) return setError(data.error || 'Could not start the audit');
    setAudit({ _id: data.auditId, status: 'queued', step: 'queued' });
    start(`/api/audits/${data.auditId}`, onData, isDone);
  }

  const running = audit && (audit.status === 'queued' || audit.status === 'running');

  return (
    <div>
      <div className="flex items-center gap-4">
        <button
          onClick={runAudit}
          disabled={starting || running}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60"
        >
          {audit?.status === 'done' ? 'Run a new audit' : 'Run audit'}
        </button>
        {running && <span className="text-sm text-slate-600">{STEP_LABEL[audit.step] || 'Working…'}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      {audit?.status === 'failed' && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">Audit failed: {audit.error}</div>
      )}
      {audit?.status === 'done' && <AuditReport audit={audit} />}
      {!audit && <p className="mt-8 text-sm text-slate-600">No audit yet. Run one to see what the AI finds on this website.</p>}
    </div>
  );
}
