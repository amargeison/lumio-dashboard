/**
 * LanguageScreenApp.jsx
 *
 * A complete reimagining of the LanguageScreen oral language assessment
 * for the NELI programme. Drop into your portal at localhost:5173.
 *
 * USAGE in your portal:
 *   import LanguageScreenApp from "./LanguageScreenApp";
 *
 *   // When "Assess Student" is clicked:
 *   <LanguageScreenApp
 *     studentName="Emily Johnson"
 *     studentDob="2019-03-15"
 *     schoolName="Greenfield Primary"
 *     assessorName="Mrs Smith"
 *     onClose={() => setShowAssess(false)}
 *     onComplete={(report) => saveReport(report)}
 *   />
 *
 * FEATURES:
 *   ✓ 4 evidence-based subtests (EV · RV · SR · Narrative Comprehension)
 *   ✓ Age-adaptive: 3 subtests <5 years, 4 subtests 5+
 *   ✓ Discontinue rule: 5 consecutive errors per subtest
 *   ✓ Voice commands: "correct" · "wrong" · "repeat" · "skip"
 *   ✓ TTS for Sentence Repetition and Narrative story
 *   ✓ Keyboard: Enter=correct · Backspace=incorrect · R=repeat audio
 *   ✓ Age-standardised scoring (M=100, SD=15)
 *   ✓ Traffic lights: Green ≥90 · Amber 82–89 · Red ≤81
 *   ✓ Full printable report with subtest profile & recommendations
 *   ✓ localStorage result history (up to 200 assessments)
 *
 * Scoring: Hulme et al. (2024). Language, Speech, and Hearing Services in Schools.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ─── Font & CSS injection ─────────────────────────────────────────────────── */
(function injectAssets() {
  if (document.getElementById("nls-assets")) return;
  const link = document.createElement("link");
  link.id = "nls-assets";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Lexend+Deca:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(link);
  const s = document.createElement("style");
  s.id = "nls-css";
  s.textContent = `
    @keyframes nls-fadeup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes nls-pop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
    @keyframes nls-slide{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:translateX(0)}}
    @keyframes nls-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(1.18)}}
    @keyframes nls-glow{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,.45)}55%{box-shadow:0 0 0 13px rgba(245,158,11,0)}}
    @keyframes nls-flash-g{0%{background:#fff}35%{background:#d1fae5}100%{background:#fff}}
    @keyframes nls-flash-r{0%{background:#fff}35%{background:#ffe4e6}100%{background:#fff}}
    .nls-fadeup{animation:nls-fadeup .34s cubic-bezier(.25,.8,.25,1) both}
    .nls-pop{animation:nls-pop .28s cubic-bezier(.34,1.56,.64,1) both}
    .nls-slide{animation:nls-slide .3s ease both}
    .nls-pulse{animation:nls-pulse 1.6s ease-in-out infinite}
    .nls-glow{animation:nls-glow 2.4s ease-in-out infinite}
    .nls-btn{cursor:pointer;border:none;outline:none;transition:transform .12s,opacity .12s,box-shadow .15s}
    .nls-btn:hover{opacity:.91}
    .nls-btn:active{transform:scale(.95)!important;opacity:.8}
    .nls-card-opt{cursor:pointer;transition:transform .16s,box-shadow .16s,border-color .16s}
    .nls-card-opt:hover{transform:scale(1.06) translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.17)}
    .nls-card-opt:active{transform:scale(.97)}
    .nls-flash-g{animation:nls-flash-g .5s ease forwards}
    .nls-flash-r{animation:nls-flash-r .5s ease forwards}
    @keyframes nls-hopIn{0%{opacity:0;transform:translateX(-120px) rotate(-10deg)}40%{opacity:1;transform:translateX(20px) rotate(5deg)}60%{transform:translateX(-8px) rotate(-2deg)}100%{transform:translateX(0) rotate(0)}}
    @keyframes nls-bubblePop{0%{opacity:0;transform:scale(0.3)}50%{opacity:1;transform:scale(1.1)}100%{transform:scale(1)}}
    @keyframes nls-starBurst{0%{opacity:1;transform:scale(0) rotate(0)}50%{opacity:1;transform:scale(1.3) rotate(180deg)}100%{opacity:0;transform:scale(0.5) rotate(360deg)}}
    @keyframes nls-gentleShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-4px)}30%{transform:translateX(4px)}45%{transform:translateX(-3px)}60%{transform:translateX(2px)}75%{transform:translateX(-1px)}}
    @keyframes nls-owlBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    @keyframes nls-floatCloud{0%{transform:translateX(-10%)}100%{transform:translateX(110%)}}
    @keyframes nls-growFlower{0%{transform:scale(0) rotate(-30deg)}100%{transform:scale(1) rotate(0)}}
    @keyframes nls-btnAppear{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
    @keyframes nls-starPulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.3);opacity:1}}
    @keyframes nls-correctGlow{0%{box-shadow:0 0 0 0 rgba(16,185,129,0.6)}50%{box-shadow:0 0 30px 10px rgba(16,185,129,0.3)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}
    .nls-hopIn{animation:nls-hopIn .8s cubic-bezier(.34,1.56,.64,1) both}
    .nls-bubblePop{animation:nls-bubblePop .4s cubic-bezier(.34,1.56,.64,1) both}
    .nls-starBurst{animation:nls-starBurst .7s ease both}
    .nls-gentleShake{animation:nls-gentleShake .5s ease}
    .nls-owlBounce{animation:nls-owlBounce .4s ease 3}
    .nls-btnAppear{animation:nls-btnAppear .5s ease both}
    .nls-starPulse{animation:nls-starPulse 1.2s ease infinite}
    .nls-correctGlow{animation:nls-correctGlow .8s ease both}
    @media print{.nls-no-print{display:none!important}}
  `;
  document.head.appendChild(s);
})();

/* ─── Design tokens ────────────────────────────────────────────────────────── */
const C = {
  navy:"#0f1a2e", navyMid:"#1a2d4a", navyLight:"#243553",
  white:"#ffffff", surface:"#f7f8fc", border:"#e2e8f0",
  slate:"#64748b", slateLt:"#f1f5f9",
  amber:"#f59e0b", amberLt:"#fef3c7", amberDk:"#d97706", amberDk2:"#92400e",
  green:"#16a34a", greenLt:"#dcfce7", greenDk:"#14532d",
  red:"#dc2626", redLt:"#fee2e2", redDk:"#991b1b",
  teal:"#0891b2", tealLt:"#ecfeff",
  violet:"#7c3aed", violetLt:"#f3e8ff",
  rose:"#e11d48", roseLt:"#fff1f2",
  correct:"#10b981", wrong:"#f43f5e",
};
const F = { display:"'Fraunces',Georgia,serif", body:"'Lexend Deca','Segoe UI',system-ui,sans-serif" };

/* ─── Assessment item banks ────────────────────────────────────────────────── */
const EV_ITEMS = [
  { id:1,  emoji:"⚽", word:"ball",        accept:["football","soccer ball"] },
  { id:2,  emoji:"🌂", word:"umbrella",    accept:["brolly","parasol"] },
  { id:3,  emoji:"🚲", word:"bicycle",     accept:["bike","cycle","pushbike"] },
  { id:4,  emoji:"🔭", word:"telescope",   accept:[] },
  { id:5,  emoji:"🧭", word:"compass",     accept:[] },
  { id:6,  emoji:"🌡️",word:"thermometer", accept:[] },
  { id:7,  emoji:"🔬", word:"microscope",  accept:[] },
  { id:8,  emoji:"🎺", word:"trumpet",     accept:[] },
  { id:9,  emoji:"⚓", word:"anchor",      accept:[] },
  { id:10, emoji:"🏺", word:"amphora",     accept:["urn","vase","jar"] },
  { id:11, emoji:"⚗️",word:"flask",        accept:["retort","beaker","test tube"] },
  { id:12, emoji:"🪗", word:"accordion",   accept:["concertina"] },
];

const RV_ITEMS = [
  { id:1,  word:"sleeping",    opts:["😴","🏃","🍽️","🎭"], ans:0 },
  { id:2,  word:"enormous",    opts:["🐘","🐜","🐦","🌸"], ans:0 },
  { id:3,  word:"grumpy",      opts:["😠","😄","😢","😐"], ans:0 },
  { id:4,  word:"transparent", opts:["🪟","🧱","🌲","📦"], ans:0 },
  { id:5,  word:"exhausted",   opts:["😴","😄","😡","😕"], ans:0 },
  { id:6,  word:"climbing",    opts:["🧗","🏊","🚴","💃"], ans:0 },
  { id:7,  word:"fragile",     opts:["🥚","🪨","⚓","🛡️"], ans:0 },
  { id:8,  word:"nocturnal",   opts:["🦉","🐔","🦁","🐬"], ans:0 },
  { id:9,  word:"camouflage",  opts:["🦎","🐧","🐟","🦜"], ans:0 },
  { id:10, word:"symmetrical", opts:["🦋","🌵","🍄","🌊"], ans:0 },
];

function shuffleRV(item) {
  const s = [...item.opts];
  for (let i = 3; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [s[i],s[j]]=[s[j],s[i]]; }
  const correctEmoji = item.opts[0];
  return { ...item, displayOpts:s, correctDisplayIdx:s.indexOf(correctEmoji) };
}

const SR_ITEMS = [
  { id:1,  s:"The dog ran fast." },
  { id:2,  s:"She is eating an apple." },
  { id:3,  s:"The boy kicked the big red ball." },
  { id:4,  s:"The children played in the garden after school." },
  { id:5,  s:"He was very tired after running a long way." },
  { id:6,  s:"The little girl who lives next door has a new puppy." },
  { id:7,  s:"After the rain stopped, the children went outside to play." },
  { id:8,  s:"The teacher told the class they would be going on a trip next week." },
  { id:9,  s:"Although it was cold and windy, the children still wanted to go to the beach." },
  { id:10, s:"The scientist who discovered the new planet was awarded a very important prize." },
  { id:11, s:"Before the concert began, the musicians had been practising backstage for several hours." },
  { id:12, s:"Having noticed the unusual weather patterns, the meteorologist revised her forecast significantly." },
];

const STORY = `Once there was a young fox called Ember, who lived deep in a great ancient forest.

One crisp autumn morning, Ember discovered a beautiful golden leaf lying beside a babbling stream. "I shall take this home as a gift for my mother," she said happily.

Ember set off through the trees. But suddenly, a great gust of wind swept through the forest — and blew the golden leaf right out of her paws!

"No!" cried Ember. She chased after it, running faster and faster. At last, she caught the leaf where it had come to rest beside the great old oak tree at the forest's edge.

When Ember arrived home, breathless but happy, her mother gave a gasp of delight. She pressed the beautiful golden leaf onto their front door, where it glowed warmly all through the long winter.`;

const NQ_ITEMS = [
  { id:1, q:"What was the fox called?",                            ans:"Ember",                          type:"recall"    },
  { id:2, q:"Where did Ember find the golden leaf?",              ans:"Beside the stream",              type:"recall"    },
  { id:3, q:"What colour was the leaf?",                          ans:"Golden / gold",                  type:"recall"    },
  { id:4, q:"Why did Ember decide to take the leaf home?",        ans:"As a gift for her mother",       type:"inference" },
  { id:5, q:"What happened to the leaf on the way home?",         ans:"The wind blew it away",          type:"recall"    },
  { id:6, q:"How might Ember have felt when the leaf blew away?", ans:"Worried / sad / scared / upset", type:"inference" },
  { id:7, q:"Where did Ember finally catch the leaf?",            ans:"By the old oak tree",            type:"recall"    },
  { id:8, q:"What did Ember's mother do with the leaf?",          ans:"Pressed it on the front door",   type:"recall"    },
];

const DISCONTINUE = 5;

/* ─── Scoring engine ───────────────────────────────────────────────────────── */
const NORMS = {
  3.5:[11,4.0], 4.0:[15,4.8], 4.5:[19,5.2],
  5.0:[23,5.8], 5.5:[26,5.4], 6.0:[28,5.2],
  7.0:[31,5.0], 8.0:[34,4.8], 9.0:[36,4.5],
  10.0:[37,4.2], 11.0:[38,4.0],
};
function getNorm(age) {
  const ks = Object.keys(NORMS).map(Number).sort((a,b)=>a-b);
  let k = ks[0];
  for (const a of ks) { if (age >= a) k = a; }
  return NORMS[k];
}
function rawToSS(raw, age) {
  const [m,sd] = getNorm(age);
  return Math.round(Math.max(40, Math.min(160, 100 + ((raw-m)/sd)*15)));
}
function ssToPct(ss) {
  const z = (ss-100)/15, za = Math.abs(z);
  const t = 1/(1+0.2316419*za);
  const p = ((((1.330274429*t-1.821255978)*t+1.781477937)*t-0.356563782)*t+0.319381530)*t;
  const d = Math.exp(-za*za/2)/Math.sqrt(2*Math.PI);
  const cdf = z>=0 ? 1-d*p : d*p;
  return Math.max(1, Math.min(99, Math.round(cdf*100)));
}
function getBand(ss) {
  if (ss>=90) return { tag:"🟢", label:"No Concern",       short:"GREEN", color:C.green,  bg:C.greenLt, dark:C.greenDk  };
  if (ss>=82) return { tag:"🟡", label:"May Need Support", short:"AMBER", color:C.amberDk,bg:C.amberLt, dark:C.amberDk2 };
              return { tag:"🔴", label:"Needs Support",    short:"RED",   color:C.red,    bg:C.redLt,   dark:C.redDk    };
}
function calcAge(dob) {
  const b = new Date(dob), n = new Date();
  let y = n.getFullYear()-b.getFullYear(), mo = n.getMonth()-b.getMonth();
  if (mo<0||(mo===0&&n.getDate()<b.getDate())) { y--; mo+=12; }
  return Math.max(0, y+mo/12);
}
function fmtAge(a) {
  const y = Math.floor(a), mo = Math.round((a-y)*12);
  return mo>0 ? `${y}y ${mo}m` : `${y}y`;
}
function todayIso() { return new Date().toISOString().split("T")[0]; }
function checkDisc(results) {
  let c = 0;
  for (let i = results.length-1; i>=0; i--) {
    if (!results[i]?.correct) c++; else break;
  }
  return c >= DISCONTINUE;
}

/* ─── Hooks ────────────────────────────────────────────────────────────────── */
function useTTS() {
  const sy = useRef(window.speechSynthesis||null);
  useEffect(() => { sy.current?.getVoices(); }, []);
  function bestVoice() {
    const vs = sy.current?.getVoices()||[];
    return vs.find(v=>v.lang==="en-GB"&&/female|woman|kate|amy|serena|karen/i.test(v.name))
        || vs.find(v=>v.lang==="en-GB")
        || vs.find(v=>v.lang.startsWith("en-"))
        || null;
  }
  const speak = useCallback((text, rate=0.84) => {
    if (!sy.current) return;
    sy.current.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang="en-GB"; u.rate=rate; u.pitch=1;
    const v = bestVoice(); if (v) u.voice=v;
    sy.current.speak(u);
  }, []);
  const cancel = useCallback(() => sy.current?.cancel(), []);
  return { speak, cancel };
}

function useVoiceCommands({ enabled, onCommand }) {
  const recRef = useRef(null);
  const cbRef  = useRef(onCommand);
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  cbRef.current = onCommand;
  useEffect(() => {
    if (!enabled) { try { recRef.current?.stop(); } catch {} setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    let alive = true;
    function boot() {
      if (!alive) return;
      const r = new SR();
      r.continuous=true; r.interimResults=false; r.lang="en-GB";
      r.onstart  = () => setListening(true);
      r.onend    = () => { setListening(false); if (alive) setTimeout(boot, 500); };
      r.onerror  = e => { if (e.error!=="no-speech") setListening(false); };
      r.onresult = e => {
        const t = e.results[e.results.length-1][0].transcript.toLowerCase().trim();
        setLastHeard(t);
        const m = (pats, cmd) => pats.some(p=>new RegExp(`\\b${p}\\b`).test(t)) && cbRef.current(cmd);
        m(["correct","right","yes","tick","good"],          "correct");
        m(["wrong","incorrect","no","cross","error","nope"],"incorrect");
        m(["repeat","again","re-read","play again"],        "repeat");
        m(["skip","next","pass"],                           "skip");
      };
      try { r.start(); recRef.current=r; } catch {}
    }
    boot();
    return () => { alive=false; try{recRef.current?.stop();}catch{} setListening(false); };
  }, [enabled]);
  return { listening, lastHeard };
}

/* ─── Shared UI atoms ──────────────────────────────────────────────────────── */
const KBD = ({ children }) => (
  <kbd style={{
    background:"#e2e8f0", border:"1px solid #cbd5e1", borderRadius:4,
    padding:"1px 6px", fontSize:10, fontFamily:"monospace", color:C.navy,
  }}>{children}</kbd>
);

function VoiceBar({ listening, lastHeard }) {
  if (!listening) return null;
  return (
    <div className="nls-glow" style={{
      display:"flex", alignItems:"center", gap:8,
      background:C.amberLt, border:`1.5px solid ${C.amber}`,
      borderRadius:24, padding:"6px 14px",
    }}>
      <div className="nls-pulse" style={{ width:8,height:8,borderRadius:"50%",background:C.amber,flexShrink:0 }} />
      <span style={{ fontSize:11.5, fontWeight:600, color:C.amberDk2, fontFamily:F.body }}>
        Listening{lastHeard ? ` · "${lastHeard}"` : ' · "correct" / "wrong" / "repeat"'}
      </span>
    </div>
  );
}

/* ─── Speaker button for assessor TTS ─────────────────────────────────────── */
function SpeakButton({ text, label="Replay" }) {
  const doSpeak = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB"; u.rate = 0.9; u.pitch = 1.0; u.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === "en-GB" && /female|woman/i.test(v.name))
      || voices.find(v => v.lang === "en-GB")
      || voices.find(v => v.lang.startsWith("en"))
      || voices[0];
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  };
  return (
    <div style={{display:"inline-flex",gap:6,alignItems:"center"}}>
      <button className="nls-btn" onClick={doSpeak} style={{
        display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",
        borderRadius:8,background:C.amberLt,border:`1px solid ${C.amber}40`,
        fontSize:11,fontWeight:600,color:C.amberDk2,fontFamily:F.body,cursor:"pointer",
      }}>🔊 {label}</button>
      <button className="nls-btn" onClick={()=>window.speechSynthesis.cancel()} style={{
        display:"inline-flex",alignItems:"center",padding:"4px 8px",
        borderRadius:8,background:C.slateLt,border:`1px solid ${C.border}`,
        fontSize:11,color:C.slate,fontFamily:F.body,cursor:"pointer",
      }}>⏹</button>
    </div>
  );
}

function speakAutoTTS(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB"; u.rate = 0.9; u.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang === "en-GB" && /female|woman/i.test(v.name))
    || voices.find(v => v.lang === "en-GB")
    || voices.find(v => v.lang.startsWith("en"))
    || voices[0];
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}

/* ─── Ted the Bear character ──────────────────────────────────────────────── */
function TedBear({ size=200, mood="happy", className="" }) {
  return (
    <svg width={size} height={size*1.2} viewBox="0 0 200 240" className={className} style={{display:"block"}}>
      {/* Orange podium base */}
      <rect x="50" y="200" width="100" height="35" rx="8" fill="#E8650A" stroke="#C45508" strokeWidth="2"/>
      {/* Body */}
      <ellipse cx="100" cy="155" rx="55" ry="50" fill="#8B5E3C" stroke="#2C1810" strokeWidth="2.5"/>
      {/* Belly */}
      <ellipse cx="100" cy="160" rx="38" ry="34" fill="#D4956A"/>
      {/* Left arm raised */}
      <ellipse cx="50" cy="130" rx="18" ry="30" fill="#8B5E3C" stroke="#2C1810" strokeWidth="2.5" transform="rotate(-25 50 130)"/>
      <ellipse cx="50" cy="115" rx="12" ry="12" fill="#8B5E3C" stroke="#2C1810" strokeWidth="2"/>
      {/* Right arm raised */}
      <ellipse cx="150" cy="130" rx="18" ry="30" fill="#8B5E3C" stroke="#2C1810" strokeWidth="2.5" transform="rotate(25 150 130)"/>
      <ellipse cx="150" cy="115" rx="12" ry="12" fill="#8B5E3C" stroke="#2C1810" strokeWidth="2"/>
      {/* Feet */}
      <ellipse cx="78" cy="202" rx="16" ry="10" fill="#8B5E3C" stroke="#2C1810" strokeWidth="2"/>
      <ellipse cx="122" cy="202" rx="16" ry="10" fill="#8B5E3C" stroke="#2C1810" strokeWidth="2"/>
      {/* Head */}
      <circle cx="100" cy="75" r="45" fill="#8B5E3C" stroke="#2C1810" strokeWidth="2.5"/>
      {/* Face centre */}
      <ellipse cx="100" cy="82" rx="32" ry="28" fill="#D4956A"/>
      {/* Ears */}
      <circle cx="62" cy="42" r="18" fill="#8B5E3C" stroke="#2C1810" strokeWidth="2.5"/>
      <circle cx="62" cy="42" r="10" fill="#C4805A"/>
      <circle cx="138" cy="42" r="18" fill="#8B5E3C" stroke="#2C1810" strokeWidth="2.5"/>
      <circle cx="138" cy="42" r="10" fill="#C4805A"/>
      {/* Eyes */}
      <circle cx="82" cy="70" r="10" fill="#2C1810"/>
      <circle cx="118" cy="70" r="10" fill="#2C1810"/>
      <circle cx="85" cy="67" r="3.5" fill="white"/>
      <circle cx="121" cy="67" r="3.5" fill="white"/>
      {/* Nose */}
      <ellipse cx="100" cy="85" rx="8" ry="6" fill="#2C1810"/>
      <ellipse cx="100" cy="84" rx="3" ry="2" fill="#5A3A1A" opacity="0.4"/>
      {/* Mouth */}
      {mood==="happy" && <path d="M88 95 Q100 108 112 95" fill="none" stroke="#2C1810" strokeWidth="2.5" strokeLinecap="round"/>}
      {mood==="encouraging" && <path d="M90 98 Q100 104 110 98" fill="none" stroke="#2C1810" strokeWidth="2" strokeLinecap="round"/>}
      {/* Eyebrows */}
      {mood==="happy" && <>
        <path d="M72 58 Q82 52 92 58" fill="none" stroke="#2C1810" strokeWidth="2" strokeLinecap="round"/>
        <path d="M108 58 Q118 52 128 58" fill="none" stroke="#2C1810" strokeWidth="2" strokeLinecap="round"/>
      </>}
      {mood==="encouraging" && <>
        <path d="M72 60 Q82 56 92 59" fill="none" stroke="#2C1810" strokeWidth="2" strokeLinecap="round"/>
        <path d="M108 59 Q118 56 128 60" fill="none" stroke="#2C1810" strokeWidth="2" strokeLinecap="round"/>
      </>}
    </svg>
  );
}

/* ─── SVG Scenes for vocabulary items ─────────────────────────────────────── */
const SVG_SCENES = {
  ball: (
    <svg viewBox="0 0 400 300" style={{width:"100%",height:"100%"}}>
      <rect width="400" height="200" fill="#87CEEB"/><rect y="200" width="400" height="100" fill="#4CAF50"/>
      <circle cx="320" cy="50" r="30" fill="#FFD700" opacity="0.9"/>
      <circle cx="200" cy="190" r="50" fill="#E53935" stroke="#B71C1C" strokeWidth="3"/>
      <path d="M160 170 Q200 140 240 170" fill="none" stroke="white" strokeWidth="4" opacity="0.8"/>
      <path d="M160 210 Q200 240 240 210" fill="none" stroke="white" strokeWidth="4" opacity="0.8"/>
      <path d="M155 190 L245 190" stroke="white" strokeWidth="3" opacity="0.6"/>
      {/* Butterfly */}
      <g transform="translate(280,160)"><ellipse cx="-8" cy="-5" rx="8" ry="5" fill="#FF69B4" opacity="0.8"/><ellipse cx="8" cy="-5" rx="8" ry="5" fill="#FF69B4" opacity="0.8"/><ellipse cx="-6" cy="4" rx="6" ry="4" fill="#FFB6C1" opacity="0.7"/><ellipse cx="6" cy="4" rx="6" ry="4" fill="#FFB6C1" opacity="0.7"/><line x1="0" y1="-8" x2="-3" y2="-14" stroke="#333" strokeWidth="1"/><line x1="0" y1="-8" x2="3" y2="-14" stroke="#333" strokeWidth="1"/></g>
      <circle cx="100" cy="45" r="20" fill="white" opacity="0.7"/><circle cx="120" cy="40" r="15" fill="white" opacity="0.6"/>
    </svg>
  ),
  umbrella: (
    <svg viewBox="0 0 400 300" style={{width:"100%",height:"100%"}}>
      <rect width="400" height="300" fill="#607D8B"/>
      <path d="M120 140 Q200 40 280 140" fill="#E53935" stroke="#B71C1C" strokeWidth="3"/>
      <line x1="200" y1="140" x2="200" y2="250" stroke="#5D4037" strokeWidth="4"/>
      <path d="M200 250 Q200 270 180 270" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round"/>
      {/* Raindrops */}
      {[50,120,180,250,310,360,80,150,220,290].map((x,i)=><line key={i} x1={x} y1={30+i*8} x2={x-5} y2={50+i*8} stroke="#90CAF9" strokeWidth="2" opacity="0.7"/>)}
      <rect y="270" width="400" height="30" fill="#455A64"/>
    </svg>
  ),
  bicycle: (
    <svg viewBox="0 0 400 300" style={{width:"100%",height:"100%"}}>
      <rect width="400" height="220" fill="#87CEEB"/><rect y="220" width="400" height="80" fill="#8BC34A"/>
      <circle cx="130" cy="200" r="40" fill="none" stroke="#333" strokeWidth="5"/>
      <circle cx="270" cy="200" r="40" fill="none" stroke="#333" strokeWidth="5"/>
      <path d="M130 200 L200 150 L270 200 M200 150 L200 120 M185 120 L215 120" fill="none" stroke="#E53935" strokeWidth="4" strokeLinejoin="round"/>
      <circle cx="200" cy="120" r="5" fill="#333"/>
      <line x1="200" y1="150" x2="165" y2="155" stroke="#E53935" strokeWidth="3"/>
      <circle cx="320" cy="50" r="28" fill="#FFD700" opacity="0.9"/>
    </svg>
  ),
  telescope: (
    <svg viewBox="0 0 400 300" style={{width:"100%",height:"100%"}}>
      <rect width="400" height="300" fill="#1a1a2e"/>
      {[40,90,150,220,300,350,60,180,260,330,120,280].map((x,i)=><circle key={i} cx={x} cy={20+i*18} r="1.5" fill="white" opacity={0.5+Math.random()*0.5}/>)}
      <circle cx="320" cy="60" r="25" fill="#FFE082" opacity="0.9"/>
      <rect x="140" y="120" width="150" height="25" rx="5" fill="#5D4037" transform="rotate(-25 215 132)"/>
      <circle cx="145" cy="145" r="18" fill="#37474F" stroke="#455A64" strokeWidth="3"/>
      <rect x="260" y="180" width="6" height="80" fill="#795548"/>
      <rect x="240" y="180" width="6" height="80" fill="#795548" transform="rotate(15 243 220)"/>
    </svg>
  ),
};

function SceneSVG({ word }) {
  const key = word?.toLowerCase();
  return SVG_SCENES[key] || null;
}

/* ─── Star Progress Bar ───────────────────────────────────────────────────── */
function StarProgress({ current, total }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{fontSize:i<current?16:i===current?18:14,opacity:i>current?0.3:1,transition:"all 0.3s"}}
          className={i===current?"nls-starPulse":""}>
          {i<current?"⭐":i===current?"☆":"☆"}
        </div>
      ))}
      <span style={{fontSize:12,fontWeight:600,color:C.slate,fontFamily:F.body,marginLeft:8}}>
        Question {Math.min(current+1,total)} of {total}
      </span>
    </div>
  );
}

/* ─── Celebration burst ───────────────────────────────────────────────────── */
function CelebrationBurst({ show }) {
  if (!show) return null;
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:10}}>
      {Array.from({length:8}).map((_,i)=>(
        <div key={i} className="nls-starBurst" style={{
          position:"absolute",left:"50%",top:"50%",fontSize:24,
          animationDelay:`${i*0.05}s`,
          transform:`translate(${Math.cos(i*Math.PI/4)*80}px, ${Math.sin(i*Math.PI/4)*80}px)`,
        }}>⭐</div>
      ))}
    </div>
  );
}

function Pips({ total, results }) {
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
      {Array.from({ length:total }).map((_,i) => {
        const r = results[i];
        const bg = r===undefined ? C.border : r.correct ? C.correct : C.wrong;
        return <div key={i} style={{ width:12,height:12,borderRadius:3,background:bg,transition:"background .22s" }} />;
      })}
    </div>
  );
}

function SubtestHeader({ title, icon, color, results, total }) {
  const pct = total>0 ? Math.round(results.length/total*100) : 0;
  return (
    <div style={{ background:C.navy, padding:"11px 20px", display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
      <div style={{
        width:34,height:34,borderRadius:10,background:color+"28",flexShrink:0,
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
      }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:F.display, fontSize:14, fontWeight:700, color:C.white, marginBottom:5 }}>{title}</div>
        <div style={{ background:"#ffffff18",borderRadius:4,height:5,overflow:"hidden" }}>
          <div style={{ height:"100%",background:color,borderRadius:4,width:`${pct}%`,transition:"width .3s ease" }} />
        </div>
      </div>
      <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
        <Pips total={total} results={results} />
        <div style={{ fontSize:11, color:"#94a3b8", fontFamily:F.body }}>{results.length}/{total}</div>
      </div>
    </div>
  );
}

function Note({ color, bg, text }) {
  return (
    <div style={{ background:bg, borderBottom:`1px solid ${color}28`, padding:"8px 22px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
      <p style={{ margin:0, fontSize:12.5, color:color, fontWeight:500, fontFamily:F.body, lineHeight:1.55, flex:1 }}>
        📋 <strong style={{ color:C.navy }}>Assessor:</strong> {text}
      </p>
      <SpeakButton text={text} label="Read"/>
    </div>
  );
}

function ScoreBtns({ onCorrect, onIncorrect, disabled }) {
  return (
    <div style={{ display:"flex", gap:12, width:"100%", maxWidth:380 }}>
      {[
        { label:"✓  Correct",   hint:"Enter",     color:C.correct, handler:onCorrect   },
        { label:"✗  Incorrect", hint:"Backspace",  color:C.wrong,   handler:onIncorrect },
      ].map(({ label, hint, color, handler }) => (
        <button key={label} className="nls-btn" onClick={disabled ? undefined : handler} style={{
          flex:1, padding:"17px 12px",
          background:disabled?"#e2e8f0":color,
          color:disabled?C.slate:C.white,
          borderRadius:14, fontSize:15, fontWeight:700, fontFamily:F.body,
          boxShadow:disabled?"none":`0 4px 18px ${color}44`,
          display:"flex",flexDirection:"column",alignItems:"center",gap:3,
          cursor:disabled?"not-allowed":"pointer",
        }}>
          {label}
          <span style={{ fontSize:10, opacity:.6, fontWeight:400 }}><KBD>{hint}</KBD></span>
        </button>
      ))}
    </div>
  );
}

/* ─── Owl Intro Sequence ──────────────────────────────────────────────────── */
function OwlIntro({ onDismiss }) {
  const [bubble, setBubble] = useState(0);
  const [showBtn, setShowBtn] = useState(false);

  useEffect(()=>{
    speakAutoTTS("Hi! I'm Ted the Bear! Let's play a word game together!");
    const t1 = setTimeout(()=>{setBubble(1);speakAutoTTS("I'll show you some pictures. Just tell me what you see!");}, 2500);
    const t2 = setTimeout(()=>setShowBtn(true), 4000);
    return ()=>{ clearTimeout(t1); clearTimeout(t2); window.speechSynthesis.cancel(); };
  }, []);

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:10000,
      background:"linear-gradient(180deg, #87CEEB 0%, #B3E5FC 60%, #4CAF50 85%, #388E3C 100%)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      fontFamily:F.body,overflow:"hidden",
    }}>
      {/* Clouds */}
      <div style={{position:"absolute",top:40,left:0,right:0,overflow:"hidden",height:60}}>
        <div style={{animation:"nls-floatCloud 20s linear infinite",position:"absolute"}}>
          <svg width="120" height="50" viewBox="0 0 120 50"><ellipse cx="60" cy="30" rx="50" ry="20" fill="white" opacity="0.7"/><ellipse cx="40" cy="25" rx="30" ry="18" fill="white" opacity="0.8"/><ellipse cx="80" cy="28" rx="35" ry="15" fill="white" opacity="0.6"/></svg>
        </div>
        <div style={{animation:"nls-floatCloud 25s linear infinite 5s",position:"absolute"}}>
          <svg width="100" height="40" viewBox="0 0 100 40"><ellipse cx="50" cy="22" rx="40" ry="16" fill="white" opacity="0.6"/><ellipse cx="35" cy="20" rx="25" ry="14" fill="white" opacity="0.7"/></svg>
        </div>
      </div>

      {/* Flowers on grass */}
      <div style={{position:"absolute",bottom:60,left:60}}>
        <svg width="30" height="30" viewBox="0 0 30 30" className="nls-growFlower" style={{animationDelay:"0.5s",animationDuration:"0.6s",animationFillMode:"both"}}>
          <circle cx="15" cy="10" r="5" fill="#FF69B4"/><circle cx="10" cy="14" r="5" fill="#FF69B4"/><circle cx="20" cy="14" r="5" fill="#FF69B4"/><circle cx="15" cy="12" r="3" fill="#FFD700"/>
          <line x1="15" y1="17" x2="15" y2="28" stroke="#4CAF50" strokeWidth="2"/>
        </svg>
      </div>
      <div style={{position:"absolute",bottom:55,right:80}}>
        <svg width="25" height="25" viewBox="0 0 25 25" className="nls-growFlower" style={{animationDelay:"1s",animationDuration:"0.6s",animationFillMode:"both"}}>
          <circle cx="12" cy="8" r="4" fill="#FFD700"/><circle cx="8" cy="11" r="4" fill="#FFD700"/><circle cx="16" cy="11" r="4" fill="#FFD700"/><circle cx="12" cy="10" r="2.5" fill="#FF8F00"/>
          <line x1="12" y1="14" x2="12" y2="23" stroke="#4CAF50" strokeWidth="2"/>
        </svg>
      </div>

      {/* Ted */}
      <div className="nls-hopIn" style={{marginBottom:20}}>
        <TedBear size={150} mood="happy"/>
      </div>

      {/* Speech bubble */}
      <div className="nls-bubblePop" key={bubble} style={{
        background:"white",borderRadius:24,padding:"18px 28px",maxWidth:380,
        boxShadow:"0 8px 32px rgba(0,0,0,0.15)",textAlign:"center",
        position:"relative",marginBottom:30,
      }}>
        <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",
          width:0,height:0,borderLeft:"12px solid transparent",borderRight:"12px solid transparent",borderBottom:"12px solid white"}}/>
        <p style={{margin:0,fontSize:18,fontWeight:700,color:C.navy,lineHeight:1.5}}>
          {bubble===0 ? "Hi! I'm Ted the Bear! \u{1F9F8} Let's play a word game together!"
                      : "I'll show you some pictures \u2014 just tell me what you see!"}
        </p>
      </div>

      {/* Button */}
      {showBtn && (
        <button className="nls-btn nls-btnAppear" onClick={onDismiss} style={{
          padding:"18px 48px",borderRadius:20,
          background:"linear-gradient(135deg, #FF9800, #F57C00)",
          color:"white",fontSize:22,fontWeight:800,
          fontFamily:F.display,boxShadow:"0 8px 32px rgba(255,152,0,0.5)",
          border:"4px solid white",
        }}>
          Let's Go! →
        </button>
      )}
    </div>
  );
}

/* ─── Screen 1: Welcome ─────────────────────────────────────────────────────── */
function Welcome({ onStart }) {
  return (
    <div className="nls-fadeup" style={{
      minHeight:"100vh",background:C.navy,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:32,fontFamily:F.body,
    }}>
      <div style={{ textAlign:"center", maxWidth:460 }}>
        <div className="nls-pop" style={{
          width:96,height:96,borderRadius:28,
          background:"linear-gradient(135deg,#f59e0b,#d97706,#b45309)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:50,margin:"0 auto 30px",
          boxShadow:"0 16px 48px #f59e0b60,0 0 0 1px rgba(255,255,255,.08)",
        }}>🗣️</div>
        <h1 style={{ fontFamily:F.display,fontSize:44,fontWeight:700,color:C.white,margin:"0 0 8px",letterSpacing:-2,lineHeight:1.0 }}>
          LanguageScreen
        </h1>
        <p style={{ color:C.amber,fontWeight:700,fontSize:11.5,margin:"0 0 20px",letterSpacing:2.5,textTransform:"uppercase" }}>
          NELI Oral Language Assessment
        </p>
        <p style={{ color:"#94a3b8",lineHeight:1.8,fontSize:15,margin:"0 0 34px",maxWidth:380,marginLeft:"auto",marginRight:"auto" }}>
          Evidence-based oral language screener for children aged 3½–11.
          Identifies children who may benefit from NELI targeted support.
        </p>
        <div style={{ display:"flex",gap:9,justifyContent:"center",flexWrap:"wrap",marginBottom:38 }}>
          {["4 Subtests","~10 Minutes","Voice Commands","Keyboard Shortcuts","Instant Report","Print Ready"].map(t => (
            <div key={t} style={{
              background:"#ffffff12",borderRadius:8,padding:"5px 13px",
              fontSize:12,color:"#cbd5e1",fontWeight:500,border:"1px solid #ffffff1c",
            }}>{t}</div>
          ))}
        </div>
        <button className="nls-btn" onClick={onStart} style={{
          width:"100%",padding:"20px",
          background:"linear-gradient(135deg,#f59e0b,#d97706)",
          color:C.white,borderRadius:16,fontSize:18,fontWeight:700,
          fontFamily:F.body,boxShadow:"0 12px 40px #f59e0b60",
        }}>
          Begin Assessment →
        </button>
        <p style={{ color:"#334155",fontSize:12,marginTop:22,lineHeight:1.6 }}>
          NELI programme · OxEd &amp; Assessment · DfE funded · 11,000+ UK schools
        </p>
      </div>
    </div>
  );
}

/* ─── Screen 2: Setup ───────────────────────────────────────────────────────── */
function Setup({ prefill, onConfirm, onBack }) {
  const [form, setForm] = useState({
    name:prefill.studentName||"", dob:prefill.studentDob||"",
    school:prefill.schoolName||"", assessor:prefill.assessorName||"",
    date:todayIso(), notes:"",
  });
  const [errs, setErrs] = useState({});
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrs(e=>({...e,[k]:null})); };

  function submit() {
    const e={};
    if (!form.name.trim()) e.name="Child's name is required";
    if (!form.dob) e.dob="Date of birth is required";
    else { const a=calcAge(form.dob); if(a<2.5||a>14) e.dob="Please check date of birth"; }
    if (Object.keys(e).length) { setErrs(e); return; }
    onConfirm(form);
  }

  const age = form.dob && !errs.dob ? calcAge(form.dob) : null;
  const inp = (err) => ({
    width:"100%",padding:"11px 14px",fontFamily:F.body,fontSize:14,
    background:C.slateLt,border:`1.5px solid ${err?C.wrong:C.border}`,
    borderRadius:10,outline:"none",color:C.navy,boxSizing:"border-box",
  });
  const lbl = { fontSize:12.5,fontWeight:600,color:C.slate,marginBottom:5,display:"block",fontFamily:F.body };

  return (
    <div style={{ minHeight:"100vh",background:`linear-gradient(160deg,${C.navy},#1a2d4a)`,fontFamily:F.body }}>
      <div style={{ padding:"14px 22px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <span style={{ fontFamily:F.display,fontSize:18,fontWeight:700,color:C.white }}>🗣️ LanguageScreen</span>
        <button className="nls-btn" onClick={onBack} style={{ color:"#94a3b8",background:"transparent",fontSize:13,fontFamily:F.body }}>← Back</button>
      </div>
      <div style={{ maxWidth:540,margin:"0 auto",padding:"0 20px 40px" }}>
        <div className="nls-fadeup" style={{ background:C.white,borderRadius:24,padding:"28px 32px",boxShadow:"0 20px 60px rgba(0,0,0,.28)" }}>
          <h2 style={{ fontFamily:F.display,fontSize:26,fontWeight:700,color:C.navy,margin:"0 0 6px" }}>Child's Details</h2>
          <p style={{ color:C.slate,fontSize:13.5,margin:"0 0 28px",lineHeight:1.5 }}>Fill in details to configure the assessment.</p>

          <div style={{ marginBottom:18 }}>
            <label style={lbl}>Child's full name *</label>
            <input style={inp(errs.name)} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Emily Johnson" />
            {errs.name && <div style={{ color:C.wrong,fontSize:12,marginTop:4 }}>{errs.name}</div>}
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>Date of birth *</label>
            <input type="date" style={inp(errs.dob)} value={form.dob} onChange={e=>set("dob",e.target.value)} max={todayIso()} />
            {errs.dob && <div style={{ color:C.wrong,fontSize:12,marginTop:4 }}>{errs.dob}</div>}
            {age && !errs.dob && (
              <div style={{ fontSize:12,color:C.slate,marginTop:4 }}>
                Age: <strong style={{ color:C.navy }}>{fmtAge(age)}</strong>
                {age<5 ? " · 3-subtest version (EV + RV + Narrative)" : " · Full 4-subtest version (EV + RV + SR + Narrative)"}
              </div>
            )}
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={lbl}>School name</label>
            <input style={inp()} value={form.school} onChange={e=>set("school",e.target.value)} placeholder="e.g. Greenfield Primary School" />
          </div>
          <div style={{ display:"flex",gap:14,marginBottom:18 }}>
            <div style={{ flex:1 }}>
              <label style={lbl}>Assessor</label>
              <input style={inp()} value={form.assessor} onChange={e=>set("assessor",e.target.value)} placeholder="Your name" />
            </div>
            <div style={{ flex:1 }}>
              <label style={lbl}>Assessment date</label>
              <input type="date" style={inp()} value={form.date} onChange={e=>set("date",e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom:28 }}>
            <label style={lbl}>Notes (optional)</label>
            <textarea style={{ ...inp(), height:66, resize:"vertical", verticalAlign:"top" }}
              value={form.notes} onChange={e=>set("notes",e.target.value)}
              placeholder="e.g. EAL child · speech difficulty noted · second assessment" />
          </div>
          <button className="nls-btn" onClick={submit} style={{
            width:"100%",padding:"16px",
            background:`linear-gradient(135deg,${C.navy},${C.navyMid})`,
            color:C.white,borderRadius:14,fontSize:16,fontWeight:700,
            fontFamily:F.body,boxShadow:"0 8px 28px rgba(15,23,42,.38)",
          }}>Continue →</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Screen 3: Ready ───────────────────────────────────────────────────────── */
function Ready({ child, ageYears, voiceOn, setVoiceOn, onBegin }) {
  const use4 = ageYears >= 5;
  const tests = use4
    ? [
        { name:"Expressive Vocabulary",  desc:"Child names pictures",               color:C.amber,  icon:"🖼️" },
        { name:"Receptive Vocabulary",   desc:"Child selects matching picture",      color:C.violet, icon:"👁️" },
        { name:"Sentence Repetition",    desc:"Child repeats sentences verbatim",    color:C.teal,   icon:"🔊" },
        { name:"Narrative Comprehension",desc:"Story + 8 comprehension questions",   color:C.rose,   icon:"📖" },
      ]
    : [
        { name:"Expressive Vocabulary",  desc:"Child names pictures",               color:C.amber,  icon:"🖼️" },
        { name:"Receptive Vocabulary",   desc:"Child selects matching picture",      color:C.violet, icon:"👁️" },
        { name:"Narrative Comprehension",desc:"Story + comprehension questions",     color:C.rose,   icon:"📖" },
      ];

  return (
    <div style={{ minHeight:"100vh",background:`linear-gradient(160deg,${C.navy},#1a2d4a)`,fontFamily:F.body }}>
      <div style={{ padding:"14px 22px" }}>
        <span style={{ fontFamily:F.display,fontSize:18,fontWeight:700,color:C.white }}>🗣️ LanguageScreen</span>
      </div>
      <div style={{ maxWidth:560,margin:"0 auto",padding:"0 20px 40px" }}>
        <div className="nls-fadeup" style={{ background:C.white,borderRadius:24,padding:"26px 30px",boxShadow:"0 20px 60px rgba(0,0,0,.28)" }}>
          {/* Child chip */}
          <div style={{ background:C.slateLt,borderRadius:14,padding:16,display:"flex",gap:14,alignItems:"center",marginBottom:26 }}>
            <div style={{ width:52,height:52,borderRadius:14,flexShrink:0,background:`linear-gradient(135deg,${C.amber},${C.amberDk})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26 }}>🧒</div>
            <div>
              <div style={{ fontWeight:700,fontSize:19,color:C.navy,fontFamily:F.display }}>{child.name}</div>
              <div style={{ color:C.slate,fontSize:13,marginTop:2 }}>
                {fmtAge(ageYears)}{child.school ? ` · ${child.school}` : ""}{child.assessor ? ` · ${child.assessor}` : ""}
              </div>
            </div>
          </div>
          {/* Test list */}
          <div style={{ fontFamily:F.display,fontSize:16,fontWeight:700,color:C.navy,marginBottom:14 }}>
            {tests.length} subtests · approximately 10 minutes
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:9,marginBottom:24 }}>
            {tests.map((t,i) => (
              <div key={t.name} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:C.slateLt,borderRadius:10,border:`1px solid ${C.border}` }}>
                <div style={{ width:30,height:30,borderRadius:"50%",background:t.color,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0 }}>{i+1}</div>
                <div>
                  <div style={{ fontSize:13.5,fontWeight:600,color:C.navy }}>{t.name}</div>
                  <div style={{ fontSize:12,color:C.slate,marginTop:1 }}>{t.desc}</div>
                </div>
                <div style={{ fontSize:20,marginLeft:"auto",flexShrink:0 }}>{t.icon}</div>
              </div>
            ))}
          </div>
          {/* Voice toggle */}
          <div style={{ border:`1.5px solid ${voiceOn?C.amber:C.border}`,borderRadius:13,padding:"13px 16px",marginBottom:14,background:voiceOn?"#fef9ee":C.white,transition:"all .22s" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div>
                <div style={{ fontWeight:600,fontSize:14,color:C.navy }}>🎤 Voice Commands</div>
                <div style={{ fontSize:12,color:C.slate,marginTop:2 }}>"correct" · "wrong" · "repeat" · "skip"</div>
              </div>
              <button className="nls-btn" onClick={()=>setVoiceOn(v=>!v)} style={{ width:50,height:26,borderRadius:13,flexShrink:0,background:voiceOn?C.amber:"#cbd5e1",position:"relative" }}>
                <div style={{ position:"absolute",top:3,left:voiceOn?25:3,width:20,height:20,borderRadius:"50%",background:C.white,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.22)" }} />
              </button>
            </div>
            {voiceOn && <div style={{ marginTop:9,fontSize:12,color:C.amberDk2,fontWeight:500 }}>✓ Works best in Chrome — allow microphone when prompted</div>}
          </div>
          {/* KB hints */}
          <div style={{ padding:"10px 14px",background:C.slateLt,borderRadius:10,fontSize:12,color:C.slate,marginBottom:26,display:"flex",gap:18,flexWrap:"wrap",alignItems:"center" }}>
            <strong>Keyboard:</strong>
            <span><KBD>Enter</KBD> Correct</span>
            <span><KBD>Backspace</KBD> Incorrect</span>
            <span><KBD>R</KBD> Repeat audio</span>
          </div>
          <button className="nls-btn" onClick={onBegin} style={{
            width:"100%",padding:"18px",
            background:`linear-gradient(135deg,${C.amber},${C.amberDk})`,
            color:C.white,borderRadius:16,fontSize:17,fontWeight:700,
            fontFamily:F.body,boxShadow:`0 10px 32px ${C.amber}55`,
          }}>Begin Assessment 🚀</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Subtest: Expressive Vocabulary ───────────────────────────────────────── */
function EVSubtest({ results, onScore, voiceOn }) {
  const idx = results.length;
  const item = EV_ITEMS[idx];
  const [flash, setFlash] = useState(null);
  const [busy,  setBusy]  = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const doScore = useCallback((correct) => {
    if (busy || !item) return;
    setBusy(true); setFlash(correct?"g":"r");
    setFeedback(correct?"correct":"incorrect");
    speakAutoTTS(correct?"Amazing!":"Let's try the next one!");
    if (correct) setCelebration(true);
    onScore(correct);
    setTimeout(()=>{ setFlash(null); setBusy(false); setCelebration(false); setFeedback(null); }, 1200);
  }, [busy, item, onScore]);

  const { listening, lastHeard } = useVoiceCommands({
    enabled:voiceOn,
    onCommand:cmd=>{ if(cmd==="correct")doScore(true); if(cmd==="incorrect")doScore(false); },
  });

  useEffect(()=>{
    function h(e){ if(e.key==="Enter")doScore(true); if(e.key==="Backspace")doScore(false); }
    window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h);
  }, [doScore]);

  useEffect(()=>{
    if (!item) return;
    speakAutoTTS(`Question ${idx+1} of ${EV_ITEMS.length}. Show the child this picture and ask: What is this called?`);
    return ()=>window.speechSynthesis.cancel();
  }, [idx]);

  if (!item) return null;
  const scene = SceneSVG({word:item.word});

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",minHeight:0,background:"linear-gradient(180deg,#f0f7ff 0%,#fefefe 100%)" }}>
      <SubtestHeader title="Expressive Vocabulary" icon="🖼️" color={C.amber} results={results} total={EV_ITEMS.length} />
      {/* Star progress */}
      <div style={{padding:"10px 22px",background:"white",borderBottom:`1px solid ${C.border}`}}>
        <StarProgress current={idx} total={EV_ITEMS.length}/>
      </div>
      <Note color="#9a3412" bg="#fff7ed" text={`Show the child this picture and ask: "What is this called?" Do not name the picture.`} />
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28 }}>
        {/* Picture frame */}
        <div key={idx} className={`nls-pop ${flash==="g"?"nls-correctGlow":flash==="r"?"nls-gentleShake":""}`} style={{
          width:280,height:280,borderRadius:28,background:C.white,
          border:`4px solid ${flash==="g"?"#10b981":flash==="r"?"#f43f5e":"#fde68a"}`,
          boxShadow:"0 16px 48px rgba(0,0,0,.12)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          marginBottom:22,position:"relative",overflow:"hidden",
        }}>
          {scene ? (
            <div style={{width:"100%",height:"100%",padding:8,boxSizing:"border-box"}}>{scene}</div>
          ) : (
            <div style={{ fontSize:120 }}>{item.emoji}</div>
          )}
          <div style={{ position:"absolute",top:12,right:16,fontSize:12,fontWeight:700,color:C.slate,fontFamily:F.body,background:"rgba(255,255,255,0.9)",padding:"2px 10px",borderRadius:20 }}>#{idx+1}</div>
          <CelebrationBurst show={celebration}/>
        </div>

        {/* Feedback */}
        {feedback==="correct" && (
          <div className="nls-bubblePop" style={{fontSize:20,fontWeight:800,color:"#10b981",marginBottom:10,fontFamily:F.display}}>
            Amazing! ⭐
          </div>
        )}
        {feedback==="incorrect" && (
          <div className="nls-bubblePop" style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <TedBear size={40} mood="encouraging"/>
            <span style={{fontSize:14,fontWeight:600,color:C.slate,fontFamily:F.body}}>Let's try the next one! 💪</span>
          </div>
        )}

        {/* Answer hint */}
        <div style={{ background:C.navy,color:"#94a3b8",borderRadius:14,padding:"10px 22px",marginBottom:24,fontSize:13,fontFamily:F.body,display:"flex",gap:10,alignItems:"center" }}>
          <span style={{ color:"#64748b" }}>Accepts:</span>
          <strong style={{ color:C.amber }}>{item.word}</strong>
          {item.accept.length>0 && <span style={{ color:"#64748b" }}>· also: {item.accept.join(" / ")}</span>}
        </div>
        {/* Big chunky score buttons */}
        <div style={{ display:"flex", gap:16, width:"100%", maxWidth:400 }}>
          <button className="nls-btn" onClick={busy?undefined:()=>doScore(true)} style={{
            flex:1, padding:"20px 12px",
            background:busy?"#e2e8f0":"linear-gradient(135deg,#10b981,#059669)",
            color:busy?C.slate:C.white,
            borderRadius:20, fontSize:18, fontWeight:800, fontFamily:F.body,
            boxShadow:busy?"none":"0 6px 24px rgba(16,185,129,0.4)",
            cursor:busy?"not-allowed":"pointer",
          }}>✓ Correct</button>
          <button className="nls-btn" onClick={busy?undefined:()=>doScore(false)} style={{
            flex:1, padding:"20px 12px",
            background:busy?"#e2e8f0":"linear-gradient(135deg,#f43f5e,#e11d48)",
            color:busy?C.slate:C.white,
            borderRadius:20, fontSize:18, fontWeight:800, fontFamily:F.body,
            boxShadow:busy?"none":"0 6px 24px rgba(244,63,94,0.4)",
            cursor:busy?"not-allowed":"pointer",
          }}>✗ Incorrect</button>
        </div>
        <div style={{ marginTop:16 }}><VoiceBar listening={listening} lastHeard={lastHeard} /></div>
      </div>
    </div>
  );
}

/* ─── Subtest: Receptive Vocabulary ────────────────────────────────────────── */
function RVSubtest({ results, onScore, voiceOn }) {
  const idx = results.length;
  const raw = RV_ITEMS[idx];
  const [item,   setItem]   = useState(null);
  const [chosen, setChosen] = useState(null);
  const [busy,   setBusy]   = useState(false);

  useEffect(()=>{ if(raw) setItem(shuffleRV(raw)); setChosen(null); }, [idx]);

  const doScore = useCallback((selIdx) => {
    if (busy||!item) return;
    setBusy(true);
    const correct = selIdx===item.correctDisplayIdx;
    setChosen(selIdx);
    setTimeout(()=>{ onScore(correct); setBusy(false); }, 600);
  }, [busy, item, onScore]);

  const { listening, lastHeard } = useVoiceCommands({
    enabled:voiceOn,
    onCommand:cmd=>{ if(cmd==="correct"&&item) doScore(item.correctDisplayIdx); },
  });

  if (!item) return null;
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",minHeight:0,background:"linear-gradient(180deg,#f5f3ff 0%,#fefefe 100%)" }}>
      <SubtestHeader title="Receptive Vocabulary" icon="👁️" color={C.violet} results={results} total={RV_ITEMS.length} />
      <div style={{padding:"10px 22px",background:"white",borderBottom:`1px solid ${C.border}`}}>
        <StarProgress current={idx} total={RV_ITEMS.length}/>
      </div>
      <Note color="#5b21b6" bg="#f5f3ff" text="Say the word and ask the child to point to or say the number of the matching picture." />
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28 }}>
        {/* Word */}
        <div key={idx} className="nls-pop" style={{
          background:C.violet,color:C.white,borderRadius:20,
          padding:"14px 48px",marginBottom:30,fontFamily:F.display,fontSize:32,fontWeight:700,
          boxShadow:`0 8px 28px ${C.violet}50`,letterSpacing:-.5,
        }}>{item.word}</div>
        {/* 2×2 grid */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,width:"100%",maxWidth:360 }}>
          {item.displayOpts.map((emoji,i)=>{
            const isChosen = chosen===i;
            const isCorrect = i===item.correctDisplayIdx;
            const revealed = chosen!==null;
            let bg=C.white, border=`2px solid ${C.border}`;
            if (revealed&&isChosen&&isCorrect)  { bg=C.greenLt; border=`2px solid ${C.green}`; }
            if (revealed&&isChosen&&!isCorrect) { bg=C.redLt;   border=`2px solid ${C.red}`;   }
            if (revealed&&!isChosen&&isCorrect) { bg=C.greenLt; border=`2px dashed ${C.green}`; }
            return (
              <div key={i} className={!revealed?"nls-card-opt":""} onClick={()=>!busy&&!revealed&&doScore(i)} style={{
                background:bg,border,borderRadius:18,
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                gap:8,padding:"20px 10px",boxShadow:"0 4px 14px rgba(0,0,0,.07)",
                cursor:revealed?"default":"pointer",
              }}>
                <div style={{ fontSize:52 }}>{emoji}</div>
                <div style={{ width:26,height:26,borderRadius:"50%",background:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.body,fontWeight:700,fontSize:13,color:C.slate }}>{i+1}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:20 }}><VoiceBar listening={listening} lastHeard={lastHeard} /></div>
      </div>
    </div>
  );
}

/* ─── Subtest: Sentence Repetition ─────────────────────────────────────────── */
function SRSubtest({ results, onScore, voiceOn }) {
  const idx = results.length;
  const item = SR_ITEMS[idx];
  const { speak, cancel } = useTTS();
  const [played,  setPlayed]  = useState(false);
  const [playing, setPlaying] = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [flash,   setFlash]   = useState(null);

  useEffect(()=>{ setPlayed(false); setPlaying(false); setBusy(false); setFlash(null); return()=>cancel(); }, [idx]);

  const playAudio = useCallback(()=>{
    if (!item) return;
    setPlaying(true); speak(item.s, 0.82); setPlayed(true);
    setTimeout(()=>setPlaying(false), item.s.length*62+1200);
  }, [item, speak]);

  const doScore = useCallback((correct)=>{
    if (busy||!played) return;
    setBusy(true); setFlash(correct?"g":"r"); cancel();
    onScore(correct);
    setTimeout(()=>{ setFlash(null); setBusy(false); }, 500);
  }, [busy, played, cancel, onScore]);

  const { listening, lastHeard } = useVoiceCommands({
    enabled:voiceOn,
    onCommand:cmd=>{ if(cmd==="correct")doScore(true); if(cmd==="incorrect")doScore(false); if(cmd==="repeat")playAudio(); },
  });

  useEffect(()=>{
    function h(e){
      if(e.key==="r"||e.key==="R") playAudio();
      if(e.key==="Enter")           doScore(true);
      if(e.key==="Backspace")       doScore(false);
    }
    window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h);
  }, [playAudio, doScore]);

  if (!item) return null;
  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",minHeight:0,background:C.surface }}>
      <SubtestHeader title="Sentence Repetition" icon="🔊" color={C.teal} results={results} total={SR_ITEMS.length} />
      <div style={{padding:"10px 22px",background:"white",borderBottom:`1px solid ${C.border}`}}>
        <StarProgress current={idx} total={SR_ITEMS.length}/>
      </div>
      <Note color="#0e7490" bg="#ecfeff" text="Play the sentence. Ask the child to repeat it exactly. One error = incorrect." />
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28 }}>
        {/* Play button */}
        <button className="nls-btn" onClick={playAudio} disabled={playing} style={{
          width:120,height:120,borderRadius:"50%",
          background:playing?C.amberLt:`linear-gradient(135deg,${C.teal},#0e7490)`,
          color:playing?C.amberDk:C.white,fontSize:44,
          boxShadow:playing?"none":`0 14px 40px ${C.teal}55`,
          marginBottom:22,display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all .22s",border:playing?`2.5px solid ${C.amber}`:"none",
        }}>
          {playing?"⏸":"▶"}
        </button>
        {played && (
          <p style={{ color:C.slate,fontSize:13,margin:"0 0 6px",fontFamily:F.body }}>
            Sentence played ·{" "}
            <button className="nls-btn" onClick={playAudio} style={{ background:"transparent",color:C.teal,fontFamily:F.body,fontSize:13,fontWeight:600,textDecoration:"underline" }}>play again</button>
            <span style={{ color:"#cbd5e1",marginLeft:8 }}>or <KBD>R</KBD></span>
          </p>
        )}
        {!played && <p style={{ color:C.slate,fontSize:13.5,margin:"0 0 22px",textAlign:"center",fontFamily:F.body,maxWidth:280 }}>Press ▶ then ask the child to repeat the sentence exactly.</p>}
        {/* Hidden sentence */}
        <div style={{ background:C.navy,borderRadius:14,padding:"14px 22px",maxWidth:460,width:"100%",marginBottom:28,marginTop:10,position:"relative",overflow:"hidden" }}>
          <div style={{ fontSize:12,color:"#64748b",fontFamily:F.body,marginBottom:6 }}>Assessor reference:</div>
          <div style={{
            fontFamily:F.body,fontSize:15,color:played?C.white:"transparent",
            fontStyle:"italic",lineHeight:1.65,
            filter:played?"none":"blur(7px)",transition:"all .4s",
          }}>"{item.s}"</div>
          {!played && <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12.5,color:"#64748b",fontFamily:F.body }}>🔒 Play sentence to reveal</div>}
        </div>
        <ScoreBtns onCorrect={()=>doScore(true)} onIncorrect={()=>doScore(false)} disabled={!played||busy} />
        <div style={{ marginTop:16 }}><VoiceBar listening={listening} lastHeard={lastHeard} /></div>
      </div>
    </div>
  );
}

/* ─── Subtest: Narrative Comprehension ─────────────────────────────────────── */
function NarrSubtest({ results, onScore, voiceOn }) {
  const [phase,     setPhase]     = useState("story");
  const [qIdx,      setQIdx]      = useState(0);
  const [reading,   setReading]   = useState(false);
  const [storyDone, setStoryDone] = useState(false);
  const [busy,      setBusy]      = useState(false);
  const { speak, cancel }         = useTTS();

  useEffect(()=>()=>cancel(), [cancel]);

  function readStory() {
    setReading(true); speak(STORY, 0.8); setStoryDone(true);
    setTimeout(()=>setReading(false), STORY.length*52+2000);
  }

  const doScore = useCallback((correct)=>{
    if (busy) return;
    setBusy(true);
    onScore(correct);
    setTimeout(()=>{
      setBusy(false);
      const next = qIdx+1;
      if (next < NQ_ITEMS.length) setQIdx(next);
    }, 500);
  }, [busy, onScore, qIdx]);

  const { listening, lastHeard } = useVoiceCommands({
    enabled:voiceOn,
    onCommand:cmd=>{
      if(phase==="story"&&cmd==="repeat") readStory();
      if(phase==="questions"){
        if(cmd==="correct")   doScore(true);
        if(cmd==="incorrect") doScore(false);
        if(cmd==="repeat")    speak(NQ_ITEMS[qIdx]?.q, 0.86);
      }
    },
  });

  useEffect(()=>{
    function h(e){
      if(phase==="questions"){
        if(e.key==="Enter")     doScore(true);
        if(e.key==="Backspace") doScore(false);
        if(e.key==="r"||e.key==="R") speak(NQ_ITEMS[qIdx]?.q, 0.86);
      }
    }
    window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h);
  }, [phase, doScore, speak, qIdx]);

  const question = NQ_ITEMS[qIdx];

  if (phase==="story") return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",minHeight:0,background:C.surface }}>
      <SubtestHeader title="Narrative Comprehension" icon="📖" color={C.rose} results={results} total={NQ_ITEMS.length} />
      <div style={{padding:"10px 22px",background:"white",borderBottom:`1px solid ${C.border}`}}>
        <StarProgress current={results.length} total={NQ_ITEMS.length}/>
      </div>
      <Note color="#9f1239" bg="#fff1f2" text="Read or play the story to the child. Child should NOT see the text. Then click 'Begin Questions'." />
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28 }}>
        {/* Story text */}
        <div style={{ background:C.white,borderRadius:20,padding:"22px 26px",boxShadow:"0 8px 32px rgba(0,0,0,.1)",maxWidth:500,width:"100%",border:`1px solid ${C.border}`,marginBottom:24,maxHeight:280,overflowY:"auto" }}>
          <div style={{ fontSize:14,fontWeight:700,color:C.slate,marginBottom:12,fontFamily:F.body }}>📚 The Story of Ember the Fox</div>
          {STORY.split("\n\n").map((para,i)=>(
            <p key={i} style={{ fontSize:14.5,lineHeight:1.75,color:C.navy,fontFamily:F.body,margin:"0 0 12px" }}>{para}</p>
          ))}
        </div>
        <div style={{ display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center" }}>
          <button className="nls-btn" onClick={readStory} disabled={reading} style={{
            padding:"13px 24px",
            background:reading?C.slateLt:`linear-gradient(135deg,${C.teal},#0e7490)`,
            color:reading?C.slate:C.white,borderRadius:12,fontSize:14,fontWeight:700,fontFamily:F.body,
            boxShadow:reading?"none":`0 6px 22px ${C.teal}44`,
          }}>
            {reading?"🔊 Reading aloud…":"🔊 Read story aloud"}
          </button>
          <button className="nls-btn" onClick={()=>{ cancel(); setPhase("questions"); }} disabled={!storyDone&&!reading} style={{
            padding:"13px 28px",
            background:(storyDone||reading)?`linear-gradient(135deg,${C.rose},#be123c)`:"#e2e8f0",
            color:(storyDone||reading)?C.white:C.slate,
            borderRadius:12,fontSize:14,fontWeight:700,fontFamily:F.body,
            boxShadow:(storyDone||reading)?`0 6px 22px ${C.rose}44`:"none",
            cursor:(storyDone||reading)?"pointer":"not-allowed",
          }}>Begin Questions →</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",minHeight:0,background:C.surface }}>
      <SubtestHeader title="Narrative Comprehension" icon="📖" color={C.rose} results={results} total={NQ_ITEMS.length} />
      <div style={{padding:"10px 22px",background:"white",borderBottom:`1px solid ${C.border}`}}>
        <StarProgress current={results.length} total={NQ_ITEMS.length}/>
      </div>
      <Note color="#9f1239" bg="#fff1f2" text="Ask each question. For inference questions accept any reasonable answer." />
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28 }}>
        {question && (
          <>
            <div key={`badge-${qIdx}`} className="nls-slide" style={{
              background:question.type==="inference"?C.violetLt:C.roseLt,
              color:question.type==="inference"?C.violet:C.rose,
              borderRadius:8,padding:"4px 12px",fontSize:11.5,fontWeight:700,
              fontFamily:F.body,letterSpacing:.8,textTransform:"uppercase",marginBottom:14,
            }}>
              {question.type==="inference"?"💭":"🔁"} Q{qIdx+1} / {NQ_ITEMS.length} · {question.type}
            </div>
            <div key={`q-${qIdx}`} className="nls-pop" style={{
              background:C.white,borderRadius:20,padding:"22px 26px",
              boxShadow:"0 8px 32px rgba(0,0,0,.1)",maxWidth:480,width:"100%",
              border:`2px solid ${C.border}`,marginBottom:22,textAlign:"center",
            }}>
              <p style={{ fontFamily:F.display,fontSize:22,fontWeight:600,color:C.navy,margin:0,lineHeight:1.45 }}>{question.q}</p>
            </div>
            <div style={{ background:C.navy,borderRadius:12,padding:"10px 20px",display:"flex",gap:8,alignItems:"center",marginBottom:26,maxWidth:400,width:"100%" }}>
              <span style={{ fontSize:12,color:"#64748b",fontFamily:F.body,flexShrink:0 }}>Accepts:</span>
              <span style={{ fontSize:13,color:C.amber,fontWeight:600,fontFamily:F.body }}>{question.ans}</span>
            </div>
            <ScoreBtns onCorrect={()=>doScore(true)} onIncorrect={()=>doScore(false)} disabled={busy} />
          </>
        )}
        <div style={{ marginTop:16 }}><VoiceBar listening={listening} lastHeard={lastHeard} /></div>
      </div>
    </div>
  );
}

/* ─── Screen: Results ───────────────────────────────────────────────────────── */
function Results({ child, ageYears, subtests, onClose, onComplete }) {
  const totalRaw = useMemo(()=>subtests.reduce((s,t)=>s+t.results.filter(r=>r.correct).length,0), [subtests]);
  const ss       = useMemo(()=>rawToSS(totalRaw,ageYears), [totalRaw,ageYears]);
  const pct      = useMemo(()=>ssToPct(ss), [ss]);
  const band     = useMemo(()=>getBand(ss), [ss]);

  const subtestScores = useMemo(()=>subtests.map(s=>{
    const raw=s.results.filter(r=>r.correct).length;
    return { ...s, raw, total:s.results.length, pctRaw:s.results.length>0?Math.round(raw/s.results.length*100):0 };
  }), [subtests]);

  const recs = useMemo(()=>{
    if (band.short==="GREEN") return [
      "Language development appears on track — continue enrichment through quality shared book reading.",
      "Reassess at end of year to track ongoing progress.",
      "May benefit from NELI Whole Class enrichment activities.",
    ];
    if (band.short==="AMBER") return [
      "Consider additional language support — NELI small group sessions are likely to be beneficial.",
      "Discuss with class teacher and make note for parent/carer communication.",
      "Reassess in 6–8 weeks to monitor progress.",
      "If concerns persist, refer to SENCO or speech and language therapist.",
    ];
    return [
      "This child would strongly benefit from the NELI individual/small group intervention.",
      "Prioritise for NELI selection — targeted group of 3–6 lowest-scoring pupils.",
      "If standard score ≤76, consider referral to a Speech and Language Therapist.",
      "Inform parents/carers of results and planned support.",
      "Reassess on completion of the NELI programme (approximately 20 weeks).",
    ];
  }, [band]);

  useEffect(()=>{
    const report = {
      date:child.date, childName:child.name, dob:child.dob, ageYears,
      school:child.school, assessor:child.assessor, notes:child.notes,
      totalRaw, standardScore:ss, percentile:pct, band:band.short, subtestScores,
    };
    onComplete?.(report);
    try {
      const h = JSON.parse(localStorage.getItem("nls-history")||"[]");
      h.unshift({...report, id:Date.now()});
      localStorage.setItem("nls-history", JSON.stringify(h.slice(0,200)));
    } catch {}
  }, []);

  const arcLen  = 283; // 2πr where r=45
  const arcFill = arcLen - Math.round((ss-40)/(160-40)*arcLen);
  const subtestColors = [C.amber, C.violet, C.teal, C.rose];

  return (
    <div style={{ minHeight:"100vh",background:C.navy,fontFamily:F.body,overflowY:"auto" }}>
      {/* Sticky bar */}
      <div className="nls-no-print" style={{
        position:"sticky",top:0,zIndex:10,
        background:C.navy,borderBottom:"1px solid #1e3a5f",
        padding:"12px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",
      }}>
        <span style={{ fontFamily:F.display,fontSize:18,fontWeight:700,color:C.white }}>🗣️ Assessment Report</span>
        <div style={{ display:"flex",gap:10 }}>
          <button className="nls-btn" onClick={()=>window.print()} style={{ background:C.navyLight,color:"#94a3b8",borderRadius:9,padding:"8px 16px",fontSize:13,fontFamily:F.body }}>🖨️ Print</button>
          <button className="nls-btn" onClick={onClose} style={{ background:C.amber,color:C.white,borderRadius:9,padding:"8px 16px",fontSize:13,fontFamily:F.body,fontWeight:600 }}>✓ Done</button>
        </div>
      </div>

      <div style={{ maxWidth:720,margin:"0 auto",padding:"24px 20px 48px" }}>

        {/* ── Summary card ── */}
        <div className="nls-fadeup" style={{ background:C.white,borderRadius:22,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.32)",marginBottom:18 }}>
          {/* Colour header */}
          <div style={{ background:band.color,padding:"18px 26px 16px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
              <div>
                <div style={{ fontFamily:F.display,fontSize:26,fontWeight:700,color:C.white,marginBottom:4 }}>{child.name}</div>
                <div style={{ color:"rgba(255,255,255,.8)",fontSize:13,fontFamily:F.body }}>
                  {fmtAge(ageYears)} · {child.school||"School not specified"} · {child.date}
                </div>
              </div>
              <div style={{ background:"rgba(0,0,0,.2)",borderRadius:14,padding:"10px 18px",textAlign:"center" }}>
                <div style={{ color:"rgba(255,255,255,.7)",fontSize:11,fontWeight:600,fontFamily:F.body,letterSpacing:1.2,marginBottom:4 }}>OVERALL BAND</div>
                <div style={{ fontSize:20,fontWeight:700,color:C.white,fontFamily:F.display }}>{band.tag} {band.label}</div>
              </div>
            </div>
          </div>
          {/* Score row */}
          <div style={{ display:"flex",gap:0,borderBottom:`1px solid ${C.border}` }}>
            {/* Gauge */}
            <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"26px 20px",borderRight:`1px solid ${C.border}` }}>
              <svg width={110} height={110} viewBox="0 0 110 110">
                <circle cx={55} cy={55} r={45} fill="none" stroke={C.slateLt} strokeWidth={10}/>
                <circle cx={55} cy={55} r={45} fill="none" stroke={band.color} strokeWidth={10}
                  strokeLinecap="round" strokeDasharray={arcLen} strokeDashoffset={arcFill}
                  transform="rotate(-90 55 55)"
                  style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
                />
                <text x={55} y={50} textAnchor="middle" fontSize={22} fontWeight={700} fill={band.color} fontFamily={F.display}>{ss}</text>
                <text x={55} y={65} textAnchor="middle" fontSize={10} fill={C.slate} fontFamily={F.body}>Std Score</text>
              </svg>
            </div>
            {/* Stats grid */}
            <div style={{ flex:2,display:"grid",gridTemplateColumns:"1fr 1fr",padding:"20px 26px",gap:"14px 24px" }}>
              {[
                { label:"Percentile Rank", value:`${pct}${["","st","nd","rd"][pct]||"th"}` },
                { label:"Raw Score", value:`${totalRaw}/${subtests.reduce((s,t)=>s+t.results.length,0)}` },
                { label:"Age at Test", value:fmtAge(ageYears) },
                { label:"Assessor", value:child.assessor||"—" },
              ].map(({label,value})=>(
                <div key={label}>
                  <div style={{ fontSize:11.5,color:C.slate,fontWeight:600,marginBottom:3,letterSpacing:.5 }}>{label}</div>
                  <div style={{ fontSize:20,fontWeight:700,color:C.navy,fontFamily:F.display }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Traffic light key */}
          <div style={{ padding:"14px 26px",display:"flex",gap:10,flexWrap:"wrap" }}>
            {[
              { c:C.green,  bg:C.greenLt, label:"Green  SS ≥ 90",  desc:"No concern",       short:"GREEN" },
              { c:C.amberDk,bg:C.amberLt, label:"Amber  SS 82–89", desc:"May need support",  short:"AMBER" },
              { c:C.red,    bg:C.redLt,   label:"Red  SS ≤ 81",    desc:"Needs support",     short:"RED"   },
            ].map(t=>(
              <div key={t.short} style={{ background:t.bg,borderRadius:9,padding:"6px 14px",border:`1.5px solid ${t.c}44`,display:"flex",gap:8,alignItems:"center",opacity:band.short===t.short?1:.45 }}>
                <div style={{ width:10,height:10,borderRadius:"50%",background:t.c,flexShrink:0 }} />
                <span style={{ fontSize:12.5,fontWeight:600,color:t.c }}>{t.label}</span>
                <span style={{ fontSize:12,color:C.slate }}>· {t.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Subtest profile ── */}
        <div className="nls-fadeup" style={{ background:C.white,borderRadius:22,padding:"22px 26px",boxShadow:"0 12px 40px rgba(0,0,0,.22)",marginBottom:18,animationDelay:".1s" }}>
          <h3 style={{ fontFamily:F.display,fontSize:20,fontWeight:700,color:C.navy,margin:"0 0 20px" }}>Subtest Profile</h3>
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            {subtestScores.map((s,i)=>{
              const c = subtestColors[i%subtestColors.length];
              return (
                <div key={s.id}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center" }}>
                    <span style={{ fontSize:14,fontWeight:600,color:C.navy,fontFamily:F.body }}>{s.label}</span>
                    <span style={{ fontSize:13,color:C.slate,fontFamily:F.body }}>{s.raw}/{s.total} ({s.pctRaw}%)</span>
                  </div>
                  <div style={{ background:C.slateLt,borderRadius:8,height:12,overflow:"hidden" }}>
                    <div style={{ height:"100%",borderRadius:8,background:c,width:`${s.pctRaw}%`,transition:"width 1s ease" }} />
                  </div>
                  <div style={{ display:"flex",gap:4,marginTop:6,flexWrap:"wrap" }}>
                    {s.results.map((r,j)=>(
                      <div key={j} title={r.correct?"Correct":"Incorrect"} style={{ width:13,height:13,borderRadius:3,background:r.correct?C.correct:C.wrong }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recommendations ── */}
        <div className="nls-fadeup" style={{
          background:C.white,borderRadius:22,padding:"22px 26px",
          boxShadow:"0 12px 40px rgba(0,0,0,.22)",marginBottom:18,
          borderTop:`4px solid ${band.color}`,animationDelay:".18s",
        }}>
          <h3 style={{ fontFamily:F.display,fontSize:20,fontWeight:700,color:C.navy,margin:"0 0 16px" }}>
            {band.tag} Recommendations
          </h3>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {recs.map((r,i)=>(
              <div key={i} style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                <div style={{ width:22,height:22,borderRadius:6,background:band.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:band.dark,flexShrink:0,marginTop:1 }}>{i+1}</div>
                <p style={{ margin:0,fontSize:14,lineHeight:1.65,color:C.navy,fontFamily:F.body }}>{r}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Notes ── */}
        {child.notes && (
          <div className="nls-fadeup" style={{ background:C.white,borderRadius:22,padding:"20px 26px",boxShadow:"0 12px 40px rgba(0,0,0,.22)",marginBottom:18,animationDelay:".22s" }}>
            <h3 style={{ fontFamily:F.display,fontSize:18,fontWeight:700,color:C.navy,margin:"0 0 10px" }}>Assessor Notes</h3>
            <p style={{ margin:0,fontSize:14,color:C.navy,fontFamily:F.body,lineHeight:1.65 }}>{child.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ color:"#475569",fontSize:12,textAlign:"center",lineHeight:1.7,fontFamily:F.body,padding:"8px 0" }}>
          LanguageScreen assessment · {child.date}<br/>
          Scoring: Hulme et al. (2024). <em>Language, Speech, and Hearing Services in Schools.</em> 55(3), 904–917.<br/>
          Green SS≥90 · Amber SS 82–89 · Red SS≤81 · This report does not replace clinical assessment.
        </div>
      </div>
    </div>
  );
}

/* ─── Root App ──────────────────────────────────────────────────────────────── */
export default function LanguageScreenApp({
  studentName   = "",
  studentDob    = "",
  schoolName    = "",
  assessorName  = "",
  onClose       = () => {},
  onComplete    = () => {},
}) {
  const [screen,   setScreen]   = useState("intro");
  const [child,    setChild]    = useState(null);
  const [voiceOn,  setVoiceOn]  = useState(false);
  useEffect(()=>()=>window.speechSynthesis.cancel(),[]);
  const [subtests, setSubtests] = useState([]);
  const [curTest,  setCurTest]  = useState(0);

  const ageYears = child?.dob ? calcAge(child.dob) : 0;

  function buildPlan(dob) {
    const age = calcAge(dob);
    const base = [
      { id:"ev",   label:"Expressive Vocabulary",   items:EV_ITEMS },
      { id:"rv",   label:"Receptive Vocabulary",    items:RV_ITEMS },
    ];
    if (age >= 5) base.push({ id:"sr", label:"Sentence Repetition", items:SR_ITEMS });
    base.push({ id:"narr", label:"Narrative Comprehension", items:NQ_ITEMS });
    return base.map(t => ({ ...t, results:[] }));
  }

  function handleConfirm(childData) {
    setChild(childData);
    setSubtests(buildPlan(childData.dob));
    setCurTest(0);
    setScreen("ready");
  }

  function handleScore(correct) {
    setSubtests(prev => {
      const next = prev.map((t,i) => {
        if (i !== curTest) return t;
        const results = [...t.results, { correct }];
        return { ...t, results };
      });
      const updated = next[curTest];
      // Check discontinue or exhausted
      if (checkDisc(updated.results) || updated.results.length >= updated.items.length) {
        if (curTest + 1 < next.length) {
          setTimeout(() => setCurTest(c => c + 1), 150);
        } else {
          setTimeout(() => setScreen("results"), 400);
        }
      }
      return next;
    });
  }

  const current = subtests[curTest];
  const wrap = { position:"fixed",inset:0,zIndex:9999,display:"flex",flexDirection:"column",overflowY:"auto" };

  if (screen === "intro") return <OwlIntro onDismiss={()=>setScreen("welcome")} />;
  if (screen === "welcome") return <div style={wrap}><Welcome onStart={()=>setScreen("setup")} /></div>;
  if (screen === "setup")   return <div style={wrap}><Setup prefill={{studentName,studentDob,schoolName,assessorName}} onConfirm={handleConfirm} onBack={()=>setScreen("welcome")} /></div>;
  if (screen === "ready")   return <div style={wrap}><Ready child={child} ageYears={ageYears} voiceOn={voiceOn} setVoiceOn={setVoiceOn} onBegin={()=>setScreen("assessing")} /></div>;

  if (screen === "assessing" && current) {
    const props = { results:current.results, onScore:handleScore, voiceOn };
    return (
      <div style={wrap}>
        {current.id==="ev"   && <EVSubtest   {...props} />}
        {current.id==="rv"   && <RVSubtest   {...props} />}
        {current.id==="sr"   && <SRSubtest   {...props} />}
        {current.id==="narr" && <NarrSubtest {...props} />}
      </div>
    );
  }

  if (screen === "results") return (
    <div style={wrap}>
      <Results child={child} ageYears={ageYears} subtests={subtests} onClose={onClose} onComplete={onComplete} />
    </div>
  );

  return null;
}
