'use client';

import { useEffect, useState } from 'react';
import { useJobPoll } from '@/lib/useJobPoll';
import ComparisonReport from './ComparisonReport';

const STEP_LABEL = {
  queued: 'Waiting to start…',
  crawling: 'Reading competitor websites…',
  analyzing: 'Comparing with AI…',
  finished: 'Finishing up…',
};

export default function CompetitorsPanel({ brandId }) {
  const [competitors, setCompetitors] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [form, setForm] = useState({ name: '', websiteUrl: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const { start, stop } = useJobPoll();

  const isDone = (d) => d.comparison.status === 'done' || d.comparison.status === 'failed';
  const onData = (d, err) => (err ? setError(err) : setComparison(d.comparison));

  async function loadCompetitors() {
    const res = await fetch(`/api/brands/${brandId}/competitors`);
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Failed to load competitors');
    setCompetitors(data.competitors);
  }

  useEffect(() => {
    loadCompetitors();
    (async () => {
      const list = await (await fetch(`/api/brands/${brandId}/comparisons`)).json();
      const latest = list.comparisons?.[0];
      if (!latest) return;
      const full = await (await fetch(`/api/comparisons/${latest._id}`)).json();
      setComparison(full.comparison);
      if (!isDone(full)) start(`/api/comparisons/${latest._id}`, onData, isDone);
    })();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  async function call(label, fn) {
    setBusy(label);
    setError('');
    try {
      await fn();
    } finally {
      setBusy('');
    }
  }

  const addCompetitor = (e) => {
    e.preventDefault();
    return call('add', async () => {
      const res = await fetch(`/api/brands/${brandId}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Could not add the competitor');
      setForm({ name: '', websiteUrl: '' });
      loadCompetitors();
    });
  };

  const suggest = () =>
    call('suggest', async () => {
      const res = await fetch(`/api/brands/${brandId}/competitors/suggest`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Could not get suggestions');
      if (data.added === 0) setError('The AI had no confident suggestions. Add competitors by URL instead.');
      loadCompetitors();
    });

  const confirm = (id) =>
    call('confirm', async () => {
      const res = await fetch(`/api/competitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Could not confirm');
      loadCompetitors();
    });

  const remove = (id) =>
    call('remove', async () => {
      await fetch(`/api/competitors/${id}`, { method: 'DELETE' });
      loadCompetitors();
    });

  const compare = () =>
    call('compare', async () => {
      const res = await fetch(`/api/brands/${brandId}/comparisons`, { method: 'POST' });
      const data = await res.json();
      if (res.status === 409 && data.comparisonId) return start(`/api/comparisons/${data.comparisonId}`, onData, isDone);
      if (!res.ok) return setError(data.error || 'Could not start the comparison');
      setComparison({ _id: data.comparisonId, status: 'queued', step: 'queued' });
      start(`/api/comparisons/${data.comparisonId}`, onData, isDone);
    });

  const confirmedCount = (competitors || []).filter((c) => c.confirmed).length;
  const running = comparison && (comparison.status === 'queued' || comparison.status === 'running');
  const input = 'px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm';

  return (
    <div>
      <form onSubmit={addCompetitor} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-3">
        <input className={`${input} sm:w-56`} placeholder="Name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={`${input} flex-1`} placeholder="Competitor website, e.g. https://rival.com" required value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
        <button disabled={busy === 'add'} className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60">
          Add competitor
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={suggest} disabled={busy === 'suggest'} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm disabled:opacity-60">
          {busy === 'suggest' ? 'Asking AI…' : 'Suggest competitors with AI'}
        </button>
        <span className="text-xs text-slate-500">Suggestions come from the AI&apos;s general knowledge, so check each one before confirming.</span>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        {competitors === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : competitors.length === 0 ? (
          <p className="text-sm text-slate-600">No competitors yet. Add one by URL, or ask the AI for suggestions.</p>
        ) : (
          <ul className="grid gap-3">
            {competitors.map((c) => (
              <li key={c._id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                  <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline break-all">{c.websiteUrl}</a>
                  {c.source === 'ai_suggested' && !c.confirmed && (
                    <div className="mt-1 text-xs text-amber-700">AI suggestion, not verified. It won&apos;t be read until you confirm it.{c.note ? ` Reason: ${c.note}` : ''}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!c.confirmed && (
                    <button onClick={() => confirm(c._id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">Confirm</button>
                  )}
                  <button onClick={() => remove(c._id)} className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          onClick={compare}
          disabled={confirmedCount === 0 || running || busy === 'compare'}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60"
        >
          {comparison?.status === 'done' ? 'Run a new comparison' : 'Compare with competitors'}
        </button>
        {confirmedCount === 0 && <span className="text-xs text-slate-500">Confirm at least one competitor first.</span>}
        {running && <span className="text-sm text-slate-600">{STEP_LABEL[comparison.step] || 'Working…'}</span>}
      </div>

      {comparison?.status === 'failed' && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">Comparison failed: {comparison.error}</div>
      )}
      {comparison?.status === 'done' && <ComparisonReport comparison={comparison} />}
    </div>
  );
}
