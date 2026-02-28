# ThoughtNet -- 30-Day Launch Plan

**Goal**: 20 active users in 30 days
**Budget**: $0 (organic only)
**URL**: https://mind.study.coffee
**Pricing**: Free (unlimited local) | Pro $5/mo or $40/yr
**Start Date**: _______________ (fill in when starting)

---

## How to Use This Document

- Work through each day in order. Each day has 1-3 tasks max.
- Tasks marked **(AI)** can be delegated to Claude or another AI agent.
- Tasks marked **(HUMAN)** require you personally (account creation, posting, social interaction).
- Tasks marked **(EITHER)** can go either way.
- Check the box when done. Track metrics in the "Metrics Check" sections.

---

## Pre-Launch Checklist (Complete Before Day 1)

These are prerequisites. Do not start Day 1 until these are done.

### Accounts & Profiles
- [ ] **(HUMAN)** Create a Twitter/X account for ThoughtNet (e.g., @ThoughtNetApp)
- [ ] **(HUMAN)** Create a Product Hunt maker profile at producthunt.com -- comment on 3-5 other products over the next week to build credibility before your own launch
- [ ] **(HUMAN)** Create an IndieHackers profile at indiehackers.com
- [ ] **(HUMAN)** Create a Dev.to account at dev.to

### Marketing Assets
- [ ] **(EITHER)** Create OG image (1200x630px) showing ThoughtNet editor and library side by side. Save as `public/og-image.png`
- [ ] **(AI)** Implement meta tags, Open Graph tags, Twitter Card tags, and JSON-LD structured data in `index.html` (copy from MARKETING_STRATEGY.md Section 2.3) -- update pricing to $5/mo and $40/yr
- [ ] **(HUMAN)** Record a 60-90 second screen capture demo video: create a map, add nodes, publish to library, fork someone else's map. Use QuickTime or Loom. No editing needed.
- [ ] **(EITHER)** Take 5-6 high-quality screenshots of key features: (1) editor with a real map, (2) library browse page, (3) fork flow, (4) real-time collaboration cursors, (5) export modal, (6) dashboard with multiple maps

### Library Seeding (Critical -- the library must not be empty on launch)
- [ ] **(AI)** Create and publish template map: "Project Planning -- Agile Sprint" (phases, backlog, standups, retro)
- [ ] **(AI)** Create and publish template map: "SWOT Analysis Template" (Strengths, Weaknesses, Opportunities, Threats with example nodes)
- [ ] **(AI)** Create and publish template map: "Biology 101 -- Cell Structure" (organelles, functions, diagrams)
- [ ] **(AI)** Create and publish template map: "JavaScript Fundamentals" (data types, functions, async, DOM, events)
- [ ] **(AI)** Create and publish template map: "Essay Writing Structure" (thesis, body paragraphs, evidence, conclusion)
- [ ] **(AI)** Create and publish template map: "Machine Learning Overview" (supervised, unsupervised, reinforcement, key algorithms)
- [ ] **(AI)** Create and publish template map: "Startup Launch Checklist" (MVP, marketing, legal, funding, hiring)
- [ ] **(AI)** Create and publish template map: "Personal Goal Setting -- OKR Framework" (vision, objectives, key results, habits)
- [ ] **(AI)** Create and publish template map: "Book Notes Template" (key ideas, quotes, action items, related books)
- [ ] **(AI)** Create and publish template map: "System Design -- Microservices Architecture" (API gateway, services, databases, caching, messaging)
- [ ] **(HUMAN)** Review all 10 template maps for quality. Ensure each has a clear title, description, and 15+ nodes with meaningful content.

### Technical SEO
- [ ] **(AI)** Generate a `sitemap.xml` that includes the landing page, library browse page, and all public map URLs
- [ ] **(AI)** Create or update `robots.txt` -- allow crawling of landing page and public library, block `/app/` internal routes
- [ ] **(HUMAN)** Verify `mind.study.coffee` in Google Search Console (DNS TXT record or HTML file method)
- [ ] **(HUMAN)** Submit `sitemap.xml` in Google Search Console

---

## Week 1: Foundation (Days 1-7)

### Day 1 (Monday): Analytics Setup
- [ ] **(HUMAN)** Set up Google Analytics 4 for mind.study.coffee. Create a GA4 property, add the tracking snippet to the app.
- [ ] **(HUMAN)** Set up GA4 custom events for key actions:
  - `sign_up` -- user creates an account
  - `create_map` -- user creates a new mind map
  - `publish_to_library` -- user publishes a map to the public library
  - `fork_map` -- user forks a map from the library
  - `upgrade_to_pro` -- user starts a Pro subscription
- [ ] **(HUMAN)** Install Microsoft Clarity (free) at clarity.microsoft.com for session recordings and heatmaps. Add the script tag to `index.html`.

### Day 2 (Tuesday): Session Recordings & Community Lurking
- [ ] **(HUMAN)** Verify Clarity is recording sessions by visiting the site and checking the Clarity dashboard.
- [ ] **(HUMAN)** Join these Discord servers and introduce yourself (do NOT promote ThoughtNet yet, just participate in conversations):
  - "Productivity" (discord.gg/productivity)
  - "Study Together" (discord.gg/study)
  - "Indie Hackers" or "WIP" maker communities
- [ ] **(HUMAN)** On Reddit, subscribe to and browse r/productivity, r/GetStudying, r/SideProject, r/webdev. Upvote and leave genuine comments on 3-5 posts (build karma, do NOT mention ThoughtNet).

### Day 3 (Wednesday): Library Seeding -- Batch 2
- [ ] **(AI)** Create and publish 5 more template maps to the library:
  1. "History of the Internet" (ARPANET, WWW, social media, cloud era)
  2. "Organic Chemistry Reactions" (substitution, elimination, addition, oxidation)
  3. "UX Research Methods" (interviews, surveys, usability testing, A/B testing)
  4. "Meeting Notes Template" (agenda, discussion points, action items, follow-ups)
  5. "Decision Making Framework" (pros/cons, weighted criteria, risk assessment)
- [ ] **(HUMAN)** Review all new maps for quality and fix any issues.
- [ ] **(HUMAN)** Take updated screenshots of the library now that it has 15+ maps. These will be used for Product Hunt and social posts.

### Day 4 (Thursday): Content Drafting -- Dev.to Article
- [ ] **(AI)** Write the full Dev.to article: "I Built a GitHub-Style Community Library for Mind Maps -- Here's Why and How". Follow this outline:
  1. Introduction -- the problem with solo, siloed, paywalled mind maps
  2. Why "GitHub for Mind Maps" -- fork/remix applied to visual thinking
  3. Tech stack -- React 18, D3.js, Express.js, Postgres, AWS, Stripe
  4. The fork mechanic -- how forking works for tree structures
  5. Challenges -- D3.js performance, pricing strategy, building from zero
  6. CTA -- link to mind.study.coffee, call for feedback and first contributors
  - Include 3-4 screenshots inline
  - Tags: `webdev`, `react`, `javascript`, `productivity`
  - Save draft locally at `docs/devto-article.md`
- [ ] **(AI)** Save finalized versions of all 4 Reddit post drafts to `docs/reddit-posts.md` for easy copy-paste on posting days. Use the drafts from MARKETING_STRATEGY.md Section 3.2 but update pricing to $5/mo or $40/yr.

### Day 5 (Friday): Content Drafting -- Product Hunt & HN
- [ ] **(AI)** Finalize Product Hunt listing copy (update pricing to $5/mo or $40/yr) and save to `docs/producthunt-listing.md`:
  - Tagline (60 chars): "The GitHub for mind maps -- create, share, fork, collaborate"
  - Short description (260 chars): "ThoughtNet is a free, community-driven mind mapping tool. Create unlimited maps locally, browse and fork maps from a public library, and collaborate in real-time. Like GitHub, but for visual thinking. Pro starts at $5/mo."
  - Maker comment (full text from MARKETING_STRATEGY.md Section 3.1, updated pricing)
  - Topics: Productivity, Design Tools, Education, Open Source
- [ ] **(HUMAN)** Upload 5 screenshots + demo video to Product Hunt as a draft listing (do NOT publish yet -- that is Day 14).
- [ ] **(AI)** Finalize Show HN post copy (updated pricing) and save to `docs/show-hn-post.md`.

### Day 6 (Saturday): Directory Listings
- [ ] **(HUMAN)** Submit ThoughtNet to AlternativeTo.net -- list as alternative to: MindMeister, Xmind, Coggle, Miro. Description: "Free, community-driven mind mapping tool with a public library for sharing and forking maps. Pro plan at $5/mo."
- [ ] **(HUMAN)** Submit to SaaSHub (saashub.com) -- list as MindMeister alternative.
- [ ] **(HUMAN)** Submit to Slant.co -- add to "What are the best mind mapping tools?" list.

### Day 7 (Sunday): Final Pre-Launch QA & Metrics Check

- [ ] **(HUMAN)** Do a full walkthrough of the app as a new user. Test: landing page -> sign up -> create map -> add 10+ nodes -> publish to library -> browse library -> fork a map -> export PNG. Note any friction points.
- [ ] **(HUMAN)** Fix any critical bugs or UX issues found during the walkthrough.

**Week 1 Metrics Check:**

| Metric | Target | Actual |
|--------|--------|--------|
| Library maps published | 15-20 | ______ |
| Google Search Console verified | Yes | ______ |
| GA4 + Clarity installed | Yes | ______ |
| Product Hunt draft ready | Yes | ______ |
| Directory submissions | 3+ | ______ |

---

## Week 2: Soft Launch (Days 8-14)

### Day 8 (Monday): Personal Network Launch
- [ ] **(HUMAN)** Send a personal message (not mass blast) to 10-15 friends, family, and colleagues. Use this template:

> Hey [name]! I just finished building a side project -- it's a mind mapping tool called ThoughtNet where you can browse and fork other people's maps (like GitHub but for mind maps). Would you mind trying it out and giving me honest feedback? Takes 2 minutes: https://mind.study.coffee

- [ ] **(HUMAN)** Ask 3-5 of those people to create an account and publish at least one map to the library (even a simple one). The goal is to have maps from different usernames, not just your own.
- [ ] **(HUMAN)** Collect feedback. Write down the top 3 issues people mention.

### Day 9 (Tuesday): Dev.to Article + Hashnode Cross-Post
- [ ] **(HUMAN)** Publish the Dev.to article drafted on Day 4. Post between 9-11 AM EST (peak Dev.to traffic).
- [ ] **(HUMAN)** Cross-post to Hashnode with canonical URL pointing to Dev.to.
- [ ] **(HUMAN)** Share the article link in 1-2 Discord servers (in appropriate #show-and-tell or #projects channels, not general chat).

### Day 10 (Wednesday): Reddit -- r/SideProject
- [ ] **(HUMAN)** Post to r/SideProject. Use this post (copy from `docs/reddit-posts.md`):

> **Title**: After 14 phases of development, I launched ThoughtNet -- a community-driven mind mapping tool
>
> I've been building ThoughtNet (mind.study.coffee) as a side project, and it's finally at a point where I'm comfortable sharing it.
>
> **The idea:** Mind mapping tools are great, but they're all solo experiences. What if there was a public library where you could browse, fork, and rate other people's mind maps? Like GitHub, but for visual thinking.
>
> **What's free:**
> - Unlimited local mind maps
> - Community library access (browse, fork, rate, publish)
> - JSON export
>
> **What's Pro ($5/mo):**
> - Unlimited cloud saves
> - Real-time collaboration
> - Premium exports (PNG, SVG, PDF, Markdown)
> - Version history
> - Private sharing
>
> **Lessons learned:**
> - The hardest part was scoping. I originally planned too many features and had to ruthlessly prioritize.
> - Building the community library was the most rewarding feature to implement -- it turns users from consumers into contributors.
> - Pricing at $5/mo was deliberate. Most competitors charge $6-8/mo.
>
> Would love feedback, especially on the library concept. Is a "GitHub for mind maps" something you'd actually use?
>
> Try it: mind.study.coffee

- [ ] **(HUMAN)** Respond to every comment within 2 hours. Be genuine, thank people for feedback, and note any feature requests.
- Post between 9-11 AM EST for best visibility.

### Day 11 (Thursday): Reddit -- r/webdev
- [ ] **(HUMAN)** Post to r/webdev. Use this post (copy from `docs/reddit-posts.md`):

> **Title**: Built a mind mapping tool with D3.js, React, and Postgres -- here's what I learned
>
> After months of side-project work, I shipped ThoughtNet (mind.study.coffee), a web-based mind mapping tool with a community library (think GitHub for mind maps).
>
> **Tech stack for the curious:**
> - Frontend: React 18, D3.js for SVG canvas rendering
> - Backend: Express.js on AWS App Runner
> - Database: Postgres on RDS
> - Auth: AWS Cognito
> - Payments: Stripe ($5/mo Pro plan)
> - Hosting: AWS Amplify (frontend), ECR + App Runner (backend)
> - Real-time: WebSocket-based collaboration with cursor presence
>
> **Interesting technical challenges:**
> - Getting D3.js drag-and-drop to feel smooth at 60fps with 100+ nodes
> - IndexedDB for offline-first local storage with cloud sync
> - Implementing "fork" semantics for mind maps (similar to git fork but for tree structures)
> - Version history using Postgres JSONB diffs
>
> **What it does:**
> - Free: Unlimited local maps, community library (browse/fork/rate/publish), JSON export
> - Pro: Unlimited cloud, real-time collab, PNG/SVG/PDF/MD export, version history
>
> I'd love technical feedback on the UX and performance. Try it at mind.study.coffee.
>
> Happy to answer questions about the architecture or any of the technical decisions.

- [ ] **(HUMAN)** Engage with every comment. Focus on technical questions -- this audience cares about how it's built, not just what it does.
- Post between 10 AM - 12 PM EST.

### Day 12 (Friday): Iterate on Feedback
- [ ] **(HUMAN)** Review GA4 dashboard: how many visitors, sign-ups, and library actions this week?
- [ ] **(HUMAN)** Watch 5-10 Clarity session recordings. Note where users hesitate, get confused, or abandon.
- [ ] **(EITHER)** Fix the top 3 UX issues identified from feedback and session recordings. Prioritize anything that blocks the core loop: land on site -> sign up -> create map -> publish to library.

### Day 13 (Saturday): IndieHackers + Respond to All Comments
- [ ] **(HUMAN)** Post on IndieHackers product section. Use a condensed version of the r/SideProject post, emphasizing the business model and pricing strategy.
- [ ] **(HUMAN)** Go back and reply to any new comments on Dev.to, r/SideProject, and r/webdev. Thank people, answer questions, acknowledge feature requests.

### Day 14 (Tuesday): Product Hunt Launch Day

**This is the biggest single day of the plan. Block 2-3 hours.**

- [ ] **(HUMAN)** Publish ThoughtNet on Product Hunt at 12:01 AM PST (3:01 AM EST). Schedule the night before if possible.
- [ ] **(HUMAN)** Immediately post the maker comment:

> Hey Product Hunt! I'm Greg, and I built ThoughtNet because I was frustrated that every mind mapping tool treats users like isolated individuals.
>
> The idea is simple: **what if mind maps were shareable and forkable, like code on GitHub?**
>
> Here's what you get for free:
> - Unlimited local mind maps (no 3-map paywall)
> - Browse a community library of public maps
> - Fork any public map and make it your own
> - Rate and discover trending maps
> - Export to JSON
>
> Pro ($5/mo or $40/yr) adds:
> - Unlimited cloud saves
> - Real-time collaboration with cursor presence
> - Export to PNG, SVG, PDF, Markdown
> - Version history
> - Private sharing links
>
> I built this as a solo developer using React, D3.js, and Postgres on AWS. The community library is the heart of the product -- I believe knowledge should be open and remixable.
>
> Would love your feedback. What features would make ThoughtNet your go-to mind mapping tool?

- [ ] **(HUMAN)** Share the Product Hunt link with your personal network. Text/DM people individually: "I just launched on Product Hunt, would love it if you checked it out and left feedback." Do NOT ask for upvotes (against PH rules).
- [ ] **(HUMAN)** Monitor Product Hunt all day. Reply to every comment within 30 minutes. Be authentic and grateful.

**Week 2 Metrics Check:**

| Metric | Target | Actual |
|--------|--------|--------|
| Unique visitors (cumulative) | 100-300 | ______ |
| Sign-ups (cumulative) | 10-30 | ______ |
| Library maps (non-template) | 5-10 | ______ |
| Library forks | 3-10 | ______ |
| Product Hunt upvotes | 30+ | ______ |
| Pro conversions | 0-1 | ______ |
| Reddit post karma (combined) | 20+ | ______ |
| Dev.to article views | 100+ | ______ |

---

## Week 3: Public Launch Push (Days 15-21)

### Day 15 (Wednesday): Product Hunt Follow-Up
- [ ] **(HUMAN)** Reply to any remaining Product Hunt comments from yesterday.
- [ ] **(HUMAN)** Post a Twitter/X thread with your Product Hunt results. Template:

> Just launched ThoughtNet on Product Hunt yesterday.
>
> [X] upvotes, [X] comments.
>
> Biggest takeaway: [one genuine insight from the feedback].
>
> If you haven't tried it yet: mind.study.coffee
>
> Thanks to everyone who checked it out.

- [ ] **(HUMAN)** If you placed in the top 10 for the day, add "Featured on Product Hunt" badge to the landing page. If not, move on -- the feedback matters more than the ranking.

### Day 16 (Thursday): Show HN Day
- [ ] **(HUMAN)** Post to Hacker News between 8-10 AM EST. Use this exact post:

> **Title**: Show HN: ThoughtNet -- A mind mapping tool with a public library (fork and remix maps)
>
> ThoughtNet (https://mind.study.coffee) is a web-based mind mapping tool built around a community library where users can publish, browse, fork, and rate mind maps.
>
> The free tier gives you unlimited local maps, library access, and JSON export. Pro ($5/mo) adds cloud sync, real-time collaboration, premium exports, and version history.
>
> Built with React, D3.js (SVG rendering), Express.js, Postgres, and AWS. The "fork" concept works like a git fork -- you get a full copy of someone's published map that you can customize and optionally republish.
>
> I built this because existing tools (MindMeister, Xmind, Coggle) treat mind mapping as a solo activity. The library changes that by making maps discoverable and remixable.
>
> Source of inspiration: the way GitHub made code sharing the default, not the exception. Hoping to do the same for structured visual thinking.

- [ ] **(HUMAN)** If the post gains traction (10+ points in the first hour), clear your schedule and respond to every comment. HN commenters are technical and direct -- answer honestly, acknowledge limitations.
- [ ] **(HUMAN)** If it doesn't gain traction after 2 hours, do NOT repost. Move on to the next day's tasks.

### Day 17 (Friday): Reddit -- r/productivity
- [ ] **(HUMAN)** Post to r/productivity (3.2M members). Post between 9-11 AM EST. Use this post:

> **Title**: I built a free mind mapping tool with a community library where you can fork other people's maps
>
> I've been a long-time lurker here and wanted to share something I built for my own productivity workflow.
>
> I was tired of mind mapping tools that either (a) limit free users to 3 maps, (b) have no way to share or discover other people's maps, or (c) charge $8+/month for basic collaboration.
>
> So I built **ThoughtNet** (mind.study.coffee) -- a web-based mind mapping tool where:
>
> - You can create unlimited mind maps for free (stored locally in your browser)
> - There's a **public library** where people publish their maps and others can browse, fork, and rate them
> - You can fork any public map and customize it for your own use
> - The Pro plan is $5/mo if you want cloud sync, collaboration, and premium exports
>
> The library is the part I'm most excited about. Imagine finding a well-structured "Project Planning" or "Study Guide for Biology 101" template that someone already made, forking it, and adapting it to your needs.
>
> It's completely free to use. I'd love feedback from this community on what would make it more useful for your workflows.
>
> Link: https://mind.study.coffee

- [ ] **(HUMAN)** Respond to every comment within 2 hours.
- Use flair "Tool/App" if available.

### Day 18 (Saturday): Reddit -- r/GetStudying
- [ ] **(HUMAN)** Post to r/GetStudying (1.1M members). Post between 10 AM - 12 PM EST. Use this post:

> **Title**: Made a free mind mapping tool specifically for students -- you can fork other students' study maps from a shared library
>
> Hey everyone. I'm a developer who's always used mind maps for studying, but I found that existing tools either limit you to 3 free maps or don't let you share/discover other people's study maps.
>
> So I built ThoughtNet (mind.study.coffee). The killer feature for students is the **community library**:
>
> - Browse mind maps that other students have published (organized by topic)
> - Found a great "Organic Chemistry Reactions" map? Fork it and add your own notes
> - Rate maps so the best ones rise to the top
> - Create unlimited maps for free (no account needed, works in your browser)
>
> Some use cases I've been using it for:
> - Course overview maps (one node per lecture topic, expand as the semester goes)
> - Exam prep maps (fork a classmate's map and fill in gaps)
> - Group study maps (Pro plan lets you collaborate in real-time, but the free version covers most needs)
>
> It's free at mind.study.coffee. Would love to hear what study-related features would be most useful.

- [ ] **(HUMAN)** Respond to every comment. Students tend to ask practical questions -- be helpful, not salesy.

### Day 19 (Sunday): Twitter/X Launch Thread
- [ ] **(HUMAN)** Post the full 7-tweet launch thread. Space each tweet 1-2 minutes apart for threading.

**Tweet 1 (Hook):**
> I just launched ThoughtNet -- a free mind mapping tool with something no competitor has: a public library where you can fork other people's maps.
>
> Think GitHub, but for mind maps.
>
> Here's the story (thread):
>
> mind.study.coffee

**Tweet 2 (Problem):**
> Every mind mapping tool I've tried has the same problem:
>
> - Free plan limited to 3 maps
> - No way to discover other people's maps
> - Collaboration costs $8+/month
> - Your maps are trapped in a silo
>
> So I built something different.

**Tweet 3 (Solution -- Free):**
> ThoughtNet's free plan:
>
> - Unlimited local mind maps (not 3, unlimited)
> - Browse a community library of public maps
> - Fork any map and make it yours
> - Rate maps so the best ones surface
> - Export to JSON
>
> No account required to start mapping.

**Tweet 4 (Solution -- Library):**
> The community library is the heart of ThoughtNet.
>
> Someone publishes a "Machine Learning Fundamentals" map. You fork it, add your notes, and republish your version.
>
> Knowledge compounds when it's shared and remixed.
>
> [Attach screenshot of library browse page]

**Tweet 5 (Pro plan):**
> Pro is $5/month (or $40/year).
>
> What you get:
> - Unlimited cloud saves
> - Real-time collaboration with live cursors
> - Export to PNG, SVG, PDF, Markdown
> - Version history
> - Private sharing links
>
> Most people won't need it. And that's fine.

**Tweet 6 (Tech):**
> Built as a solo dev with:
> - React 18 + D3.js for canvas rendering
> - Express.js + Postgres on AWS
> - Stripe for payments
> - WebSockets for real-time collab
>
> 14 phases of development. Hundreds of tests. Shipped.

**Tweet 7 (CTA):**
> If you've ever wished mind maps were as shareable as GitHub repos, give ThoughtNet a try.
>
> It's free. No credit card. No 3-map limit.
>
> mind.study.coffee
>
> I'd love your feedback -- reply or DM me what features you'd want next.

- [ ] **(HUMAN)** Pin the thread to your profile.
- [ ] **(HUMAN)** Follow and engage with 10-15 productivity/study accounts. Like and reply to their content (genuine engagement, not spam).

### Day 20 (Monday): Respond to Everything
- [ ] **(HUMAN)** Do a sweep of ALL channels and reply to every unanswered comment:
  - Product Hunt
  - Hacker News
  - r/productivity
  - r/GetStudying
  - r/SideProject
  - r/webdev
  - Dev.to
  - Twitter/X
  - IndieHackers
- [ ] **(HUMAN)** Thank anyone who published a map to the library. Send a DM or reply: "Just saw your [map name] in the library -- really well done. Thanks for being one of the first contributors."

### Day 21 (Tuesday): Week 3 Review & Iterate

- [ ] **(HUMAN)** Review GA4 dashboard. Record all metrics in the table below.
- [ ] **(HUMAN)** Watch 5-10 new Clarity session recordings. Identify the #1 UX friction point for new users.
- [ ] **(EITHER)** Fix the #1 UX friction point identified above.

**Week 3 Metrics Check:**

| Metric | Target | Actual |
|--------|--------|--------|
| Unique visitors (cumulative) | 500-2,000 | ______ |
| Sign-ups (cumulative) | 15-50 | ______ |
| Library maps (non-template) | 10-30 | ______ |
| Library forks | 10-30 | ______ |
| Pro conversions | 1-3 | ______ |
| Product Hunt upvotes (final) | 50+ | ______ |
| HN points | 10+ | ______ |
| Twitter followers | 20+ | ______ |
| Clarity sessions recorded | 50+ | ______ |
| Top UX issue identified | ____________ | ______ |

---

## Week 4: Follow-Up, Content, & Sustain (Days 22-30)

### Day 22 (Wednesday): Bug Fix Sprint
- [ ] **(EITHER)** Fix the top 3 bugs or UX issues reported by users during launch week. Prioritize anything that breaks the core loop: create map -> publish -> fork.
- [ ] **(HUMAN)** If any fixes are significant, post a short update on Twitter: "Shipped [fix] based on your feedback. Keep it coming -- mind.study.coffee"

### Day 23 (Thursday): Blog Post #1 -- Study Guide
- [ ] **(AI)** Write blog post: "How to Study Smarter with Mind Maps: A Complete Guide for Students". Requirements:
  - 1,500-2,000 words
  - Target keywords: "mind map for studying", "how to use mind maps for studying"
  - Include 2-3 examples using ThoughtNet (with screenshots or links to library maps)
  - End with CTA: "Try it free at mind.study.coffee -- browse the student map library to get started"
  - Save to `docs/blog-post-study-guide.md`
- [ ] **(HUMAN)** Publish the blog post on Dev.to and/or a `/blog` page on the site. Add tags: `study`, `productivity`, `education`, `mindmapping`.

### Day 24 (Friday): Community Engagement & Outreach Prep
- [ ] **(HUMAN)** Reply to any new comments across all channels from the past 3 days.
- [ ] **(HUMAN)** DM or email the top 3 library contributors thanking them personally. Ask: "What feature would make ThoughtNet more useful for you?"
- [ ] **(AI)** Draft a list of 10 productivity bloggers/YouTubers with 1K-50K followers who cover mind mapping, note-taking, or study tools. Include their name, platform, audience size, and contact method. Save to `docs/outreach-list.md`.

### Day 25 (Saturday): Outreach to Micro-Influencers
- [ ] **(HUMAN)** Reach out to 5 people from the outreach list. Use this DM/email template:

> Hi [name], I'm Greg, a solo developer who built ThoughtNet (mind.study.coffee) -- a free mind mapping tool with a community library where you can fork other people's maps (like GitHub for mind maps).
>
> I've been following your content on [topic] and think your audience might find it useful. I'd love to offer you a free Pro account ($5/mo value) if you'd be interested in trying it out and sharing your honest take.
>
> No obligation -- if it's not for you, no worries at all. Just thought it aligned with the tools you cover.
>
> Here's a 60-second demo: [link to demo video]
>
> Thanks for your time!

- [ ] **(HUMAN)** Do NOT follow up aggressively. If they don't respond within a week, move on.

### Day 26 (Sunday): Rest Day / Light Engagement
- [ ] **(HUMAN)** Spend 15-20 minutes replying to any new comments or DMs across channels. Otherwise, take a break. Sustainability matters.

### Day 27 (Monday): Blog Post #2 -- Comparison Article
- [ ] **(AI)** Write blog post: "The 7 Best Free Mind Mapping Tools in 2026 (Honest Comparison)". Requirements:
  - 2,000-2,500 words
  - Compare: MindMeister, Xmind, Miro, Coggle, GitMind, Canva (mind maps), ThoughtNet
  - Be genuinely fair -- acknowledge competitor strengths
  - Target keywords: "best free mind map tool", "mind map software comparison 2026"
  - Position ThoughtNet as the community-first option with unlimited free maps
  - Save to `docs/blog-post-comparison.md`
- [ ] **(HUMAN)** Publish on Dev.to. Share the link on Twitter and in r/productivity (as a comment on a relevant thread, NOT as a new post -- do not spam the sub).

### Day 28 (Tuesday): Ship a Quick Win
- [ ] **(HUMAN)** Review all user feedback collected over the past 4 weeks. Pick the single most-requested small feature or improvement that can be shipped in one sitting.
- [ ] **(EITHER)** Build and deploy that feature/improvement.
- [ ] **(HUMAN)** Announce it on Twitter: "You asked for [feature]. Just shipped it. mind.study.coffee"

### Day 29 (Wednesday): G2 & Capterra Listings
- [ ] **(HUMAN)** Create a product listing on G2 (g2.com). Fill in all fields: description, features, pricing, screenshots.
- [ ] **(HUMAN)** Create a product listing on Capterra (capterra.com). Same as above.
- [ ] **(HUMAN)** Ask 2-3 early users who gave positive feedback to leave a short review on G2. Send them a direct link to the review form.

### Day 30 (Thursday): Month 1 Retrospective

- [ ] **(HUMAN)** Pull final metrics from GA4, Stripe, and the database. Fill in the table below.
- [ ] **(AI)** Write a "Month 1 Launch Retrospective" (~500 words) summarizing: what worked, what didn't, top feedback themes, and priorities for Month 2. Save to `docs/month-1-retrospective.md`.
- [ ] **(HUMAN)** Review the retrospective and add your own notes.
- [ ] **(HUMAN)** Plan Month 2 priorities based on data. The retrospective should drive this.

**Day 30 Final Metrics:**

| Metric | Target | Actual |
|--------|--------|--------|
| Unique visitors (cumulative) | 1,000-5,000 | ______ |
| Sign-ups (cumulative) | 20+ | ______ |
| Active users (used app in last 7 days) | 20 | ______ |
| Library maps (non-template) | 15-40 | ______ |
| Library forks (total) | 15-50 | ______ |
| Pro conversions | 1-5 | ______ |
| MRR | $5-25 | ______ |
| Blog posts published | 2 | ______ |
| Directory listings live | 5+ | ______ |
| Product Hunt upvotes (final) | ______ | ______ |
| HN points (final) | ______ | ______ |
| Twitter followers | 30+ | ______ |
| Top traffic source | ____________ | ______ |
| #1 most-requested feature | ____________ | ______ |
| AdSense approved? | Pending | ______ |

---

## Post-30-Day: What Comes Next

Once you have 30 days of data, your priorities should be driven by what the metrics tell you. However, here are the likely next moves:

1. **Double down on the channel that worked best.** If Reddit drove 60% of sign-ups, post more Reddit content. If HN drove traffic, write more technical content.
2. **Continue publishing 1 blog post per week** (see the content calendar in MARKETING_STRATEGY.md Appendix B).
3. **Seed 5 more library maps per week** until the library has 50+ quality maps.
4. **Re-apply for Google AdSense** once you have consistent traffic (500+ monthly visitors).
5. **Consider a "Show and Tell" or "Map of the Week"** feature on Twitter to highlight community maps.
6. **Start collecting email addresses** for a simple monthly newsletter (use Buttondown or similar free tool).
7. **Phase 15 (Real-time Collaboration)** is the next engineering phase -- having this polished will be a strong differentiator for the Pro plan.

---

## Quick Reference: Posting Schedule

| Day | Platform | Post Type | Time (EST) |
|-----|----------|-----------|------------|
| 9 | Dev.to + Hashnode | Technical article | 9-11 AM |
| 10 | r/SideProject | Launch post | 9-11 AM |
| 11 | r/webdev | Technical discussion | 10 AM-12 PM |
| 13 | IndieHackers | Product post | Any time |
| 14 | Product Hunt | Full launch | 3:01 AM (12:01 AM PST) |
| 16 | Hacker News | Show HN | 8-10 AM |
| 17 | r/productivity | Tool share | 9-11 AM |
| 18 | r/GetStudying | Student-focused | 10 AM-12 PM |
| 19 | Twitter/X | 7-tweet thread | 9-11 AM |
| 23 | Dev.to | Blog post #1 | Any time |
| 27 | Dev.to | Blog post #2 | Any time |

---

## Rules to Follow Throughout

1. **Never post to two subreddits on the same day.** Reddit flags this as spam.
2. **Never ask for upvotes on Product Hunt.** Ask people to "check it out and share feedback."
3. **Reply to every comment on every platform within 24 hours.** Early responsiveness builds trust.
4. **Do not use fake accounts** for reviews, upvotes, or library maps.
5. **Do not compare ThoughtNet negatively to competitors.** Position it on its own merits.
6. **Do not over-promise features that are not built yet.**
7. **Prioritize existing users over new acquisition.** Your first 20 users are your evangelists.
