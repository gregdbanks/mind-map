---
title: I Built a GitHub-Style Community Library for Mind Maps — Here's Why and How
published: false
tags: webdev, react, javascript, productivity
cover_image: screenshot-editor.png
---

# I Built a GitHub-Style Community Library for Mind Maps — Here's Why and How

I've been using mind maps for years — for studying, system design, project planning, brainstorming sessions, you name it. And every single tool I tried had the same frustrating pattern: you create a map, it lives in your account, and that's it. Nobody else ever sees it. It's a solo, siloed, paywalled experience.

That bugged me. Because when I think about the most useful knowledge tools on the internet — GitHub, Wikipedia, Stack Overflow — they all have one thing in common: **they treat knowledge as something you share, remix, and build on together.**

So I spent the better part of a year building [ThoughtNet](https://mind.study.coffee), a mind mapping tool with a community library where you can publish, browse, fork, and rate other people's maps. Think of it as GitHub, but for visual thinking.

This post covers why I built it, the technical decisions I made, and the hardest problems I ran into along the way.

![ThoughtNet editor with a real mind map](screenshot-editor.png)

---

## The Problem: Mind Maps Are Stuck in 2010

Here's what the mind mapping landscape looks like today:

- **MindMeister**: Gives you 3 free maps, then charges $7.50/month. No way to discover or share maps with anyone outside your team.
- **Xmind**: Desktop-first, clean UI, but $6/month and no community features.
- **Coggle**: Simple and colorful, $5/month for anything beyond basics. No public sharing.
- **Miro**: Great for whiteboards but $8/month and mind maps are a secondary feature.

Notice the pattern? Every tool treats you as an isolated user. You create maps alone, you store them alone, and if you want anyone else to see them, you manually share a link. There's no concept of a public ecosystem where maps can be discovered, forked, and improved by the community.

Compare that to how code works on GitHub. Someone publishes a repo, you fork it, modify it for your needs, and optionally contribute back. The entire ecosystem benefits because knowledge compounds when it's open.

I wanted that same dynamic for mind maps.

---

## Why "GitHub for Mind Maps"?

The fork/remix model has proven itself in code. GitHub has 100M+ developers, and the entire open-source ecosystem is built on the idea that you can take someone's work, build on top of it, and share your version back.

Why doesn't this exist for structured knowledge outside of code?

When a student creates a really solid "Organic Chemistry Reactions" mind map, why can't another student find it, fork it, add their own notes, and republish their enhanced version? When a project manager builds a thorough "Agile Sprint Planning" template, why does it stay locked in their personal account?

ThoughtNet's community library changes this. Here's how it works:

1. **You create a mind map** — unlimited, free, stored locally in your browser via IndexedDB.
2. **You publish it to the library** — it becomes publicly discoverable with a title, description, and tags.
3. **Other users browse the library** — they can search, filter by category, and see ratings.
4. **They fork your map** — they get a full copy they can modify however they want.
5. **They optionally republish** — their version goes back into the library, attributed to them, with a link back to the original.

Knowledge compounds. The library gets better over time. Everyone benefits.

![Community library browse page](screenshot-library.png)

---

## Tech Stack Deep Dive

I'm a solo developer, so I had to be deliberate about every technology choice. Here's what's under the hood.

### Frontend: React 18 + D3.js

The editor is built with **React 18** for the UI shell and **D3.js** for the actual canvas rendering. The mind map itself is an SVG that D3 manages — nodes are `<g>` elements with text, connections are `<path>` elements with smooth curves.

Why D3.js instead of a canvas library like Konva or Fabric.js? A few reasons:

- **SVG is resolution-independent** — maps look crisp on retina displays and scale cleanly for export.
- **D3's force layouts and hierarchy modules** are battle-tested for tree structures. `d3-hierarchy` handles the auto-layout, and I can customize the spacing algorithm per-node.
- **DOM-based interaction** — SVG elements are part of the DOM, so hit detection, event handling, and accessibility come (mostly) for free.

The tradeoff is performance. SVG can get sluggish with hundreds of elements. I'll talk about how I handled that in the Challenges section.

### State Management: React Context + useReducer

I started with Zustand but switched to React's built-in Context + useReducer pattern. For this app's state shape — a tree of nodes, selection state, undo/redo stack, collaboration cursors — the reducer pattern maps cleanly. Actions like `ADD_NODE`, `MOVE_NODE`, `DELETE_NODE`, and `FORK_MAP` are explicit and testable.

The undo/redo system uses a command pattern. Every action that mutates the map tree pushes a reversible command onto a history stack. `Ctrl+Z` pops and inverts. It sounds simple but handling edge cases (deleting a subtree, then undoing) took more thought than I expected.

### Backend: Express.js + Postgres on AWS

The API server is a straightforward Express.js app running on **AWS App Runner**. Routes cover authentication, map CRUD, the public library, Stripe webhooks, and real-time collaboration.

The database is **Postgres on RDS**. Mind maps are stored as JSONB — the entire tree structure lives in a single column. This makes reads fast (one query, one map) and writes atomic. For version history, I store diffs between JSONB snapshots, so Pro users can step through their map's history without eating up storage on full copies.

### Auth: AWS Cognito

User authentication runs through **AWS Cognito** — email/password sign-up with JWT tokens. I chose Cognito because it was already part of my AWS stack and handles password reset flows, token refresh, and security best practices out of the box. It's not the most developer-friendly auth system (the docs are dense), but it's rock-solid in production.

### Payments: Stripe

The Pro plan is **$5/month or $40/year**, managed through Stripe Checkout and the Customer Portal. Stripe handles the subscription lifecycle — upgrades, downgrades, cancellations, and failed payment retries. The webhook integration was the trickiest part: you need `express.raw()` on the webhook route *before* `express.json()` runs, or signature verification fails silently. That one cost me an afternoon.

### Hosting

- **Frontend**: AWS Amplify. Connect the GitHub repo, push to main, and it builds and deploys automatically.
- **Backend**: Docker image pushed to ECR, which triggers an App Runner deployment. Zero-downtime deploys with automatic scaling.
- **Database**: RDS Postgres with automated backups.

The whole stack runs for about $30-40/month at the current (low) traffic level, mostly the RDS instance.

---

## The Fork Mechanic: How It Actually Works

Forking code on GitHub is conceptually simple — you copy the entire repository. But mind maps have different semantics than file trees, so I had to think through what "fork" means for this domain.

Here's what happens when you fork a map in ThoughtNet:

1. **Deep copy**: The entire node tree is cloned — every node, every connection, every piece of text. You get a fully independent copy.
2. **Attribution**: The forked map stores a reference to the original map ID and the original author's username. This is displayed on the map's library page: "Forked from [Original Map] by [Author]."
3. **Independence**: After forking, your copy is completely independent. You can add nodes, delete nodes, rename everything, restructure the tree. Changes to the original don't affect your fork, and vice versa.
4. **Republishing**: If you want, you can publish your fork back to the library. It appears as a separate entry with its own ratings and its own fork chain.

This is simpler than git's model — there's no concept of merging, pull requests, or conflict resolution. I considered adding those, but for mind maps, the fork-and-diverge model is actually more natural. You take someone's starting point and make it your own. You don't need to sync back.

![Fork flow showing attribution](screenshot-fork.png)

One thing I'm proud of is the fork chain. If Map A gets forked into Map B, and Map B gets forked into Map C, the library shows the full lineage. You can trace how an idea evolved across different people's interpretations. It's a small detail, but it makes the community aspect feel real.

---

## Challenges and Lessons Learned

### D3.js Performance at Scale

SVG rendering starts to stutter around 150-200 nodes if you're not careful. The main culprit is the layout recalculation — every time a node moves, D3 recalculates the entire tree layout, updates all node positions, and redraws all connections.

My optimizations:
- **Debounce layout recalculation** during drag operations. While you're dragging, only the dragged node moves. The full tree re-layout happens on drag-end.
- **Use CSS `will-change: transform`** on node groups so the browser can GPU-accelerate the transforms.
- **Virtualize off-screen nodes** — nodes outside the visible viewport don't get their text re-rendered on every frame.
- **`:scope > g` selectors** — this one's specific to D3 with Lucide icons. If you use `selectAll('g')`, you'll also match the `<g>` elements inside SVG icons, causing bizarre bugs. Using `:scope > g` scopes the selection to direct children only.

The result: 60fps drag operations with 100+ nodes on a mid-range laptop. Not infinite, but well beyond what most people need for a single mind map.

### Offline-First with Cloud Sync

ThoughtNet is offline-first. Maps are stored in **IndexedDB** in the browser, which means you can create and edit maps without an internet connection and without an account.

The tricky part is syncing. When a user signs up for Pro and enables cloud saves, I need to handle:
- **Initial upload**: Push a local map to the server for the first time.
- **Conflict resolution**: What if they edited the map on two devices while offline? Currently, last-write-wins with a timestamp. It's not perfect, but it works for a solo user editing their own maps.
- **Quota enforcement**: Free users get 1 cloud save. Pro users get unlimited. The sync logic checks the plan before allowing a push.

### Pricing at $5/month

Most mind mapping tools charge $6-8/month. I priced ThoughtNet at **$5/month (or $40/year — two months free)** deliberately. At this stage, I want the Pro plan to be an impulse purchase, not a budget deliberation. If the tool is useful and $5/month removes friction (cloud sync, better exports, collaboration), upgrading should feel like a no-brainer.

The free plan is generous on purpose. Unlimited local maps, community library access, JSON export. Free users aren't freeloaders — they're contributors to the library ecosystem. Every public map they publish makes the library more valuable for everyone, including Pro users.

### Building a Community from Zero

This is the hardest problem and it has nothing to do with code. A community library with zero maps is useless. A library with 10 maps from one person feels fake. You need a critical mass of content before the library provides value.

My approach:
- **Seed the library myself** with 15-20 high-quality template maps across categories: study guides, project planning, system design, personal development.
- **Make the templates genuinely useful** — not placeholder content, but real maps with 15-30 nodes that someone would actually want to fork.
- **Encourage early users to publish** by making it dead simple (one click) and showing published maps prominently on the dashboard.

It's a chicken-and-egg problem, and I don't pretend to have solved it yet. But every library has to start with curated content before organic contributions take over.

![Export options modal](screenshot-export.png)

---

## What I'd Do Differently

If I started over, I'd probably:

1. **Build the library first, editor second.** The library is the differentiator. I spent months building a polished editor before the library existed, but the editor alone isn't unique — there are a dozen mind mapping editors out there. The library is what makes ThoughtNet worth talking about.

2. **Use canvas rendering (PixiJS or Konva) instead of SVG.** SVG was the right call for simplicity and export quality, but the performance ceiling is real. For maps with 200+ nodes, canvas would handle it without breaking a sweat.

3. **Start marketing earlier.** I waited until the product felt "ready" to share it, which is a classic developer trap. The product will never feel ready. I should have been building in public and sharing progress from Phase 1.

---

## Try It Out

ThoughtNet is live at [mind.study.coffee](https://mind.study.coffee).

The free plan gives you:
- Unlimited local mind maps
- Full community library access (browse, fork, rate, publish)
- JSON export
- No account required to start

Pro is **$5/month or $40/year** if you want cloud sync, real-time collaboration, premium exports (PNG, SVG, PDF, Markdown), version history, and private sharing.

I built this as a solo developer and I'm actively looking for feedback. What would make this tool useful for your workflow? What's missing? What's broken?

If you're a mind mapping nerd, a student who lives in visual study guides, or a developer who diagrams everything — I'd love for you to try it and tell me what you think.

And if you create a map and publish it to the library, you'll be one of the first community contributors. That's not nothing.

[Try ThoughtNet free](https://mind.study.coffee)

---

*Thanks for reading. If you have questions about the architecture, the fork mechanic, or anything else, drop a comment — I'll reply to every one.*
