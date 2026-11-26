function Evidence({ urls }) {
  if (!urls?.length) return <span className="text-xs text-slate-400">No source page cited</span>;
  return (
    <span className="text-xs text-slate-500">
      Source:{' '}
      {urls.map((u, i) => (
        <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
          page {i + 1}{i < urls.length - 1 ? ', ' : ''}
        </a>
      ))}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function AuditReport({ audit }) {
  const r = audit.result;
  const m = audit.meta || {};
  if (!r) return null;

  return (
    <div>
      <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
        AI-generated from {m.pagesCrawled} page{m.pagesCrawled === 1 ? '' : 's'} crawled on{' '}
        {new Date(m.crawledAt).toLocaleString()}. These are hypotheses to review, not verified facts.
        {m.pagesFailed > 0 && ` ${m.pagesFailed} page(s) could not be read.`}
      </div>

      <Section title="Summary">
        <p className="text-slate-700 text-sm leading-relaxed">{r.summary}</p>
      </Section>

      <Section title="Positioning">
        <p className="text-slate-800 text-sm">{r.positioning.valueProposition}</p>
        {r.positioning.tone && <p className="text-sm text-slate-500 mt-1">Tone: {r.positioning.tone}</p>}
        <div className="mt-2"><Evidence urls={r.positioning.evidenceUrls} /></div>
      </Section>

      <Section title="Target audience">
        <div className="grid gap-4">
          {r.audience.map((a, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{a.segment}</h3>
                <span className="text-xs text-slate-500">Confidence: {a.confidence}</span>
              </div>
              <p className="text-sm text-slate-700 mt-1">{a.profile}</p>
              {a.painPoints.length > 0 && (
                <ul className="list-disc ml-5 mt-2 text-sm text-slate-700">
                  {a.painPoints.map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              )}
              <div className="mt-2"><Evidence urls={a.evidenceUrls} /></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="SEO">
        <div className="grid gap-3">
          {r.seo.findings.map((f, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4">
              <div className="font-medium text-slate-900 text-sm">{f.issue}</div>
              <div className="text-sm text-slate-700 mt-1">{f.recommendation}</div>
              <div className="mt-2"><Evidence urls={f.evidenceUrls} /></div>
            </div>
          ))}
        </div>
        {r.seo.keywordIdeas.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-slate-900">Keyword ideas (suggestions, no search volume data)</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {r.seo.keywordIdeas.map((k, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{k}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Funnel gaps">
        <div className="grid gap-3">
          {r.funnelGaps.map((g, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-indigo-700">{g.stage}</div>
              <div className="font-medium text-slate-900 text-sm mt-1">{g.gap}</div>
              <div className="text-sm text-slate-700 mt-1">{g.suggestion}</div>
              <div className="mt-2"><Evidence urls={g.evidenceUrls} /></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Opportunities">
        <div className="grid gap-3">
          {r.opportunities.map((o, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900 text-sm">{o.title}</h3>
                <span className="text-xs text-slate-500">Impact: {o.impact}</span>
              </div>
              <p className="text-sm text-slate-700 mt-1">{o.description}</p>
              <div className="mt-2"><Evidence urls={o.evidenceUrls} /></div>
            </div>
          ))}
        </div>
      </Section>

      {r.unknowns.length > 0 && (
        <Section title="What the AI could not determine">
          <ul className="list-disc ml-5 text-sm text-slate-700">
            {r.unknowns.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        </Section>
      )}
    </div>
  );
}
