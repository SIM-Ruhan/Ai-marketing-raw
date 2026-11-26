import Evidence from "./Evidence";


function Section({ title, children }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function PriceTable({ rows, showCompetitor }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No prices were found on the pages we read.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            {showCompetitor && <th className="py-1 pr-4">Competitor</th>}
            <th className="py-1 pr-4">Item</th>
            <th className="py-1 pr-4">Price (as written)</th>
            <th className="py-1">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              {showCompetitor && <td className="py-2 pr-4">{r.competitor}</td>}
              <td className="py-2 pr-4">{r.item}</td>
              <td className="py-2 pr-4 font-medium">{r.price}</td>
              <td className="py-2"><Evidence urls={[r.evidenceUrl]} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComparisonReport({ comparison }) {
  const r = comparison.result;
  const m = comparison.meta || {};
  if (!r) return null;

  return (
    <div>
      <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
        AI-generated from pages crawled on {new Date(m.comparedAt).toLocaleString()}. Compared:{' '}
        {m.competitorsCompared?.map((c) => c.name).join(', ')}. These are hypotheses to review, not verified facts.
        {m.competitorsFailed?.length > 0 && (
          <div className="mt-1">
            Could not read: {m.competitorsFailed.map((c) => `${c.name} (${c.reason})`).join('; ')}.
          </div>
        )}
      </div>

      <Section title="Summary"><p className="text-sm text-slate-700 leading-relaxed">{r.summary}</p></Section>

      <Section title="Positioning differences">
        <div className="grid gap-4">
          {r.positioningDifferences.map((d, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 text-sm">{d.aspect}</h3>
              <p className="text-sm text-slate-700 mt-1"><span className="font-medium">This brand:</span> {d.brand}</p>
              <ul className="mt-1 text-sm text-slate-700 list-disc ml-5">
                {d.competitors.map((c, j) => <li key={j}><span className="font-medium">{c.name}:</span> {c.observation}</li>)}
              </ul>
              <div className="mt-2"><Evidence urls={d.evidenceUrls} /></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Messaging gaps">
        <div className="grid gap-3">
          {r.messagingGaps.map((g, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4">
              <div className="font-medium text-slate-900 text-sm">{g.gap}</div>
              <div className="text-sm text-slate-700 mt-1">{g.recommendation}</div>
              <div className="mt-2"><Evidence urls={g.evidenceUrls} /></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pricing seen on websites">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">This brand</h3>
        <PriceTable rows={r.pricing.brandPrices} />
        <h3 className="text-sm font-semibold text-slate-900 mt-5 mb-2">Competitors</h3>
        <PriceTable rows={r.pricing.competitorPrices} showCompetitor />
        <p className="text-xs text-slate-500 mt-3">
          Only prices found word-for-word on the crawled pages are shown.
          {r.pricing.droppedUnverifiedPrices > 0 && ` ${r.pricing.droppedUnverifiedPrices} AI-reported price(s) were removed because they could not be verified on the page.`}
        </p>
        {r.pricing.note && <p className="text-sm text-slate-600 mt-2">{r.pricing.note}</p>}
      </Section>

      {r.strengthsToLeanOn.length > 0 && (
        <Section title="Strengths to lean on">
          <div className="grid gap-3">
            {r.strengthsToLeanOn.map((s, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4">
                <div className="text-sm text-slate-800">{s.strength}</div>
                <div className="mt-2"><Evidence urls={s.evidenceUrls} /></div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {r.unknowns.length > 0 && (
        <Section title="What the AI could not determine">
          <ul className="list-disc ml-5 text-sm text-slate-700">{r.unknowns.map((u, i) => <li key={i}>{u}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}
