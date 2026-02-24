import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// SMB AI OS — Universal White-Label Business Intelligence Platform
// Real Claude API · Persistent Storage · Full Onboarding · Production
// ═══════════════════════════════════════════════════════════════════

async function sGet(key) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function sSet(key, val) { try { await window.storage.set(key, JSON.stringify(val)); } catch {} }
async function sDel(key) { try { await window.storage.delete(key); } catch {} }

async function claude(messages, system, maxTokens = 700) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system, messages }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(b => b.text || "").join("");
}

function buildBotPrompt(biz) {
  return `You are the AI front-desk assistant for ${biz.name}, a ${biz.type} in ${biz.location}.
DESCRIPTION: ${biz.description}
OFFERINGS: ${biz.offerings}
PRICING: ${biz.pricing}
HOURS: ${biz.hours}
CONTACT: ${biz.contact}
${biz.extra ? `EXTRA: ${biz.extra}` : ""}
VOICE: ${biz.tone}
Be warm, brief (2-3 sentences), helpful. Always move toward booking/next step. Never invent information.`;
}

function buildContentPrompt(biz) {
  return `You are the social media content writer for ${biz.name}, a ${biz.type} in ${biz.location}.
VOICE: ${biz.tone}
OFFERINGS: ${biz.offerings}
Write authentic posts — not generic AI copy. Sound like the real owner. Include CTA and 5-8 hashtags.`;
}

function buildLeadPrompt(biz) {
  return `You are drafting a follow-up for ${biz.name} (${biz.type}).
VOICE: ${biz.tone}
OFFERINGS: ${biz.offerings}
Write under 80 words. Warm, personal, in the owner's voice. Move toward booking/next step.`;
}

// ── TOKENS ────────────────────────────────────────────────────────
const T = {
  bg:"#f5f4f0",surface:"#ffffff",panel:"#f0efe9",
  border:"#e5e2da",border2:"#d4d0c6",
  ink:"#1a1916",dim:"#6a6560",muted:"#a09a92",
  green:"#1a7a45",greenL:"#edf7f2",
  red:"#c8150a",redL:"#fef0ef",
  gold:"#b8760a",goldL:"#fdf5e6",
  purple:"#6d28d9",purpleL:"#f3f0fe",
  accent:"#2952e3",accentL:"#eef1fd",
};

// ── BASE COMPONENTS ───────────────────────────────────────────────
function Btn({ children, onClick, bg, color="#fff", disabled, full, sm, style={} }) {
  const p = sm ? "7px 14px" : "10px 20px";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily:"inherit", fontSize: sm?"0.7rem":"0.78rem", fontWeight:700,
      letterSpacing:"0.06em", textTransform:"uppercase", padding:p,
      background:bg||T.accent, color, border:"none", cursor:"pointer",
      borderRadius:2, opacity:disabled?0.6:1, width:full?"100%":"auto",
      display:"inline-flex", alignItems:"center", gap:6, justifyContent:"center",
      transition:"filter 0.15s", ...style
    }}
    onMouseEnter={e=>e.currentTarget.style.filter="brightness(0.92)"}
    onMouseLeave={e=>e.currentTarget.style.filter="brightness(1)"}
    >{children}</button>
  );
}

function Field({ label, children, half }) {
  return <div style={{ marginBottom:14, gridColumn: half?"span 1":undefined }}><label style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:T.muted, display:"block", marginBottom:5 }}>{label}</label>{children}</div>;
}

const inputStyle = { width:"100%", padding:"10px 13px", fontFamily:"inherit", fontSize:"0.88rem", border:`1.5px solid ${T.border2}`, background:T.bg, color:T.ink, outline:"none", borderRadius:2, transition:"border-color 0.15s" };
function Input({ value, onChange, placeholder, type="text" }) {
  return <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />;
}
function Textarea({ value, onChange, placeholder, rows=4 }) {
  return <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...inputStyle, resize:"vertical", lineHeight:1.6}} />;
}
function Select({ value, onChange, options }) {
  return <select value={value||""} onChange={e=>onChange(e.target.value)} style={{...inputStyle, appearance:"none", backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")", backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", paddingRight:32}}>
    {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
  </select>;
}

function Card({ children, style={} }) {
  return <div style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", ...style }}>{children}</div>;
}
function CardHeader({ title, right }) {
  return <div style={{ padding:"13px 18px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
    <div style={{ fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" }}>{title}</div>
    {right}
  </div>;
}

function Tag({ type }) {
  const M = { hot:[T.redL,T.red,"Hot"], new:[T.accentL,T.accent,"New"], trial:[T.goldL,T.gold,"Trial"], member:[T.greenL,T.green,"Member"], camp:[T.purpleL,T.purple,"Camp"], cold:[T.panel,T.muted,"Cold"], qualified:[T.greenL,T.green,"Qualified"] };
  const [bg,color,label] = M[type]||M.new;
  return <span style={{ fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"3px 8px", borderRadius:2, background:bg, color }}>{label}</span>;
}

function Dot({ on }) {
  return <div style={{ width:8, height:8, borderRadius:"50%", background:on?T.green:T.muted, boxShadow:on?`0 0 6px ${T.green}`:"none", flexShrink:0 }} />;
}

function Spinner({ light }) {
  return <span style={{ width:13, height:13, border:`2px solid ${light?"rgba(255,255,255,0.3)":T.border2}`, borderTopColor:light?"white":T.accent, borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite", flexShrink:0 }} />;
}

// ═══════════════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════════════
const BIZ_TYPES = ["Gym / Martial Arts Academy","Yoga / Pilates Studio","Hair Salon / Barbershop","Beauty Spa / Nail Salon","Restaurant / Café","Personal Training","Physio / Allied Health","Dental Practice","Real Estate Agency","Trades / Home Services","Retail Store","Other"];
const TONES = [
  { value:"Energetic and motivating — like a great coach, punchy and real", label:"🔥 Energetic & Motivating" },
  { value:"Warm and welcoming — like a trusted local friend", label:"☀️ Warm & Welcoming" },
  { value:"Professional and confident — credible expert, clear", label:"💼 Professional & Confident" },
  { value:"Casual and fun — relaxed, zero jargon, approachable", label:"😄 Casual & Fun" },
  { value:"Luxury and refined — premium, elevated, exclusive", label:"✨ Luxury & Refined" },
  { value:"Bold and direct — no fluff, straight talk, powerful", label:"⚡ Bold & Direct" },
];
const EMPTY = { name:"", type:BIZ_TYPES[0], location:"", description:"", offerings:"", pricing:"", hours:"", contact:"", extra:"", tone:TONES[0].value, color:"#2952e3" };

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [biz, setBiz] = useState(EMPTY);
  const set = k => v => setBiz(b=>({...b,[k]:v}));

  const steps = [
    {
      title:"Let's set up your AI OS",
      sub:"10 minutes. Your AI learns everything about your business and runs it from day one.",
      valid: biz.name && biz.location && biz.contact,
      fields:(
        <div>
          <Field label="Business Name"><Input value={biz.name} onChange={set("name")} placeholder="e.g. Rage Fight Academy" /></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Business Type"><Select value={biz.type} onChange={set("type")} options={BIZ_TYPES} /></Field>
            <Field label="Location"><Input value={biz.location} onChange={set("location")} placeholder="e.g. Pattaya, Thailand" /></Field>
          </div>
          <Field label="Contact / Website"><Input value={biz.contact} onChange={set("contact")} placeholder="e.g. +66 097 331 6365 | yoursite.com" /></Field>
        </div>
      ),
    },
    {
      title:"What do you offer?",
      sub:"Your bot will know all of this automatically — answer every customer question perfectly.",
      valid: biz.description && biz.offerings && biz.pricing,
      fields:(
        <div>
          <Field label="Describe your business (2-3 sentences)">
            <Textarea value={biz.description} onChange={set("description")} placeholder="e.g. World-class combat sports gym in Pattaya. Muay Thai, MMA, BJJ and Boxing. International training camp with on-site accommodation and café." rows={3} />
          </Field>
          <Field label="Key services / products">
            <Textarea value={biz.offerings} onChange={set("offerings")} placeholder="e.g. Muay Thai, MMA, BJJ, Boxing, Fitness. Day passes, weekly, monthly memberships. 2-week & 1-month camp packages. Body transformation program." rows={2} />
          </Field>
          <Field label="Pricing (key packages)">
            <Textarea value={biz.pricing} onChange={set("pricing")} placeholder="e.g. Day pass: $15 | Week: $60 | Month: $180 | 2-week camp: $500" rows={2} />
          </Field>
        </div>
      ),
    },
    {
      title:"Hours & extra details",
      sub:"The more context your AI has, the better it performs.",
      valid: biz.hours,
      fields:(
        <div>
          <Field label="Opening hours"><Input value={biz.hours} onChange={set("hours")} placeholder="e.g. Mon-Sat 6am-8pm, Sun 8am-2pm" /></Field>
          <Field label="Extra info — certifications, key staff, unique features (optional)">
            <Textarea value={biz.extra} onChange={set("extra")} placeholder="e.g. Head coach has 32 international titles. We host monthly fight events. On-site pool and sauna." rows={3} />
          </Field>
        </div>
      ),
    },
    {
      title:"Your brand voice",
      sub:"This trains your AI to write and speak exactly like you.",
      valid: biz.tone,
      fields:(
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {TONES.map(t=>(
            <div key={t.value} onClick={()=>set("tone")(t.value)} style={{ padding:"12px 16px", border:`2px solid ${biz.tone===t.value?biz.color:T.border}`, background:biz.tone===t.value?biz.color+"18":T.surface, cursor:"pointer", borderRadius:2, display:"flex", alignItems:"center", gap:12, transition:"all 0.15s" }}>
              <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${biz.tone===t.value?biz.color:T.border2}`, background:biz.tone===t.value?biz.color:"transparent", flexShrink:0 }} />
              <span style={{ fontSize:"0.88rem", fontWeight:biz.tone===t.value?600:400, color:biz.tone===t.value?biz.color:T.dim }}>{t.label}</span>
            </div>
          ))}
          <div style={{ marginTop:10 }}>
            <Field label="Brand colour">
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <input type="color" value={biz.color} onChange={e=>set("color")(e.target.value)} style={{ width:44, height:38, border:`1.5px solid ${T.border2}`, borderRadius:2, cursor:"pointer", padding:2, background:T.bg }} />
                <Input value={biz.color} onChange={set("color")} placeholder="#2952e3" />
              </div>
            </Field>
          </div>
        </div>
      ),
    },
  ];

  const cur = steps[step];
  const pct = Math.round(((step+1)/steps.length)*100);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:560 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontFamily:"serif", fontSize:"1.1rem", fontWeight:700, letterSpacing:"0.22em", color:T.ink, textTransform:"uppercase" }}>SMB · AI · OS</div>
          <div style={{ fontSize:"0.62rem", letterSpacing:"0.18em", color:T.muted, textTransform:"uppercase", marginTop:4 }}>Universal Business Intelligence</div>
        </div>

        <Card>
          <div style={{ padding:"20px 24px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em", color:T.muted, textTransform:"uppercase" }}>Step {step+1} of {steps.length}</span>
              <span style={{ fontSize:"0.62rem", color:T.muted }}>{pct}%</span>
            </div>
            <div style={{ height:3, background:T.border, borderRadius:2, marginBottom:22 }}>
              <div style={{ height:"100%", width:`${pct}%`, background:biz.color, borderRadius:2, transition:"width 0.4s" }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:"serif", fontSize:"1.5rem", fontWeight:700, color:T.ink, marginBottom:6, lineHeight:1.2 }}>{cur.title}</div>
              <div style={{ fontSize:"0.85rem", color:T.dim, lineHeight:1.6 }}>{cur.sub}</div>
            </div>
            {cur.fields}
            <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:24, gap:10 }}>
              {step>0 ? <Btn onClick={()=>setStep(s=>s-1)} bg={T.panel} color={T.dim}>← Back</Btn> : <span/>}
              <Btn onClick={()=>step===steps.length-1?onDone(biz):setStep(s=>s+1)} bg={biz.color} disabled={!cur.valid}>
                {step===steps.length-1?"Launch My AI OS →":"Continue →"}
              </Btn>
            </div>
          </div>
        </Card>

        <div style={{ textAlign:"center", marginTop:14, fontSize:"0.68rem", color:T.muted }}>
          Powered by Claude AI · Your data stays in your browser · No account needed
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BOT MODULE
// ═══════════════════════════════════════════════════════════════════
function BotModule({ biz }) {
  const [msgs, setMsgs] = useState([{ role:"assistant", text:`Hi! Welcome to ${biz.name}. I'm here to help — what can I do for you? 😊` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  async function send() {
    const text=input.trim(); if(!text||loading) return;
    setInput("");
    const next=[...msgs,{role:"user",text}];
    setMsgs(next); setLoading(true);
    try {
      const reply = await claude(next.map(m=>({role:m.role,content:m.text})), buildBotPrompt(biz));
      setMsgs(p=>[...p,{role:"assistant",text:reply}]);
    } catch { setMsgs(p=>[...p,{role:"assistant",text:"Sorry — connection issue. Please call us directly!"}]); }
    setLoading(false);
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 290px", gap:12 }}>
      <Card>
        <div style={{ background:biz.color, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, background:"rgba(255,255,255,0.2)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9rem" }}>🤖</div>
            <div>
              <div style={{ fontSize:"0.82rem", fontWeight:700, color:"white" }}>{biz.name}</div>
              <div style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.75)" }}>● AI Assistant · Claude Powered · Always on</div>
            </div>
          </div>
          <Btn onClick={()=>setMsgs([{role:"assistant",text:`Hi! Welcome to ${biz.name}. How can I help? 😊`}])} bg="rgba(255,255,255,0.15)" sm>Reset</Btn>
        </div>

        <div style={{ height:360, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:8 }}>
          {msgs.map((m,i)=>(
            <div key={i} style={{ maxWidth:"80%", alignSelf:m.role==="assistant"?"flex-start":"flex-end" }}>
              <div style={{ padding:"9px 13px", fontSize:"0.82rem", lineHeight:1.55, borderRadius:2, background:m.role==="assistant"?T.panel:biz.color, color:m.role==="assistant"?T.dim:"white", border:m.role==="assistant"?`1px solid ${T.border}`:"none" }}>{m.text}</div>
            </div>
          ))}
          {loading&&<div style={{ alignSelf:"flex-start", maxWidth:"80%" }}><div style={{ padding:"9px 13px", background:T.panel, border:`1px solid ${T.border}`, borderRadius:2, fontSize:"0.82rem", color:T.muted, display:"flex", gap:4, alignItems:"center" }}><Spinner/> Thinking...</div></div>}
          <div ref={endRef}/>
        </div>

        <div style={{ display:"flex", borderTop:`1px solid ${T.border}` }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={`Ask ${biz.name} anything...`} style={{ flex:1, padding:"11px 14px", fontFamily:"inherit", fontSize:"0.85rem", border:"none", outline:"none", background:T.surface, color:T.ink }} />
          <button onClick={send} disabled={loading} style={{ background:biz.color, border:"none", color:"white", padding:"11px 18px", fontWeight:700, fontSize:"0.72rem", letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, opacity:loading?0.7:1 }}>
            {loading?<Spinner light/>:"Send"}
          </button>
        </div>
      </Card>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <Card>
          <CardHeader title="Today's Stats" />
          <div style={{ padding:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[{v:12,l:"Enquiries",c:biz.color},{v:9,l:"Captured",c:T.green},{v:4,l:"Booked",c:T.gold},{v:"75%",l:"Rate",c:T.accent}].map((s,i)=>(
              <div key={i} style={{ textAlign:"center", padding:"12px 6px", background:T.panel, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:"1.4rem", fontWeight:800, color:s.c, letterSpacing:"-0.02em" }}>{s.v}</div>
                <div style={{ fontSize:"0.56rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:T.muted, marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Embed Code" />
          <div style={{ padding:14 }}>
            <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderLeft:`3px solid ${biz.color}`, padding:"10px 12px", fontSize:"0.68rem", fontFamily:"monospace", color:biz.color, marginBottom:10, wordBreak:"break-all" }}>
              {`<script src="smbai.js" data-biz="${biz.name.replace(/\s+/g,"-").toLowerCase()}"></script>`}
            </div>
            <Btn onClick={()=>navigator.clipboard.writeText(`<script src="smbai.js" data-biz="${biz.name.replace(/\s+/g,"-").toLowerCase()}"></script>`)} bg={biz.color} full>Copy Embed Code</Btn>
            <div style={{ fontSize:"0.7rem", color:T.muted, marginTop:10, lineHeight:1.6 }}>Paste into your website HTML. Bot goes live instantly on any page.</div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Top Questions" />
          <div style={{ padding:"8px 16px" }}>
            {["Pricing & packages","Opening hours","How to book","Beginner-friendly?","Parking / location"].map((q,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:i<4?`1px solid ${T.border}`:"none", fontSize:"0.75rem", color:T.dim }}>
                <span>{q}</span><span style={{ color:T.muted, fontWeight:600 }}>×{5-i}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CONTENT ENGINE
// ═══════════════════════════════════════════════════════════════════
const POST_TYPES = ["Training Motivation","Service Promo","Customer Spotlight","Behind the Scenes","Educational Tip","Special Offer","Event Announcement","Team Introduction","Seasonal Content"];
const PLATFORMS = [{id:"instagram",label:"Instagram",icon:"📸"},{id:"facebook",label:"Facebook",icon:"📘"},{id:"tiktok",label:"TikTok",icon:"🎵"},{id:"linkedin",label:"LinkedIn",icon:"💼"}];

function ContentModule({ biz }) {
  const [postType, setPostType] = useState(POST_TYPES[0]);
  const [platform, setPlatform] = useState("instagram");
  const [extra, setExtra] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const prompt = `Write a "${postType}" post for ${platform}. ${extra?`Extra context: ${extra}`:""}`;
      const reply = await claude([{role:"user",content:prompt}], buildContentPrompt(biz), 500);
      setPosts(p=>[{type:postType,platform,content:reply,id:Date.now()},...p.slice(0,4)]);
    } catch { setPosts(p=>[{type:postType,platform,content:"Error — check connection.",id:Date.now()},...p.slice(0,4)]); }
    setLoading(false);
  }

  const calendar = Array.from({length:28},(_,i)=>({day:i+1,type:["Training","","Promo","","Spotlight","",""][i%7]||null,done:i<3}));

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 270px", gap:12 }}>
      <div>
        <Card style={{ marginBottom:12 }}>
          <CardHeader title="⚡ AI Post Generator" />
          <div style={{ padding:18 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <Field label="Post Type"><Select value={postType} onChange={setPostType} options={POST_TYPES} /></Field>
              <Field label="Platform">
                <div style={{ display:"flex", gap:6 }}>
                  {PLATFORMS.map(p=>(
                    <div key={p.id} onClick={()=>setPlatform(p.id)} title={p.label} style={{ flex:1, padding:"9px 4px", textAlign:"center", border:`2px solid ${platform===p.id?biz.color:T.border}`, background:platform===p.id?biz.color+"22":T.bg, cursor:"pointer", borderRadius:2, fontSize:"1rem", transition:"all 0.15s" }}>{p.icon}</div>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Extra context (optional)"><Input value={extra} onChange={setExtra} placeholder="e.g. Mention our spring promo, 20% off first month" /></Field>
            <Btn onClick={generate} disabled={loading} bg={biz.color} full>
              {loading?<><Spinner light/>Generating...</>:"Generate Post →"}
            </Btn>
          </div>
        </Card>

        {posts.map(post=>(
          <Card key={post.id} style={{ marginBottom:12 }}>
            <div style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ fontSize:"0.58rem", fontWeight:700, padding:"3px 8px", background:biz.color+"22", color:biz.color, borderRadius:2, textTransform:"uppercase", letterSpacing:"0.06em" }}>{post.type}</span>
                <span style={{ fontSize:"0.58rem", fontWeight:700, padding:"3px 8px", background:T.panel, color:T.muted, borderRadius:2, textTransform:"uppercase", letterSpacing:"0.06em" }}>{PLATFORMS.find(p=>p.id===post.platform)?.icon} {post.platform}</span>
              </div>
              <Btn onClick={()=>navigator.clipboard.writeText(post.content)} bg={T.green} sm>Copy</Btn>
            </div>
            <div style={{ padding:18, fontSize:"0.9rem", lineHeight:1.8, color:T.dim, whiteSpace:"pre-wrap", fontFamily:"Georgia, serif", borderLeft:`3px solid ${biz.color}` }}>{post.content}</div>
          </Card>
        ))}

        {posts.length===0&&(
          <div style={{ textAlign:"center", padding:"48px 20px", color:T.muted }}>
            <div style={{ fontSize:"2rem", marginBottom:10 }}>✍️</div>
            <div style={{ fontSize:"0.85rem" }}>Choose a post type and hit Generate.<br/>Your AI writes in {biz.name}'s voice.</div>
          </div>
        )}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <Card>
          <CardHeader title="📅 This Month" />
          <div style={{ padding:"12px 14px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:10 }}>
              {"MTWTFSS".split("").map((d,i)=><div key={i} style={{ textAlign:"center", fontSize:"0.55rem", fontWeight:700, color:T.muted, padding:"3px 0" }}>{d}</div>)}
              {calendar.map(day=>(
                <div key={day.day} title={day.type||"Empty"} style={{ aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.55rem", fontWeight:700, background:day.done?T.greenL:day.type?biz.color+"22":T.panel, border:`1px solid ${day.done?T.green+"55":day.type?biz.color+"55":T.border}`, color:day.done?T.green:day.type?biz.color:T.muted, cursor:"default" }}>{day.day}</div>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {[{c:T.greenL,bc:T.green,l:"Posted"},{c:biz.color+"22",bc:biz.color,l:"Scheduled"},{c:T.panel,bc:T.border,l:"Empty"}].map((s,i)=>(
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center", fontSize:"0.68rem", color:T.muted }}>
                  <div style={{ width:10, height:10, background:s.c, border:`1px solid ${s.bc}`, borderRadius:1 }}/>
                  {s.l}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Stats" />
          <div style={{ padding:14 }}>
            {[{l:"Posts published",v:3,c:T.green},{l:"Scheduled",v:8,c:biz.color},{l:"Empty days",v:17,c:T.muted}].map((s,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:i<2?`1px solid ${T.border}`:"none" }}>
                <span style={{ fontSize:"0.78rem", color:T.dim }}>{s.l}</span>
                <span style={{ fontSize:"0.85rem", fontWeight:700, color:s.c }}>{s.v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEAD CRM
// ═══════════════════════════════════════════════════════════════════
const LEAD_SOURCES = ["Website Bot","Walk-in","Facebook","Instagram","WhatsApp","Referral","Phone","Email","TikTok"];
const LEAD_TAGS = ["new","hot","trial","qualified","cold","member"];
const COLORS = ["#2952e3","#c8150a","#1a7a45","#b8760a","#6d28d9","#c45c0a"];

function LeadCRM({ biz }) {
  const [leads, setLeads] = useState([]);
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(()=>{ sGet("smb:leads").then(d=>{if(d)setLeads(d);}); },[]);
  useEffect(()=>{ if(leads.length>0)sSet("smb:leads",leads); },[leads]);

  function addLead(form) {
    const initials = form.name.split(" ").map(n=>n[0]).join("").toUpperCase().substring(0,2);
    setLeads(p=>[{...form,id:Date.now(),avatar:initials,color:COLORS[p.length%COLORS.length],time:"Just now",createdAt:Date.now()},...p]);
  }
  function updateTag(id,tag) {
    setLeads(p=>p.map(l=>l.id===id?{...l,tag}:l));
    if(sel?.id===id) setSel(s=>({...s,tag}));
  }

  async function draftReply(lead) {
    setDraftLoading(true); setDraft("");
    try {
      const reply = await claude([{role:"user",content:`Draft follow-up for:\nName: ${lead.name}\nInterested in: ${lead.interest||"general"}\nSource: ${lead.source}\nNote: ${lead.note||"none"}\nStatus: ${lead.tag}`}], buildLeadPrompt(biz), 300);
      setDraft(reply);
    } catch { setDraft("Error — check connection."); }
    setDraftLoading(false);
  }

  const filtered = leads.filter(l=>{
    const mf = filter==="all"||l.tag===filter;
    const ms = !search||l.name.toLowerCase().includes(search.toLowerCase())||(l.interest||"").toLowerCase().includes(search.toLowerCase());
    return mf&&ms;
  });

  return (
    <div style={{ display:"grid", gridTemplateColumns:sel?"1fr 360px":"1fr", gap:12 }}>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {["all",...LEAD_TAGS.slice(0,4)].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{ padding:"6px 12px", fontFamily:"inherit", fontSize:"0.72rem", fontWeight:600, border:`1.5px solid ${filter===f?biz.color:T.border}`, background:filter===f?biz.color+"22":T.surface, color:filter===f?biz.color:T.muted, cursor:"pointer", borderRadius:2, textTransform:"capitalize" }}>
                {f==="all"?`All (${leads.length})`:f}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...inputStyle,width:160,padding:"8px 12px",fontSize:"0.8rem"}} />
            <Btn onClick={()=>setShowAdd(true)} bg={biz.color}>+ Add Lead</Btn>
          </div>
        </div>

        <Card>
          {filtered.length===0?(
            <div style={{ padding:"48px 20px", textAlign:"center", color:T.muted }}>
              <div style={{ fontSize:"2rem", marginBottom:10 }}>👥</div>
              <div style={{ fontSize:"0.85rem" }}>{leads.length===0?"No leads yet. Add your first or connect your bot.":"No leads match this filter."}</div>
            </div>
          ):(
            <div style={{ padding:"0 18px" }}>
              {filtered.map((lead,i)=>(
                <div key={lead.id} onClick={()=>{setSel(lead);setDraft("");}} style={{ display:"grid", gridTemplateColumns:"34px 1fr auto", gap:12, padding:"12px 0", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", alignItems:"center", cursor:"pointer", paddingLeft:sel?.id===lead.id?13:0, borderLeft:sel?.id===lead.id?`3px solid ${biz.color}`:"3px solid transparent", marginLeft:-18, paddingLeft:sel?.id===lead.id?15:18 }}>
                  <div style={{ width:33, height:33, borderRadius:"50%", background:lead.color+"22", color:lead.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"0.72rem" }}>{lead.avatar}</div>
                  <div>
                    <div style={{ fontSize:"0.88rem", fontWeight:600, color:T.ink, marginBottom:2 }}>{lead.name}</div>
                    <div style={{ fontSize:"0.7rem", color:T.muted }}>{lead.interest||"General"} · {lead.source} · {lead.time}</div>
                  </div>
                  <Tag type={lead.tag} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {sel&&(
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Card>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontWeight:700, fontSize:"0.95rem" }}>{sel.name}</div>
              <button onClick={()=>{setSel(null);setDraft("");}} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:"1.1rem" }}>✕</button>
            </div>
            <div style={{ padding:18 }}>
              <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                <Tag type={sel.tag}/>
                <span style={{ fontSize:"0.58rem", fontWeight:700, padding:"3px 8px", background:T.panel, color:T.muted, borderRadius:2, textTransform:"uppercase", letterSpacing:"0.06em" }}>{sel.source}</span>
              </div>
              {[{l:"Interested in",v:sel.interest||"General"},{l:"Note",v:sel.note}].filter(f=>f.v).map((f,i)=>(
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:T.muted, marginBottom:4 }}>{f.l}</div>
                  <div style={{ fontSize:"0.85rem", color:T.dim }}>{f.v}</div>
                </div>
              ))}
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:T.muted, marginBottom:8 }}>Update Status</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {LEAD_TAGS.map(t=>(
                    <button key={t} onClick={()=>updateTag(sel.id,t)} style={{ padding:"4px 10px", fontFamily:"inherit", fontSize:"0.65rem", fontWeight:600, border:`1.5px solid ${sel.tag===t?biz.color:T.border}`, background:sel.tag===t?biz.color+"22":T.bg, color:sel.tag===t?biz.color:T.muted, cursor:"pointer", borderRadius:2, textTransform:"capitalize" }}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="⚡ AI Response Drafter" />
            <div style={{ padding:18 }}>
              <div style={{ fontSize:"0.78rem", color:T.dim, marginBottom:12, lineHeight:1.6 }}>Claude writes a personalised reply in {biz.name}'s voice — copy and send via WhatsApp, email, or SMS.</div>
              <Btn onClick={()=>draftReply(sel)} disabled={draftLoading} bg={biz.color} full style={{ marginBottom:12 }}>
                {draftLoading?<><Spinner light/>Drafting...</>:"Draft Response →"}
              </Btn>
              {draft&&(
                <div>
                  <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderLeft:`3px solid ${biz.color}`, padding:14, fontSize:"0.88rem", lineHeight:1.75, color:T.dim, whiteSpace:"pre-wrap", fontFamily:"Georgia, serif", marginBottom:10, borderRadius:2 }}>{draft}</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn onClick={()=>{navigator.clipboard.writeText(draft);setCopied(true);setTimeout(()=>setCopied(false),2000);}} bg={T.green} style={{ flex:1 }}>{copied?"✓ Copied!":"Copy"}</Btn>
                    <Btn onClick={()=>draftReply(sel)} bg={T.panel} color={T.dim} style={{ flex:1 }}>Regenerate</Btn>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {showAdd&&<LeadModal biz={biz} onSave={addLead} onClose={()=>setShowAdd(false)}/>}
    </div>
  );
}

function LeadModal({ biz, onSave, onClose }) {
  const [form, setForm] = useState({name:"",interest:"",source:LEAD_SOURCES[0],tag:"new",note:""});
  const set = k=>v=>setForm(f=>({...f,[k]:v}));
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <Card style={{ maxWidth:420,width:"100%" }}>
        <div style={{ padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between" }}>
          <div style={{ fontWeight:700 }}>Add Lead</div>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:"1.1rem" }}>✕</button>
        </div>
        <div style={{ padding:20 }}>
          <Field label="Name"><Input value={form.name} onChange={set("name")} placeholder="Full name" /></Field>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <Field label="Interested In"><Input value={form.interest} onChange={set("interest")} placeholder="e.g. Muay Thai" /></Field>
            <Field label="Source"><Select value={form.source} onChange={set("source")} options={LEAD_SOURCES} /></Field>
          </div>
          <Field label="Status"><Select value={form.tag} onChange={set("tag")} options={LEAD_TAGS} /></Field>
          <Field label="Note (optional)"><Input value={form.note} onChange={set("note")} placeholder="Any useful context..." /></Field>
        </div>
        <div style={{ padding:"14px 20px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end",gap:8 }}>
          <Btn onClick={onClose} bg={T.panel} color={T.dim}>Cancel</Btn>
          <Btn onClick={()=>{if(form.name.trim()){onSave(form);onClose();}}} bg={biz.color} disabled={!form.name.trim()}>Save Lead</Btn>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD HOME
// ═══════════════════════════════════════════════════════════════════
function Dashboard({ biz, leads, checklist, setChecklist, setView }) {
  const done = checklist.filter(c=>c.done).length;
  const hot = leads.filter(l=>l.tag==="hot"||l.tag==="new");
  const dateStr = new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:"1.6rem", fontWeight:800, fontFamily:"serif", marginBottom:4 }}>Good morning, {biz.name} 👋</div>
        <div style={{ fontSize:"0.8rem", color:T.muted }}>{biz.location} · {dateStr}</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          {l:"Hot Leads",v:hot.length,t:"needs attention",c:biz.color},
          {l:"Bot Active",v:"24/7",t:"answering enquiries",c:T.green},
          {l:"Tasks Done",v:`${done}/${checklist.length}`,t:"today",c:T.accent},
          {l:"Content Posts",v:3,t:"this week",c:T.gold},
        ].map((k,i)=>(
          <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, padding:18, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, marginBottom:8 }}>{k.l}</div>
            <div style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-0.02em", color:k.c, lineHeight:1, marginBottom:6 }}>{k.v}</div>
            <div style={{ fontSize:"0.68rem", color:T.muted }}>{k.t}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 310px", gap:12 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Card>
            <CardHeader title="🔥 Hot Leads" right={<span onClick={()=>setView("leads")} style={{ fontSize:"0.7rem",color:biz.color,cursor:"pointer",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>All Leads →</span>} />
            <div style={{ padding:"0 18px" }}>
              {hot.length===0?(
                <div style={{ padding:"24px 0", textAlign:"center", color:T.muted, fontSize:"0.82rem" }}>No hot leads yet — your bot captures them automatically</div>
              ):hot.slice(0,5).map((l,i,a)=>(
                <div key={l.id} style={{ display:"grid", gridTemplateColumns:"34px 1fr auto", gap:12, padding:"11px 0", borderBottom:i<a.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:l.color+"22", color:l.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"0.72rem" }}>{l.avatar}</div>
                  <div>
                    <div style={{ fontSize:"0.85rem", fontWeight:600 }}>{l.name}</div>
                    <div style={{ fontSize:"0.7rem", color:T.muted }}>{l.interest||"General"} · {l.source}</div>
                  </div>
                  <Tag type={l.tag}/>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="🤖 AI Systems" right={<span onClick={()=>setView("bot")} style={{ fontSize:"0.7rem",color:biz.color,cursor:"pointer",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>Open Bot →</span>} />
            <div style={{ padding:"8px 18px" }}>
              {[
                {n:"Enquiry Bot",d:"Website · WhatsApp · Facebook",on:true,s:"Active"},
                {n:"Content Engine",d:"IG · FB · TikTok · LinkedIn",on:true,s:"Ready"},
                {n:"Lead Response AI",d:"1-click draft enabled",on:true,s:"Ready"},
                {n:"Follow-Up Pipeline",d:"7-day trial sequence",on:false,s:"Setup needed"},
              ].map((s,i,a)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:i<a.length-1?`1px solid ${T.border}`:"none" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <Dot on={s.on}/>
                    <div>
                      <div style={{ fontSize:"0.82rem", fontWeight:600 }}>{s.n}</div>
                      <div style={{ fontSize:"0.65rem", color:T.muted }}>{s.d}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:"0.7rem", fontWeight:600, color:s.on?T.green:T.muted }}>{s.s}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Card>
            <CardHeader title="✅ Today's Tasks" right={<span style={{ fontSize:"0.68rem",color:T.muted }}>{done}/{checklist.length}</span>} />
            <div style={{ padding:"8px 14px" }}>
              {checklist.map((c,i)=>(
                <div key={c.id} onClick={()=>setChecklist(p=>p.map(t=>t.id===c.id?{...t,done:!t.done}:t))} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<checklist.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", opacity:c.done?0.45:1 }}>
                  <div style={{ width:17, height:17, border:`2px solid ${c.done?T.green:T.border2}`, background:c.done?T.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.65rem", color:"white", flexShrink:0, borderRadius:2 }}>{c.done?"✓":""}</div>
                  <span style={{ fontSize:"0.78rem", flex:1, textDecoration:c.done?"line-through":"none", color:c.done?T.muted:T.ink }}>{c.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="📋 Business" right={<span onClick={()=>setView("settings")} style={{ fontSize:"0.7rem",color:biz.color,cursor:"pointer",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>Edit →</span>} />
            <div style={{ padding:16 }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ width:40, height:40, background:biz.color, borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:"0.85rem", flexShrink:0 }}>
                  {biz.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:"0.9rem", marginBottom:2 }}>{biz.name}</div>
                  <div style={{ fontSize:"0.7rem", color:T.muted }}>{biz.type}</div>
                  <div style={{ fontSize:"0.7rem", color:T.muted }}>{biz.location}</div>
                </div>
              </div>
              <div style={{ fontSize:"0.75rem", color:T.dim, lineHeight:1.7 }}>
                <strong style={{ color:T.ink }}>Hours:</strong> {biz.hours}<br/>
                <strong style={{ color:T.ink }}>Contact:</strong> {biz.contact}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="📈 30-Day Proof" />
            <div style={{ padding:16 }}>
              <div style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:"0.68rem", fontWeight:700, color:T.muted }}>Day 1 of 30</span>
                  <span style={{ fontSize:"0.68rem", color:biz.color, fontWeight:700 }}>3%</span>
                </div>
                <div style={{ height:6, background:T.border, borderRadius:3 }}>
                  <div style={{ height:"100%", width:"3%", background:biz.color, borderRadius:3 }} />
                </div>
              </div>
              <div style={{ fontSize:"0.72rem", color:T.dim, lineHeight:1.65 }}>Every metric you improve becomes a case study that sells the next client automatically.</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════
function Settings({ biz, onUpdate, onReset }) {
  const [form, setForm] = useState({...biz});
  const [saved, setSaved] = useState(false);
  const set = k=>v=>setForm(f=>({...f,[k]:v}));

  function save() { onUpdate(form); setSaved(true); setTimeout(()=>setSaved(false),2000); }

  return (
    <div style={{ maxWidth:640 }}>
      <Card>
        <CardHeader title="Business Profile" />
        <div style={{ padding:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Business Name"><Input value={form.name} onChange={set("name")} /></Field>
            <Field label="Business Type"><Select value={form.type} onChange={set("type")} options={BIZ_TYPES} /></Field>
            <Field label="Location"><Input value={form.location} onChange={set("location")} /></Field>
            <Field label="Contact / Website"><Input value={form.contact} onChange={set("contact")} /></Field>
          </div>
          <Field label="Description"><Textarea value={form.description} onChange={set("description")} rows={3} /></Field>
          <Field label="Offerings"><Textarea value={form.offerings} onChange={set("offerings")} rows={2} /></Field>
          <Field label="Pricing"><Textarea value={form.pricing} onChange={set("pricing")} rows={2} /></Field>
          <Field label="Hours"><Input value={form.hours} onChange={set("hours")} /></Field>
          <Field label="Extra Info"><Textarea value={form.extra} onChange={set("extra")} rows={2} /></Field>
          <Field label="Brand Voice"><Select value={form.tone} onChange={set("tone")} options={TONES} /></Field>
          <Field label="Brand Colour">
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <input type="color" value={form.color||"#2952e3"} onChange={e=>set("color")(e.target.value)} style={{ width:44, height:38, border:`1.5px solid ${T.border2}`, borderRadius:2, cursor:"pointer", padding:2 }} />
              <Input value={form.color} onChange={set("color")} />
            </div>
          </Field>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:16, gap:10 }}>
            <Btn onClick={onReset} bg={T.redL} color={T.red}>Reset & Re-onboard</Btn>
            <Btn onClick={save} bg={form.color||T.accent}>{saved?"✓ Saved!":"Save Changes"}</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════
const DEFAULT_TASKS = [
  {id:1,label:"Review overnight bot enquiries",done:false},
  {id:2,label:"Follow up with hot leads",done:false},
  {id:3,label:"Post today's content",done:false},
  {id:4,label:"Check follow-up pipeline",done:false},
  {id:5,label:"Update proof tracker",done:false},
];

export default function App() {
  const [biz, setBiz] = useState(null);
  const [view, setView] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [checklist, setChecklist] = useState(DEFAULT_TASKS);
  const [ready, setReady] = useState(false);

  useEffect(()=>{
    async function init() {
      const [sb,sl,sc] = await Promise.all([sGet("smb:biz"),sGet("smb:leads"),sGet("smb:checklist")]);
      if(sb)setBiz(sb);
      if(sl)setLeads(sl);
      if(sc)setChecklist(sc);
      setReady(true);
    }
    init();
  },[]);

  useEffect(()=>{ if(biz)sSet("smb:biz",biz); },[biz]);
  useEffect(()=>{ sSet("smb:checklist",checklist); },[checklist]);

  if(!ready) return (
    <div style={{ minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"serif",fontSize:"1.1rem",letterSpacing:"0.22em",textTransform:"uppercase",marginBottom:8 }}>SMB · AI · OS</div>
        <Spinner/>
      </div>
    </div>
  );

  if(!biz) return <Onboarding onDone={b=>{setBiz(b);sSet("smb:biz",b);}}/>;

  const hotCount = leads.filter(l=>l.tag==="hot"||l.tag==="new").length;
  const NAV = [
    {id:"dashboard",icon:"◈",label:"Dashboard"},
    {id:"bot",icon:"🤖",label:"Bot",live:true},
    {id:"content",icon:"✍️",label:"Content"},
    {id:"leads",icon:"🎯",label:"Leads",badge:hotCount||null},
    {id:"settings",icon:"⚙",label:"Settings"},
  ];

  return (
    <div style={{ fontFamily:"'DM Sans','Helvetica Neue',sans-serif",background:T.bg,minHeight:"100vh",fontSize:15 }}>
      <nav style={{ background:biz.color,height:50,display:"flex",alignItems:"center",padding:"0 20px",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:`0 2px 12px ${biz.color}55` }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ fontFamily:"serif",fontWeight:700,fontSize:"1rem",letterSpacing:"0.14em",color:"white",textTransform:"uppercase" }}>{biz.name}</span>
          <div style={{ width:1,height:16,background:"rgba(255,255,255,0.3)" }}/>
          <span style={{ fontSize:"0.6rem",fontWeight:600,letterSpacing:"0.15em",color:"rgba(255,255,255,0.65)",textTransform:"uppercase" }}>AI OS</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:4 }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setView(n.id)} style={{ position:"relative",padding:"6px 12px",fontFamily:"inherit",fontSize:"0.72rem",fontWeight:view===n.id?700:500,background:view===n.id?"rgba(255,255,255,0.2)":"transparent",border:"none",color:"white",cursor:"pointer",borderRadius:2,display:"flex",alignItems:"center",gap:5 }}>
              <span>{n.icon}</span>
              <span>{n.label}</span>
              {n.badge>0&&<span style={{ background:"white",color:biz.color,fontSize:"0.55rem",fontWeight:800,padding:"1px 5px",borderRadius:8 }}>{n.badge}</span>}
              {n.live&&<div style={{ position:"absolute",top:7,right:9,width:6,height:6,background:"#4ade80",borderRadius:"50%",boxShadow:"0 0 5px #4ade80" }}/>}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ padding:20,maxWidth:1200,margin:"0 auto" }}>
        {view==="dashboard"&&<Dashboard biz={biz} leads={leads} checklist={checklist} setChecklist={setChecklist} setView={setView}/>}
        {view==="bot"&&<BotModule biz={biz}/>}
        {view==="content"&&<ContentModule biz={biz}/>}
        {view==="leads"&&<LeadCRM biz={biz}/>}
        {view==="settings"&&<Settings biz={biz} onUpdate={b=>{setBiz(b);sSet("smb:biz",b);}} onReset={async()=>{await sDel("smb:biz");setBiz(null);setView("dashboard");}}/>}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg);}}
        input:focus,textarea:focus,select:focus{border-color:${biz.color}!important;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:${T.border2};border-radius:3px;}
      `}</style>
    </div>
  );
}
