'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch('/api/analyze');
      const data = await res.json();
      if (data.success) {
        setHistory(data.analyses);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setAnalysis(data.analysis);
      setUrl('');
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Advanced parser to transform raw Gemini text into rich visual UI components
  const renderStructuredAnalysis = (text) => {
    if (!text) return null;

    const sections = text.split(/(?=^##\s)/gm);

    return sections.map((section, index) => {
      const lines = section.trim().split('\n');
      const title = lines[0]?.replace(/^##\s+/, '') || 'Strategy Overview';
      const bodyLines = lines.slice(1);

      if (!title) return null;

      // Check if this section contains numbered segments (like Target Audience: 1. ..., 2. ...)
      const fullContentText = bodyLines.join('\n');
      const segments = fullContentText.split(/(?=\n\d+\.\s+\*\*)/g);

      return (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 mb-6 hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          {/* Left Gradient Accent Bar */}
          <div className="absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-indigo-500 to-violet-600"></div>

          {/* Section Heading */}
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="text-2xl">{title.split(' ')[0]}</span>
            <span>{title.split(' ').slice(1).join(' ')}</span>
          </h3>

          {/* Render structured items or standard body */}
          {segments.length > 1 ? (
            <div className="space-y-6">
              {segments.map((seg, segIdx) => {
                const segLines = seg.trim().split('\n');
                const headerLine = segLines[0] || '';
                const subBullets = segLines.slice(1);

                return (
                  <div key={segIdx} className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/60">
                    <h4 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                        {segIdx + 1}
                      </span>
                      {headerLine.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      {subBullets.map((bullet, bIdx) => {
                        const cleanBullet = bullet.replace(/^-\s*/, '').trim();
                        if (!cleanBullet) return null;

                        // Parse fields like **Profile:**, **Psychographics:**, **Pain Point:**
                        let badgeLabel = '';
                        let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                        let badgeIcon = '👤';
                        let contentText = cleanBullet;

                        if (cleanBullet.includes('**Profile:**')) {
                          badgeLabel = 'Profile';
                          badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                          badgeIcon = '👥';
                          contentText = cleanBullet.replace(/\*\*Profile:\*\*/g, '').trim();
                        } else if (cleanBullet.includes('**Psychographics:**')) {
                          badgeLabel = 'Psychographics';
                          badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                          badgeIcon = '🧠';
                          contentText = cleanBullet.replace(/\*\*Psychographics:\*\*/g, '').trim();
                        } else if (cleanBullet.includes('**Pain Point:**')) {
                          badgeLabel = 'Pain Point';
                          badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                          badgeIcon = '🎯';
                          contentText = cleanBullet.replace(/\*\*Pain Point:\*\*/g, '').trim();
                        }

                        if (badgeLabel) {
                          return (
                            <div key={bIdx} className={`rounded-xl p-3.5 border ${badgeColor} flex flex-col justify-between shadow-xs`}>
                              <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider mb-1.5 opacity-90">
                                <span>{badgeIcon}</span> {badgeLabel}
                              </div>
                              <p className="text-xs sm:text-sm text-slate-700 leading-snug">
                                {contentText.replace(/\*\*/g, '')}
                              </p>
                            </div>
                          );
                        }

                        // Fallback for regular bullet points
                        return (
                          <div key={bIdx} className="col-span-full bg-white rounded-lg p-3 border border-slate-200 text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>{cleanBullet.replace(/\*\*/g, '')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Standard formatting for sections like SEO, CRO, etc.
            <div className="text-slate-700 text-sm sm:text-base space-y-3 leading-relaxed whitespace-pre-wrap">
              {fullContentText.replace(/\*\*/g, '')}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 mb-3">
            ✨ Powered by Google Gemini & Next.js
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            AI Website Marketing Strategist
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Drop your website URL below to generate deep, multi-channel marketing strategies instantly.
          </p>
        </div>

        {/* Input Form Card */}
        <div className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl p-6 sm:p-8 mb-10 border border-slate-200/80">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="url"
                required
                placeholder="https://nutrighor.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-xl shadow-inner focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-base transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center items-center px-8 py-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/20 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-60 transition-all transform active:scale-95 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-3 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Site...
                </span>
              ) : (
                'Generate Strategy'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        {/* Dynamic Structured Results Dashboard */}
        {analysis && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                📊 Marketing Strategy Report
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                Generated Live
              </span>
            </div>
            {renderStructuredAnalysis(analysis)}
          </div>
        )}

        {/* Recent Search History */}
        {history.length > 0 && (
          <div className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl p-6 sm:p-8 border border-slate-200/80">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🕒</span> Past Reports
            </h3>
            <div className="divide-y divide-slate-100">
              {history.map((item) => (
                <div key={item._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm sm:text-base flex items-center gap-1.5"
                    >
                      <span>🌐</span> {item.url}
                    </a>
                    <span className="block text-xs text-slate-400 mt-0.5">
                      Analyzed on {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAnalysis(item.analysis);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-100 cursor-pointer"
                  >
                    View Report
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}