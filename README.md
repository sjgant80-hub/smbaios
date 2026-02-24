# SMB AI OS — White-Label AI Operations Platform

**The AI operations layer for any small business. Real Claude API. 10-minute setup. Any vertical.**

Built by Simon Gant / Sodor Group · Powered by Konomi ◊

---

## What It Does

One dashboard that replaces the 5 apps every SMB owner has open at once:

| Feature | What it does |
|---|---|
| 🤖 **AI Enquiry Bot** | Real Claude API. Knows your pricing, schedule, staff, voice. Handles leads 24/7. |
| ⚡ **Content Engine** | 9 post types × 6 platforms. AI writes in your business's actual voice. |
| 🎯 **Lead CRM** | Full pipeline. Click any lead → Claude drafts a personalised reply in seconds. |
| 📊 **Dashboard** | KPIs, hot leads, task checklist, at-risk members, pipeline, proof tracker. |
| 💳 **Billing** | Stripe integration hooks. 3 plans. 30-day free proof period built in. |
| ⚙️ **Settings** | Change anything — AI reconfigures instantly. |

---

## How to Run It

### Option A — Claude.ai Artifact (Fastest, zero setup)

1. Open [claude.ai](https://claude.ai)
2. Start a new conversation
3. Open the `smb_ai_os.jsx` file
4. Copy the **entire contents**
5. Paste into Claude with this message:

```
Run this as a React artifact:

[paste code here]
```

6. Claude renders it live in the interface
7. Done — fully functional, Claude API included

> **This is the recommended path for demos and proof-of-concept deployments.**
> The Claude.ai artifact environment handles the API key automatically.

---

### Option B — Local / Hosted Deployment

For a real URL you can share with clients:

**Prerequisites:**
- Node.js 18+
- A domain (optional but recommended)

**Setup:**

```bash
# 1. Create a new React app
npx create-react-app smb-ai-os
cd smb-ai-os

# 2. Replace src/App.js with the contents of smb_ai_os.jsx

# 3. Add the API proxy (required — never expose API key in browser)
# Create: src/api/claude.js
```

**API Proxy (Netlify function):**

Create `netlify/functions/claude.js`:

```javascript
exports.handler = async (event) => {
  const { messages, system, max_tokens } = JSON.parse(event.body);
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: max_tokens || 700,
      system,
      messages
    })
  });
  
  const data = await response.json();
  return { statusCode: 200, body: JSON.stringify(data) };
};
```

Then update the `ai()` function in the JSX to call `/api/claude` instead of the Anthropic API directly.

**Then deploy:**
```bash
# Netlify (free tier works)
npm install -g netlify-cli
netlify deploy --prod

# Or Vercel
npm install -g vercel
vercel --prod
```

**Set environment variable:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

### Option C — White-Label for a Client

1. Complete Option B setup
2. Go to **Settings** in the app
3. Update business name, colour, services, pricing, voice
4. The AI reconfigures automatically — no code changes needed
5. Give client the URL

For full white-label (remove "SMB AI OS" branding):
- Search for `SMB AI OS` in the JSX and replace with your product name
- Update the `◊` footer references if desired

---

## Onboarding a New Business

When a new business opens the app for the first time, they see the 5-step onboarding:

1. **Business Info** — name, type, location, phone, website, tagline
2. **Voice & Brand** — brand colour + voice style (gritty / warm / fun / polished)
3. **Services & Pricing** — all the info the AI needs to answer enquiries
4. **Choose Plan** — Starter $97 / Pro $147 / Camp $197
5. **Done** — AI is fully configured, dashboard loads

> The Michel Method: Open the dashboard in a client meeting, complete onboarding together (10 min), show them the live bot answering questions about their own business. That's the close.

---

## Pricing Model

| Plan | Price | Best For |
|---|---|---|
| Starter | $97/mo | Single-location, basic needs |
| Pro ✦ | $147/mo | Most SMBs — full feature set |
| Camp / Multi | $197/mo | Gyms with accommodation, multi-location |

**Partner model (Michel channel):**
- You charge $500–750 audit fee
- Client pays $147/mo subscription
- Partner keeps 40%, you keep 60%
- Partner network scales revenue without you doing the selling

---

## Connecting Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create products for each plan (Starter, Pro, Camp)
3. Copy the Price IDs
4. Add to the Billing section in the dashboard
5. For webhooks: point to your Netlify/Vercel function URL

For the Claude.ai artifact version, Stripe UI shows but checkout redirects — works fully in Option B/C deployment.

---

## Persistent Storage

The app uses `window.storage` (available in Claude.ai artifacts) to persist:
- Business configuration
- All leads and their status
- Task checklist state
- 30-day proof tracker progress

In a hosted deployment, replace `window.storage` calls with your preferred database (Supabase, Firebase, PlanetScale — all work well).

---

## The 30-Day Proof Protocol

Every deployment starts a 30-day proof tracker:

| Phase | Days | Goal |
|---|---|---|
| 🚀 Launch | 1–7 | Establish baseline metrics |
| 📈 Build | 8–14 | Document every win |
| 💪 Momentum | 15–27 | Case study writing itself |
| 🎯 Close | 28–30 | Generate case study, sell next client |

Hit **+ Day** each day. At Day 28+ the **Case Study** button appears.

---

## Adapting to Any Vertical

The entire AI runs from the business context set in onboarding/settings. To adapt to any vertical, just change:

- `name` — business name
- `type` — business type  
- `services` — what they offer
- `pricing` — their rates
- `voice` — how they talk
- `color` — brand colour

**Zero code changes required.** The AI reconfigures automatically.

Tested verticals: gyms, salons, restaurants, trades, real estate, dental, retail.

---

## Tech Stack

- **React** (functional components, hooks)
- **Claude claude-sonnet-4-20250514** via Anthropic API
- **window.storage** for persistence (Claude.ai artifact environment)
- **No external dependencies** — runs anywhere React runs
- **Single file** — entire app in one JSX file

---

## Files

```
smb_ai_os.jsx          ← The entire application (paste this into Claude)
README.md              ← This file
smb_ai_market_analysis.html  ← Market analysis & competitive landscape
rage_dashboard_v2.jsx  ← Previous version (Rage-specific, for reference)
```

---

## What's Next (Roadmap)

- [ ] Full pipeline automation (7-day trial sequences fire automatically)
- [ ] Case study auto-generator (Day 28 → formatted PDF)
- [ ] Multi-business switcher (agency view)
- [ ] SMS / WhatsApp send directly from lead panel
- [ ] Appointment booking integration
- [ ] Google Reviews responder
- [ ] Fighter Shadow Engine module (combat sports bolt-on)

---

## Built By

Simon Gant / Sodor Group  
Konomi Protocol ◊ · φ·κ=1  
February 2026

---

*The tool is the proof. The proof becomes the case study. The case study sells the next ten. ◊*
