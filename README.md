# CodeValue

> Engineers don't apply for work. They find broken things, fix them, and earn from the value they create — indefinitely.

**Live Demo:** [codevalue-y7i8.vercel.app](https://codevalue-y7i8.vercel.app)

---

## What is CodeValue?

CodeValue is a problem-first talent marketplace that restructures how engineering work is discovered and compensated.

Traditional recruitment assumes someone knows what they need and posts a job. CodeValue flips this — an AI layer continuously scans real codebases and surfaces hidden inefficiencies, automation gaps, performance bottlenecks, and security issues that organisations didn't know existed. Engineers claim these findings, fix them, and earn a recurring revenue share based on verified, measurable impact.

No job postings. No recruiters. No resumes. No hourly rates.

---

## The Problem

**For engineers:** Hiring freezes, oversupply of talent, and shrinking headcount leave skilled engineers idle. There is no way to participate economically using engineering skills without a formal employment contract.

**For organisations:** Small and mid-sized companies are bleeding money through inefficiencies they can't see — because they lack the engineering capacity to look. They don't know what to post on a job board because they don't know what they need.

**Why existing solutions fail:**
- Freelance platforms (Upwork, Fiverr) require the client to already know and articulate their problem
- Bug bounty platforms (HackerOne) are security-only, one-time, and adversarial
- Consulting firms (McKinsey) charge upfront regardless of outcome and are inaccessible to small orgs
- AI code tools (Copilot) surface suggestions but have no economic transaction layer and no human accountability

---

## How It Works

### Organisation Flow
1. Sign up and connect a GitHub repository
2. Accept platform terms — agreeing to compensate engineers based on verified outcomes
3. AI scans the codebase and generates structured findings with estimated impact and earnings
4. When an engineer claims a finding, the org sees a pending acknowledgement
5. Org acknowledges the claim — full details unlock and work begins

### Engineer Flow
1. Sign up as an engineer
2. Browse open findings across all onboarded repositories
3. Claim a finding that matches your skills
4. Fix it — the platform measures before/after impact on an agreed metric
5. Earn recurring monthly revenue for as long as the fix generates value

### The Staged Reveal Mechanism
The org sees only the category and impact estimate before acknowledging a claim. Full implementation details are locked until formal acknowledgement — creating a legal timestamp that prevents idea theft and protects the engineer's discovery.

---

## What Makes This Different

| | CodeValue | Upwork | HackerOne | Consulting |
|---|---|---|---|---|
| Who finds the problem | AI + Engineer | Client | Client | Consultant |
| Compensation model | Recurring royalty | One-time | One-time bounty | Upfront retainer |
| Requires job posting | No | Yes | Yes | No |
| Builds engineer credential | Verified outcomes | Reviews | Reputation | N/A |
| Accessible to small orgs | Yes | Yes | No | No |

**The core insight:** Freelancers get paid to work. CodeValue engineers get paid for value that keeps existing after they stop working. This is the first application of a royalty model to software engineering.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL + RLS) |
| Authentication | Supabase Auth (email + password) |
| AI / LLM | Groq API — Llama 3.3 70B |
| GitHub Integration | GitHub REST API |
| Deployment | Vercel |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Org Browser   │────▶│  Next.js API Routes  │────▶│   GitHub API    │
│ Engineer Browser│     │  (Vercel Serverless)  │     │  (Code fetch)   │
└─────────────────┘     └──────────┬───────────┘     └─────────────────┘
                                   │
                         ┌─────────┴──────────┐
                         │                    │
                  ┌──────▼──────┐    ┌────────▼────────┐
                  │  Supabase   │    │    Groq API      │
                  │ PostgreSQL  │    │  Llama 3.3 70B   │
                  │    + RLS    │    │  (Code analysis) │
                  └─────────────┘    └─────────────────┘
```

**Database schema:**
- `profiles` — user roles and names (engineer / org)
- `orgs` — connected repositories and accepted terms
- `findings` — AI-generated problems with impact estimates
- `claims` — engineer-finding relationships with acknowledgement state

---

## Running Locally

### Prerequisites
- Node.js 18+
- A Supabase project
- A Groq API key (free at [console.groq.com](https://console.groq.com))
- A GitHub personal access token

### Setup

```bash
git clone https://github.com/AnanthanDJ/codevalue.git
cd codevalue
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
GITHUB_TOKEN=your_github_token
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Database Setup

Run this in your Supabase SQL editor:

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('engineer', 'org')),
  name text,
  created_at timestamp default now()
);

create table orgs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  repo_url text not null,
  terms_accepted boolean default false,
  created_at timestamp default now()
);

create table findings (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references orgs(id) on delete cascade,
  title text not null,
  category text not null,
  description text not null,
  estimated_impact text not null,
  estimated_earnings text not null,
  file text not null,
  difficulty text not null,
  status text default 'open' check (status in ('open', 'claimed', 'resolved')),
  created_at timestamp default now()
);

create table claims (
  id uuid default gen_random_uuid() primary key,
  finding_id uuid references findings(id) on delete cascade,
  engineer_id uuid references profiles(id) on delete cascade,
  org_acknowledged boolean default false,
  created_at timestamp default now()
);

alter table profiles enable row level security;
alter table orgs enable row level security;
alter table findings enable row level security;
alter table claims enable row level security;

create policy "Public profiles readable" on profiles for select using (true);
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);
create policy "Orgs select" on orgs for select using (true);
create policy "Orgs insert" on orgs for insert with check (auth.uid() = user_id);
create policy "Orgs update" on orgs for update using (auth.uid() = user_id);
create policy "Findings readable by all" on findings for select using (true);
create policy "Findings manageable by service" on findings for all using (true);
create policy "Claims readable by all" on claims for select using (true);
create policy "Engineers manage own claims" on claims for all using (auth.uid() = engineer_id);
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Key Design Decisions

**Why recurring revenue instead of one-time payment?**
It aligns engineer incentives with long-term org outcomes. An engineer paid once has no reason to ensure their fix holds up. An engineer paid monthly does.

**Why staged reveal?**
Without it, orgs could take findings and implement them without compensating engineers. The acknowledgement mechanism creates a legal timestamp before disclosure, making independent implementation a breach of contract.

**Why Groq over OpenAI?**
Groq's free tier is genuinely generous and fast enough for real-time demo use. Llama 3.3 70B performs well on structured code analysis tasks.

**Why not have AI fix the problems too?**
AI can generate solutions. It cannot own outcomes. No AI agent can be held legally accountable for a production failure or make judgment calls when a fix conflicts with undocumented business logic. Engineers on this platform are paid to take accountability for results — a human function.

---

## Future Roadmap

- [ ] Holdout group A/B testing for rigorous causation verification
- [ ] Multi-repo support per organisation  
- [ ] Specialisation tags on engineer profiles
- [ ] Escrow and dispute resolution layer
- [ ] CI/CD pipeline integration for automated measurement
- [ ] Enterprise tier with private scanner deployment
- [ ] AI-assisted solution proposals before claiming
- [ ] Mobile app for engineers

---

## Built At

This project was built during a hackathon in approximately 6 hours.

---

## License

MIT
