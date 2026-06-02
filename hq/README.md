# HQ

Personal operations dashboard — COO agent, relationship manager, and goals tracker. Part of the [donna](../) project.

## Features

- **COO Agent** (`/`) — Streaming chat with a direct accountability partner. Knows your goals and overdue relationships. Auto-sends a morning briefing on first load each day.
- **People** (`/people`) — Personal relationship manager with urgency sorting, notes, interaction logging, and a person-scoped AI chat.
- **Goals** (`/goals`) — Goal tracking with progress sliders, weekly actions, and one-click discussion with the COO.

## Tech Stack

- Next.js 14 (App Router)
- Supabase (Postgres + @supabase/ssr)
- Anthropic Claude API (`claude-sonnet-4-20250514`) with streaming
- Web Speech API (browser-native voice input — Chrome/Edge)
- Tailwind CSS + TypeScript

## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) (recommended) or Node.js 20+
- A [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com)

## Setup

### 1. Install Node.js via nvm (first time only)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# restart terminal, then:
nvm install 20
```

### 2. Install dependencies

```bash
cd hq
nvm use        # picks up .nvmrc → Node 20
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Set up the database

In the [Supabase SQL editor](https://supabase.com/dashboard/project/_/sql), paste and run the contents of:

```
supabase/migrations/001_initial.sql
```

This creates all tables, indexes, and a trigger to cap COO message history at 30 rows.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Voice Input

Voice input uses the browser's Web Speech API — no external service or API key needed. Hold the mic button to record; release to stop. Interim transcript streams into the input field live.

**Supported browsers:** Chrome, Edge. Safari and Firefox do not support the Web Speech API.

## Project Structure

```
src/
├── app/                  Next.js App Router pages and API routes
│   ├── page.tsx          / — COO Agent
│   ├── people/           /people and /people/[id]
│   ├── goals/            /goals
│   └── api/              All API routes
├── components/           UI components grouped by feature
│   ├── coo/
│   ├── people/
│   ├── goals/
│   └── nav/
├── hooks/                useVoiceInput, useStreamingChat, useAutoResize
├── lib/                  Supabase clients, Anthropic, prompts, utils
└── types/                TypeScript interfaces for all DB tables
supabase/
└── migrations/
    └── 001_initial.sql
```
