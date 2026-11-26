// 'use client';

// import { useEffect, useRef, useState, use } from 'react';
// import AuditReport from '@/components/AuditReport';

// const STEP_LABEL = {
//   queued: 'Waiting to start…',
//   crawling: 'Reading your website…',
//   analyzing: 'Analyzing with AI…',
//   finished: 'Finishing up…',
// };

// export default function BrandDetailPage({ params }) {
//   const { id } = use(params); // Next 15: params is a Promise
//   const [brand, setBrand] = useState(null);
//   const [audit, setAudit] = useState(null); // currently displayed audit (with result)
//   const [error, setError] = useState('');
//   const [starting, setStarting] = useState(false);
//   const pollRef = useRef(null);

//   function stopPolling() {
//     if (pollRef.current) clearInterval(pollRef.current);
//     pollRef.current = null;
//   }

//   function startPolling(auditId) {
//     stopPolling();
//     pollRef.current = setInterval(async () => {
//       const res = await fetch(`/api/audits/${auditId}`);
//       const data = await res.json();
//       if (!res.ok) {
//         stopPolling();
//         return setError(data.error || 'Lost track of the audit');
//       }
//       setAudit(data.audit);
//       if (data.audit.status === 'done' || data.audit.status === 'failed') stopPolling();
//     }, 2500);
//   }

//   useEffect(() => {
//     (async () => {
//       const bRes = await fetch(`/api/brands/${id}`);
//       const bData = await bRes.json();
//       if (!bRes.ok) return setError(bData.error || 'Brand not found');
//       setBrand(bData.brand);

//       const aRes = await fetch(`/api/brands/${id}/audits`);
//       const aData = await aRes.json();
//       const latest = aData.audits?.[0];
//       if (latest) {
//         const full = await (await fetch(`/api/audits/${latest._id}`)).json();
//         setAudit(full.audit);
//         if (full.audit.status === 'queued' || full.audit.status === 'running') startPolling(latest._id);
//       }
//     })();
//     return stopPolling;
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id]);

//   async function runAudit() {
//     setStarting(true);
//     setError('');
//     const res = await fetch(`/api/brands/${id}/audits`, { method: 'POST' });
//     const data = await res.json();
//     setStarting(false);
//     if (res.status === 409 && data.auditId) return startPolling(data.auditId);
//     if (!res.ok) return setError(data.error || 'Could not start the audit');
//     setAudit({ _id: data.auditId, status: 'queued', step: 'queued' });
//     startPolling(data.auditId);
//   }

//   if (error && !brand) return <p className="text-red-600">{error}</p>;
//   if (!brand) return <p className="text-slate-500">Loading…</p>;

//   const running = audit && (audit.status === 'queued' || audit.status === 'running');

//   return (
//     <div>
//       <h1 className="text-2xl font-bold text-slate-900">{brand.name}</h1>
//       <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
//         {brand.websiteUrl}
//       </a>

//       <div className="mt-6 flex items-center gap-4">
//         <button
//           onClick={runAudit}
//           disabled={starting || running}
//           className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60"
//         >
//           {audit?.status === 'done' ? 'Run a new audit' : 'Run audit'}
//         </button>
//         {running && <span className="text-sm text-slate-600">{STEP_LABEL[audit.step] || 'Working…'}</span>}
//         {error && <span className="text-sm text-red-600">{error}</span>}
//       </div>

//       {audit?.status === 'failed' && (
//         <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
//           Audit failed: {audit.error}
//         </div>
//       )}

//       {audit?.status === 'done' && <AuditReport audit={audit} />}
//       {!audit && <p className="mt-8 text-sm text-slate-600">No audit yet. Run one to see what the AI finds on this website.</p>}
//     </div>
//   );
// }



'use client';

import AuditPanel from '@/app/component/AuditPanel';
import CompetitorsPanel from '@/app/component/CompetitorsPanel';
import FunnelPanel from '@/app/component/FunnelPanel';
import { useEffect, useState, use } from 'react';


const TABS = ['Audit', 'Competitors', 'Funnel'];

// Replaces the Phase 1 brand page: same header, plus tabs.
export default function BrandDetailPage({ params }) {
  const { id } = use(params);
  const [brand, setBrand] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Audit');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/brands/${id}`);
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Brand not found');
      setBrand(data.brand);
    })();
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!brand) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{brand.name}</h1>
      <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
        {brand.websiteUrl}
      </a>

      <div role="tablist" className="mt-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
              tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Audit' && <AuditPanel brandId={id} />}
        {tab === 'Competitors' && <CompetitorsPanel brandId={id} />}
        {tab === 'Funnel' && <FunnelPanel brandId={id} />}
      </div>
    </div>
  );
}
