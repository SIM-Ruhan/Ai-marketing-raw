'use client';

import { useEffect, useState } from 'react';
import Evidence from './Evidence';


const lines = (arr) => (arr || []).join('\n');
const toList = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);

function toDraft(funnel) {
  return {
    overview: funnel.overview,
    stages: funnel.stages.map((s) => ({
      ...s,
      channelsText: lines(s.channels),
      contentText: lines(s.contentIdeas),
      kpisText: lines(s.kpis),
    })),
  };
}

export default function FunnelPanel({ brandId }) {
  const [versions, setVersions] = useState(null); // metadata list
  const [funnel, setFunnel] = useState(null); // full funnel being shown
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  function show(f) {
    setFunnel(f);
    setDraft(toDraft(f));
    setDirty(false);
  }

  async function loadList(selectLatest = false) {
    const res = await fetch(`/api/brands/${brandId}/funnels`);
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Failed to load funnels');
    setVersions(data.funnels);
    if (selectLatest && data.funnels[0]) await open(data.funnels[0]._id);
  }

  async function open(id) {
    const res = await fetch(`/api/funnels/${id}`);
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Could not open that version');
    show(data.funnel);
  }

  useEffect(() => {
    loadList(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  async function generate() {
    if (dirty && !window.confirm('You have unsaved edits. Generate a new version anyway?')) return;
    setBusy('generate');
    setError('');
    const res = await fetch(`/api/brands/${brandId}/funnels`, { method: 'POST' });
    const data = await res.json();
    setBusy('');
    if (!res.ok) return setError(data.error || 'Could not generate the funnel');
    show(data.funnel);
    loadList();
  }

  async function saveVersion() {
    setBusy('save');
    setError('');
    const stages = draft.stages.map((s) => ({
      stage: s.stage,
      goal: s.goal,
      channels: toList(s.channelsText),
      contentIdeas: toList(s.contentText),
      kpis: toList(s.kpisText),
      basedOn: s.basedOn,
      evidenceUrls: s.evidenceUrls,
    }));
    const res = await fetch(`/api/funnels/${funnel._id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overview: draft.overview, stages }),
    });
    const data = await res.json();
    setBusy('');
    if (!res.ok) return setError(data.error || 'Could not save');
    show(data.funnel);
    loadList();
  }

  function editStage(i, patch) {
    setDraft((d) => ({ ...d, stages: d.stages.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
    setDirty(true);
  }

  const area = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={generate} disabled={busy === 'generate'} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60">
          {busy === 'generate' ? 'Generating…' : versions?.length ? 'Generate a new version' : 'Generate funnel'}
        </button>
        {versions?.length > 0 && (
          <select
            value={funnel?._id || ''}
            onChange={(e) => open(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
            aria-label="Funnel version"
          >
            {versions.map((v) => (
              <option key={v._id} value={v._id}>
                Version {v.version} ({v.source === 'ai' ? 'AI' : 'edited'}) · {new Date(v.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {versions === null && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {versions?.length === 0 && (
        <p className="mt-6 text-sm text-slate-600">No funnel yet. Run an audit first, then generate a funnel from it.</p>
      )}

      {funnel && draft && (
        <div className="mt-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
            Draft v{funnel.version}. Written by {funnel.source === 'ai' ? 'AI' : 'you (edited)'}, based on your latest audit
            {funnel.sources?.comparisonId ? ' and competitor comparison' : ''}. Nothing here is published anywhere.
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-slate-900">Overview</label>
            <textarea className={`${area} mt-1`} rows={3} value={draft.overview} onChange={(e) => { setDraft({ ...draft, overview: e.target.value }); setDirty(true); }} />
          </div>

          <div className="mt-4 grid gap-4">
            {draft.stages.map((s, i) => (
              <section key={s.stage} className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="font-bold text-slate-900 capitalize">{s.stage}</h3>
                <label className="block text-xs font-medium text-slate-600 mt-3">Goal</label>
                <textarea className={area} rows={2} value={s.goal} onChange={(e) => editStage(i, { goal: e.target.value })} />
                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Channels (one per line)</label>
                    <textarea className={area} rows={4} value={s.channelsText} onChange={(e) => editStage(i, { channelsText: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Content ideas</label>
                    <textarea className={area} rows={4} value={s.contentText} onChange={(e) => editStage(i, { contentText: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">KPIs to track</label>
                    <textarea className={area} rows={4} value={s.kpisText} onChange={(e) => editStage(i, { kpisText: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-600">
                  Based on: {s.basedOn || 'not specified'} · <Evidence urls={s.evidenceUrls} />
                </div>
              </section>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button onClick={saveVersion} disabled={!dirty || busy === 'save'} className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-50">
              {busy === 'save' ? 'Saving…' : 'Save as new version'}
            </button>
            {dirty && <span className="text-xs text-slate-500">Unsaved edits. Saving keeps the previous version.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
