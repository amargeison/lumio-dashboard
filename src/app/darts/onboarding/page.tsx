'use client';
import { useState } from 'react';

const STEPS = [
  { id: 1, title: 'Player details',      subtitle: 'Your PDC profile' },
  { id: 2, title: 'Tour information',    subtitle: 'Tour card and ranking' },
  { id: 3, title: 'Team & setup',        subtitle: 'Coach, agent, equipment' },
  { id: 4, title: 'Commercial',          subtitle: 'Sponsors and walk-on music' },
  { id: 5, title: 'Connect data',        subtitle: 'DartConnect and integrations' },
];

export default function DartsOnboardingPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '', nickname: '', nationality: 'English', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    pdcNumber: '', pdpaId: '', pdcRank: '', orderOfMerit: '',
    threeDartAverage: '', checkoutPercent: '',
    coach: '', agent: '', manager: '',
    sponsor1: '', sponsor2: '', walkOnMusic: '', dartSetup: '',
    dartconnectId: '', dartconnectKey: '',
  });

  const update = (field: string, value: string) =>
    setData(prev => ({ ...prev, [field]: value }));

  const inputClass = 'w-full bg-gray-900/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-red-500/40';
  const labelClass = 'block text-xs text-gray-500 uppercase tracking-wide mb-2';

  return (
    <div className="min-h-screen bg-[#07080F] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="text-red-400 font-medium text-sm mb-1">LUMIO TOUR DARTS</p>
          <h1 className="text-2xl font-medium text-white">Player setup</h1>
          <p className="text-gray-500 text-sm mt-1">Step {step} of {STEPS.length}</p>
        </div>

        <div className="flex gap-1 mb-8">
          {STEPS.map(s => (
            <div key={s.id} className={`flex-1 h-1 rounded-full transition-colors ${s.id <= step ? 'bg-red-500' : 'bg-gray-800'}`} />
          ))}
        </div>

        <div className="bg-gray-900/60 rounded-2xl border border-white/5 p-6 space-y-5">
          <div className="mb-6">
            <h2 className="text-white font-medium">{STEPS[step - 1].title}</h2>
            <p className="text-gray-500 text-sm">{STEPS[step - 1].subtitle}</p>
          </div>

          {step === 1 && (
            <>
              <div>
                <label className={labelClass}>Full name</label>
                <input className={inputClass} placeholder="e.g. Jake Morrison" value={data.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Nickname / walk-on name</label>
                <input className={inputClass} placeholder="e.g. The Hammer" value={data.nickname} onChange={e => update('nickname', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Nationality</label>
                <select className={inputClass} value={data.nationality} onChange={e => update('nationality', e.target.value)}>
                  {['English', 'Scottish', 'Welsh', 'Irish', 'Dutch', 'German', 'Australian', 'Belgian', 'Swedish', 'Danish'].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={labelClass}>PDC player number</label>
                <input className={inputClass} placeholder="e.g. PDC-12345" value={data.pdcNumber} onChange={e => update('pdcNumber', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>PDPA membership ID</label>
                <input className={inputClass} placeholder="e.g. PDPA-98765" value={data.pdpaId} onChange={e => update('pdpaId', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Current PDC rank</label>
                <input className={inputClass} type="number" placeholder="e.g. 19" value={data.pdcRank} onChange={e => update('pdcRank', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Order of Merit total (£)</label>
                <input className={inputClass} type="number" placeholder="e.g. 687420" value={data.orderOfMerit} onChange={e => update('orderOfMerit', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>3-dart average</label>
                  <input className={inputClass} type="number" step="0.1" placeholder="97.8" value={data.threeDartAverage} onChange={e => update('threeDartAverage', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Checkout %</label>
                  <input className={inputClass} type="number" step="0.1" placeholder="41.2" value={data.checkoutPercent} onChange={e => update('checkoutPercent', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className={labelClass}>Coach</label>
                <input className={inputClass} placeholder="Coach name" value={data.coach} onChange={e => update('coach', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Agent / manager</label>
                <input className={inputClass} placeholder="Agent name and agency" value={data.agent} onChange={e => update('agent', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Dart setup</label>
                <input className={inputClass} placeholder="e.g. Red Dragon 22g Tungsten" value={data.dartSetup} onChange={e => update('dartSetup', e.target.value)} />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <label className={labelClass}>Primary sponsor</label>
                <input className={inputClass} placeholder="e.g. Red Dragon Darts" value={data.sponsor1} onChange={e => update('sponsor1', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Secondary sponsor</label>
                <input className={inputClass} placeholder="e.g. Crown Wagers" value={data.sponsor2} onChange={e => update('sponsor2', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Walk-on music</label>
                <input className={inputClass} placeholder="e.g. Iron by Within Temptation" value={data.walkOnMusic} onChange={e => update('walkOnMusic', e.target.value)} />
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="px-4 py-3 bg-gray-800/40 rounded-xl border border-white/5 text-sm text-gray-400">
                Connect your DartConnect account to auto-populate session data, averages, and match statistics throughout the portal.
              </div>
              <div>
                <label className={labelClass}>DartConnect player ID</label>
                <input className={inputClass} placeholder="Your DartConnect ID" value={data.dartconnectId} onChange={e => update('dartconnectId', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>DartConnect API key</label>
                <input className={inputClass} type="password" placeholder="Paste API key" value={data.dartconnectKey} onChange={e => update('dartconnectKey', e.target.value)} />
              </div>
              <p className="text-xs text-gray-600">
                Don&apos;t have a DartConnect API key? You can skip this and connect later in Settings.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 text-gray-500 text-sm disabled:opacity-30 hover:text-gray-300 transition-colors"
          >
            &larr; Back
          </button>
          <button
            onClick={() => {
              if (step < STEPS.length) {
                setStep(step + 1);
              } else {
                fetch('/api/darts/player', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                })
                  .then(() => {
                    const slug = data.name.toLowerCase().replace(/\s+/g, '-') || 'darts-demo';
                    window.location.href = `/darts/${slug}`;
                  })
                  .catch(() => {
                    alert('Setup saved in demo mode. Connect Supabase to persist data.');
                    window.location.href = '/darts/darts-demo';
                  });
              }
            }}
            className="px-6 py-2 bg-red-600/20 border border-red-500/40 text-red-300 text-sm rounded-xl hover:bg-red-600/30 transition-colors"
          >
            {step === STEPS.length ? 'Launch my portal →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
