# ThoughtNet Reddit Launch Posts

All 4 Reddit posts, ready to copy-paste. Post one per day, never two in the same day.

---

## r/SideProject (~300K members)

**Title:** After 14 phases of development, I launched ThoughtNet -- a community-driven mind mapping tool

**Body:**

I've been building ThoughtNet (mind.study.coffee) as a side project, and it's finally at a point where I'm comfortable sharing it.

**The idea:** Mind mapping tools are great, but they're all solo experiences. What if there was a public library where you could browse, fork, and rate other people's mind maps? Like GitHub, but for visual thinking.

**What's free:**
- Unlimited local mind maps
- Community library access (browse, fork, rate, publish)
- JSON export

**What's Pro ($5/mo or $40/yr):**
- Unlimited cloud saves
- Real-time collaboration
- Premium exports (PNG, SVG, PDF, Markdown)
- Version history
- Private sharing

**Lessons learned:**
- The hardest part was scoping. I originally planned too many features and had to ruthlessly prioritize.
- Building the community library was the most rewarding feature to implement -- it turns users from consumers into contributors.
- Pricing at $5/mo was deliberate. Most competitors charge $6-8/mo. I want the Pro plan to be an impulse purchase, not a budget decision.

Would love feedback, especially on the library concept. Is a "GitHub for mind maps" something you'd actually use?

Try it: mind.study.coffee

---

## r/webdev (~2.4M members)

**Title:** Built a mind mapping tool with D3.js, React, and Postgres -- here's what I learned

**Body:**

After months of side-project work, I shipped ThoughtNet (mind.study.coffee), a web-based mind mapping tool with a community library (think GitHub for mind maps).

**Tech stack for the curious:**
- Frontend: React 18, D3.js for SVG canvas rendering
- Backend: Express.js on AWS App Runner
- Database: Postgres on RDS
- Auth: AWS Cognito
- Payments: Stripe ($5/mo or $40/yr Pro plan)
- Hosting: AWS Amplify (frontend), ECR + App Runner (backend)
- Real-time: WebSocket-based collaboration with cursor presence

**Interesting technical challenges:**
- Getting D3.js drag-and-drop to feel smooth at 60fps with 100+ nodes
- IndexedDB for offline-first local storage with cloud sync
- Implementing "fork" semantics for mind maps (similar to git fork but for tree structures)
- Version history using Postgres JSONB diffs

**What it does:**
- Free: Unlimited local maps, community library (browse/fork/rate/publish), JSON export
- Pro ($5/mo or $40/yr): Unlimited cloud, real-time collab, PNG/SVG/PDF/MD export, version history

I'd love technical feedback on the UX and performance. Try it at mind.study.coffee.

Happy to answer questions about the architecture or any of the technical decisions.

---

## r/productivity (~3.2M members)

**Title:** I built a free mind mapping tool with a community library where you can fork other people's maps

**Body:**

I've been a long-time lurker here and wanted to share something I built for my own productivity workflow.

I was tired of mind mapping tools that either (a) limit free users to 3 maps, (b) have no way to share or discover other people's maps, or (c) charge $8+/month for basic collaboration.

So I built **ThoughtNet** (mind.study.coffee) -- a web-based mind mapping tool where:

- You can create unlimited mind maps for free (stored locally in your browser)
- There's a **public library** where people publish their maps and others can browse, fork, and rate them
- You can fork any public map and customize it for your own use
- The Pro plan is $5/mo (or $40/yr) if you want cloud sync, collaboration, and premium exports

The library is the part I'm most excited about. Imagine finding a well-structured "Project Planning" or "Study Guide for Biology 101" template that someone already made, forking it, and adapting it to your needs.

It's completely free to use. I'd love feedback from this community on what would make it more useful for your workflows.

Link: https://mind.study.coffee

---

## r/GetStudying (~1.1M members)

**Title:** Made a free mind mapping tool specifically for students -- you can fork other students' study maps from a shared library

**Body:**

Hey everyone. I'm a developer who's always used mind maps for studying, but I found that existing tools either limit you to 3 free maps or don't let you share/discover other people's study maps.

So I built ThoughtNet (mind.study.coffee). The killer feature for students is the **community library**:

- Browse mind maps that other students have published (organized by topic)
- Found a great "Organic Chemistry Reactions" map? Fork it and add your own notes
- Rate maps so the best ones rise to the top
- Create unlimited maps for free (no account needed, works in your browser)

Some use cases I've been using it for:
- Course overview maps (one node per lecture topic, expand as the semester goes)
- Exam prep maps (fork a classmate's map and fill in gaps)
- Group study maps (Pro plan at $5/mo lets you collaborate in real-time, but the free version covers most needs)

It's free at mind.study.coffee. Would love to hear what study-related features would be most useful.
