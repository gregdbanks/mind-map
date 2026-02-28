# ThoughtNet Roadmap — Phases 9-14

## Strategy

**Community-first, premium productivity.** Free users are contributors who build the public library. Pro users pay for power tools. Teams pay for real-time collaboration.

| Feature | Free | Pro ($3/mo or $24/yr) | Teams (future) |
|---------|------|----------------------|----------------|
| Local maps | Unlimited | Unlimited | Unlimited |
| Cloud saves | 1 | Unlimited | Unlimited |
| Export JSON | Yes | Yes | Yes |
| Export SVG/PNG/PDF/MD | No | Yes | Yes |
| Public library (browse/fork/rate/publish) | Yes | Yes | Yes |
| Share private links | No | Yes | Yes |
| Version history | No | Yes | Yes |
| Ads | Yes (subtle) | No | No |
| Real-time collaboration | No | No | Yes |

---

## Phase 9 — Monetization Quick Fixes

**Effort**: ~8 hours | **Branch**: `feature/phase-9-monetization-fixes`

### 9.1 Gate Premium Exports
- SVG, PNG, PDF, Markdown exports → Pro-only
- JSON export stays free (data portability)
- Free users see locked options with "Pro" badge → clicking opens upgrade modal
- **Files**: `src/components/ExportSelector/ExportSelector.tsx`

### 9.2 Fix ProfileDropdown
- Free users: show "Upgrade to Pro" (links to checkout)
- Pro users: show "Manage subscription" (links to portal)
- **File**: `src/components/ProfileDropdown/ProfileDropdown.tsx`

### 9.3 Share Button Upgrade Prompt
- Show Share button for ALL signed-in users (currently hidden for free)
- Free users clicking Share → upgrade modal
- **Files**: `src/components/EditorHeader/EditorHeader.tsx`

### 9.4 Clickable "Saved Locally" Status
- "Saved locally" text becomes clickable
- Anonymous → sign-in prompt
- Free user at limit → upgrade modal
- **Files**: `src/components/EditorHeader/EditorHeader.tsx`, `src/pages/Editor/Editor.tsx`

### 9.5 Webhook Security Fix
- Replace error detail leak with generic `{ error: "Invalid request" }`
- **File**: `exams-gres/controllers/stripeController.js` line 155

### 9.6 Duplicate Subscription Prevention
- Check `stripe_subscription_id` before creating checkout
- Return `{ error: "Already subscribed" }` if active
- **File**: `exams-gres/controllers/stripeController.js`

### 9.7 Enable Stripe Dunning Emails
- Stripe Dashboard → Settings → Emails → Enable failed payment notifications
- No code changes

### 9.8 Add Annual Plan ($24/yr)
- Create price in Stripe Dashboard
- Set `STRIPE_ANNUAL_PRICE_ID` env var in App Runner
- Update upgrade modal: show monthly ($3/mo) + annual ($24/yr) options with "Save 33%" callout
- **Files**: `src/pages/Dashboard/Dashboard.tsx`, App Runner env vars

### 9.9 Drop Free Cloud Limit to 1
- Change `MAP_LIMIT` from 3 to 1 in backend
- Update frontend footer text
- **Files**: `exams-gres/middleware/planGating.js`, `src/pages/Dashboard/Dashboard.tsx`

### 9.10 Stop Auto-Sync for Downgraded Users
- `pushMap` checks plan status before pushing
- Existing cloud maps remain pullable but edits save locally only
- **Files**: `src/hooks/useCloudSync.ts`, `src/services/syncService.ts`

### Phase 9 — Validation Tests

| # | Test | How to Verify | Pass Criteria |
|---|------|---------------|---------------|
| 9.1a | Free user opens ExportSelector | Log in as free user, open editor, click export dropdown | SVG/PNG/PDF/MD show lock icon + "Pro" badge. JSON is clickable. |
| 9.1b | Free user clicks locked export | Click on "PNG" as free user | Upgrade modal appears. No file downloaded. |
| 9.1c | Pro user exports normally | Log in as Pro, click PNG export | File downloads without any gate or modal. |
| 9.2a | Free ProfileDropdown | Log in as free user, click profile avatar | Dropdown shows "Upgrade to Pro", NOT "Manage subscription". |
| 9.2b | Pro ProfileDropdown | Log in as Pro user, click profile avatar | Dropdown shows "Manage subscription". Clicking opens Stripe portal. |
| 9.3a | Free user sees Share | Open editor as free signed-in user | Share button visible in header. |
| 9.3b | Free user clicks Share | Click Share button as free user | Upgrade modal opens. ShareModal does NOT open. |
| 9.3c | Pro user clicks Share | Click Share as Pro | ShareModal opens normally (toggle sharing on/off). |
| 9.4a | Anonymous save status | Open editor without signing in, make an edit | "Saved locally" text appears and is clickable. |
| 9.4b | Anonymous clicks status | Click the "Saved locally" text | Sign-in prompt or redirect to login page. |
| 9.4c | Free user at limit clicks status | Sign in as free user with 1 cloud map, edit a local map | "Saved locally" is clickable → upgrade modal. |
| 9.5 | Webhook error response | Send POST to `/stripe/webhooks` with invalid signature | Response is `{ error: "Invalid request" }`, no internal details leaked. |
| 9.6a | Duplicate checkout blocked | As a Pro user, call `POST /stripe/create-checkout` | Returns 400 with `{ error: "Already subscribed" }`. |
| 9.6b | Normal checkout works | As free user, call `POST /stripe/create-checkout` | Returns checkout URL normally. |
| 9.7 | Dunning email enabled | Check Stripe Dashboard → Settings → Emails | Failed payment emails toggle is ON. |
| 9.8a | Annual price exists | Check Stripe Dashboard | Annual price ($36/yr) exists in live mode. |
| 9.8b | Upgrade modal shows both plans | Open upgrade modal as free user | Shows "$5/mo" and "$36/yr (Save 40%)" options. Annual is marked "Recommended". |
| 9.8c | Annual checkout works | Click annual option | Redirects to Stripe Checkout with annual price. Completing sets plan to Pro. |
| 9.9a | Cloud limit is 1 | As free user, save 1 map to cloud | Succeeds. |
| 9.9b | Cloud limit blocks at 2 | Try to save a 2nd map to cloud | Blocked. Upgrade modal appears. |
| 9.9c | Pro has no limit | As Pro user, save multiple maps | All succeed without limit. |
| 9.10a | Downgraded user auto-sync stops | Subscribe, save 5 maps, cancel, edit a map | Edits save locally only. Cloud version does not update. |
| 9.10b | Downgraded user can still pull | After cancel, open a cloud-only map | Map loads from cloud (pull works). |

---

## Phase 10 — Public Library Backend

**Effort**: ~1-2 weeks | **Branch**: `feature/phase-10-library-backend`

### Database Tables
- `published_maps` — map snapshot, title, description, category, tags, ratings, fork count
- `map_ratings` — user + published_map + rating (1-5), unique per user per map
- `map_forks` — tracks who forked what

### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/library` | No | Browse (paginated, sortable, filterable) |
| GET | `/library/:id` | No | Single published map with data |
| POST | `/library` | Yes | Publish a cloud map |
| PUT | `/library/:id` | Yes | Update own published map |
| DELETE | `/library/:id` | Yes | Unpublish own map |
| POST | `/library/:id/fork` | Yes | Fork into user's workspace |
| POST | `/library/:id/rate` | Yes | Rate 1-5 (upsert) |
| GET | `/library/categories` | No | List categories with counts |

### Phase 10 — Validation Tests

| # | Test | How to Verify | Pass Criteria |
|---|------|---------------|---------------|
| 10.1 | Migration runs | Run migration SQL against DB | Tables `published_maps`, `map_ratings`, `map_forks` exist with correct columns and indexes. |
| 10.2 | Publish a map | `POST /library` with valid cloud map ID + metadata | Returns 201 with published map object. Row exists in `published_maps`. |
| 10.3 | Publish requires auth | `POST /library` without auth header | Returns 401. |
| 10.4 | Publish rejects non-cloud map | `POST /library` with a map ID that doesn't exist in `maps` table | Returns 404 or 400. |
| 10.5 | Browse library (no auth) | `GET /library` without auth | Returns 200 with paginated list. No auth required. |
| 10.6 | Browse with filters | `GET /library?category=study&sort=top-rated&page=1` | Returns filtered, sorted results with correct pagination metadata. |
| 10.7 | Search works | `GET /library?search=AWS` | Returns maps with "AWS" in title, description, or tags. |
| 10.8 | Get single map | `GET /library/:id` | Returns full map data + metadata. No auth required. |
| 10.9 | Rate a map | `POST /library/:id/rate` with `{ rating: 4 }` | Returns 200. `map_ratings` row created. `published_maps.rating_avg` and `rating_count` updated. |
| 10.10 | Rate is idempotent | Rate same map twice with different value | Only one row in `map_ratings`. `rating_avg` reflects new value. |
| 10.11 | Fork a map | `POST /library/:id/fork` as authenticated user | New map created in user's `maps` table. `map_forks` row created. `fork_count` incremented on published map. |
| 10.12 | Fork counts toward cloud limit | Fork as free user who already has 1 cloud map | Fork still succeeds (creates local map) OR returns 403 if it creates a cloud map. Define behavior. |
| 10.13 | Unpublish own map | `DELETE /library/:id` as the author | Map removed from `published_maps`. Ratings and forks remain in history. |
| 10.14 | Cannot unpublish others' maps | `DELETE /library/:id` as different user | Returns 403. |
| 10.15 | Rate limiting works | Send 40 rating requests rapidly | Rate limiter kicks in after threshold. Returns 429. |
| 10.16 | Update published map | `PUT /library/:id` with new description/tags | Returns 200. Updated fields reflect in DB. |

---

## Phase 11 — Public Library Frontend

**Effort**: ~1-2 weeks | **Branch**: `feature/phase-11-library-frontend`

### New Components
- `LibraryPage` — browse grid with search, filter, sort
- `LibraryCard` — title, author, rating, forks, category
- `LibraryMapView` — read-only map + rating widget + fork button
- `PublishModal` — title, description, category, tags inputs
- `RatingWidget` — clickable 5-star rating

### Navigation
- Dashboard header: "Library" link added
- Editor header: "Publish" button next to Share

### Phase 11 — Validation Tests

| # | Test | How to Verify | Pass Criteria |
|---|------|---------------|---------------|
| 11.1 | Library page loads | Navigate to `/library` | Page renders with grid layout, search bar, category filters, sort dropdown. |
| 11.2 | Library accessible without login | Open `/library` in incognito | Page loads and shows published maps. No auth required. |
| 11.3 | Search filters results | Type "AWS" in search bar | Grid updates to show only matching maps. |
| 11.4 | Category filter works | Click a category chip | Grid shows only maps in that category. |
| 11.5 | Sort works | Change sort to "Top Rated" | Maps reorder by rating descending. |
| 11.6 | Library card displays correctly | View any library card | Shows title, author name, star rating, fork count, node count, category tag. |
| 11.7 | Click card opens map view | Click a library card | Navigates to LibraryMapView with full read-only map rendering. |
| 11.8 | Rating widget (signed in) | Click stars on a map view | Rating submits. Stars update to reflect selection. |
| 11.9 | Rating widget (anonymous) | View rating widget without login | Shows "Sign in to rate" prompt. Stars not clickable. |
| 11.10 | Fork button works | Click "Fork this map" while signed in | Map cloned to user's workspace. Redirects to editor with forked map. |
| 11.11 | Fork count updates | Fork a map, return to library | Fork count on the card increments by 1. |
| 11.12 | Publish flow | Open editor, click "Publish" button | PublishModal opens with title pre-filled, description/category/tags fields. |
| 11.13 | Publish requires sign-in | Click Publish as anonymous user | Sign-in prompt appears. |
| 11.14 | Publish free user | Click Publish as free signed-in user | Publish succeeds (free users CAN publish — this is the growth engine). |
| 11.15 | Published map appears in library | After publishing, navigate to `/library` | New map appears in the grid. |
| 11.16 | Unpublish from editor | Open editor for published map, click unpublish | Map removed from library. |
| 11.17 | Dashboard "Library" link | Open dashboard | "Library" link visible in header nav. Clicking navigates to `/library`. |
| 11.18 | Pagination works | Library has >20 maps | Pagination controls appear. Navigating pages loads new results. |
| 11.19 | Empty library state | Library has 0 published maps | Friendly empty state: "No maps yet. Be the first to publish!" |

---

## Phase 12 — Version History (Pro Feature)

**Effort**: ~1 week | **Branch**: `feature/phase-12-version-history`

### Backend
- `map_versions` table — snapshot per cloud save, auto-prune at 50
- `GET /mindmaps/:id/versions` — list (Pro-only)
- `GET /mindmaps/:id/versions/:versionId` — full data (Pro-only)
- `POST /mindmaps/:id/versions/:versionId/restore` — restore (Pro-only)

### Frontend
- "History" button in editor toolbar (clock icon)
- History panel with version timeline
- Preview + restore functionality
- Free users see grayed-out button with "Pro" badge

### Phase 12 — Validation Tests

| # | Test | How to Verify | Pass Criteria |
|---|------|---------------|---------------|
| 12.1 | Migration runs | Run migration SQL | `map_versions` table exists with correct schema and indexes. |
| 12.2 | Versions auto-created | As Pro user, edit and save a cloud map 3 times | 3 rows in `map_versions` for that map. Each has correct data snapshot. |
| 12.3 | Version list (Pro) | `GET /mindmaps/:id/versions` as Pro | Returns list of versions with id, version_number, node_count, created_at. |
| 12.4 | Version list (free) | `GET /mindmaps/:id/versions` as free user | Returns 403 with `PRO_REQUIRED` code. |
| 12.5 | Version detail | `GET /mindmaps/:id/versions/:versionId` as Pro | Returns full map data snapshot for that version. |
| 12.6 | Restore version | `POST /mindmaps/:id/versions/:versionId/restore` as Pro | Current map data replaced with version snapshot. New version created for the pre-restore state. |
| 12.7 | Auto-prune at 50 | Save a map 55 times | Only 50 versions remain. Oldest 5 pruned. |
| 12.8 | History button (Pro) | Open editor as Pro user | Clock icon visible in toolbar. Clicking opens history panel. |
| 12.9 | History button (free) | Open editor as free user | Clock icon grayed out with "Pro" badge. Clicking opens upgrade modal. |
| 12.10 | Version preview | Click a version in history panel | Map preview shows the map at that point in time (read-only overlay). |
| 12.11 | Restore from UI | Click "Restore" on a version | Map updates to that version's state. Confirmation dialog first. |
| 12.12 | Local maps have no versions | Open a local-only map | History button disabled or hidden (versions only apply to cloud maps). |

---

## Phase 13 — Node Sizing Presets

**Effort**: ~1 day | **Branch**: `feature/phase-13-node-sizing`

### Overview
Add 5 predetermined size presets (XS, S, M, L, XL) so users can control node visual hierarchy independent of tree depth. LLM-generated maps can also convey importance through sizing. No backend changes needed — the `size` field is stored in the existing JSONB blob.

### Subtasks
- 13.1 Add `NodeSize` type and `size?` field to `Node` interface
- 13.2 Add `NODE_SIZE_PRESETS` to `nodeHierarchy.ts`, update `getNodeVisualProperties` and `getLinkEndpoint`
- 13.3 Add size selector UI (Auto/XS/S/M/L/XL) to NodeEditModal
- 13.4 Update MindMapCanvas to pass `node.size` to all visual property calls
- 13.5 Update LibraryMapView and SharedMap to respect node sizes
- 13.6 Add sizes to built-in templates (root=xl, branches=lg)
- 13.7 Update LLM prompt template with size field and guidelines

### Phase 13 — Validation Tests

| # | Test | How to Verify | Pass Criteria |
|---|------|---------------|---------------|
| 13.1 | Size selector in edit modal | Double-click a node | Modal shows Auto/XS/S/M/L/XL pill buttons below text input. |
| 13.2 | Size changes node dimensions | Set a node to XL, save | Node visibly larger than default. Action buttons reposition correctly. |
| 13.3 | Auto size = depth-based | Set a node to Auto (default) | Node size matches hierarchy depth as before. |
| 13.4 | Size persists | Set size, reload page | Node retains its size after save/reload. |
| 13.5 | JSON import with size | Import JSON with `"size": "xl"` on a node | Node renders at XL dimensions. |
| 13.6 | Templates use sizes | Load "Project Planning" template | Root node is XL, primary branches are LG. |
| 13.7 | Links connect to sized nodes | Create nodes of different sizes, link them | Links connect cleanly to rect edges regardless of size. |
| 13.8 | Library/Shared views | View a map with sized nodes in library or shared view | Sized nodes render correctly in read-only views. |
| 13.9 | LLM prompt includes size | Open `/LLM_MIND_MAP_PROMPT.md` | JSON example shows `"size"` field. Guidelines explain size values. |

---

## Phase 14 — Ad Integration

**Effort**: ~1 week | **Branch**: `feature/phase-14-ads`

### Placement
- Dashboard: banner below map grid
- Library browse: ad card every 8th position
- Library map view: banner below viewer
- Editor: NO ADS (sacred space)
- Pro users: NO ADS (perk)

### Phase 14 — Validation Tests

| # | Test | How to Verify | Pass Criteria |
|---|------|---------------|---------------|
| 14.1 | Free user sees dashboard ad | Log in as free user, open dashboard | Ad banner visible below map grid. |
| 14.2 | Pro user sees no ads | Log in as Pro, open dashboard | No ad banner anywhere. |
| 14.3 | Library ad cards | Browse `/library` as free user | Ad card appears every 8th position in grid. |
| 14.4 | Editor is ad-free | Open editor as free user | No ads anywhere in the editor. |
| 14.5 | Anonymous user sees ads | Browse dashboard/library without login | Ads appear normally. |
| 14.6 | Ad failure fallback | Block ad script in DevTools | Ad slot shows "Upgrade to Pro for ad-free experience" instead of blank space. |
| 14.7 | No layout shift | Load dashboard, watch for CLS | Ad container has fixed dimensions. No content jump on ad load. |
| 14.8 | Ads lazy-load | Check network tab on initial page load | Ad scripts load after primary content (not blocking). |

---

## Phase 15 — Real-Time Collaboration

**Effort**: ~2-3 months | **Branch**: `feature/phase-15-realtime-collab`

### Architecture
- WebSocket server (Socket.io)
- OT or CRDT for conflict resolution
- Cursor presence
- Teams billing tier ($15/user/month)

### Phase 15 — Validation Tests

| # | Test | How to Verify | Pass Criteria |
|---|------|---------------|---------------|
| 15.1 | WebSocket connects | Open map in two browsers as same team | Both clients connect to WS. Presence panel shows 2 users. |
| 15.2 | Cursor presence | Move mouse in browser A | Browser B shows User A's cursor with name label, updated in real-time. |
| 15.3 | Node add syncs | Add a node in browser A | Node appears in browser B within 500ms. |
| 15.4 | Node edit syncs | Edit node text in browser A | Updated text appears in browser B within 500ms. |
| 15.5 | Node move syncs | Drag node in browser A | Node moves in browser B in real-time. |
| 15.6 | Node delete syncs | Delete node in browser A | Node disappears in browser B. |
| 15.7 | Conflict resolution | Both users edit same node simultaneously | One edit wins cleanly. No data corruption. Both users see consistent state. |
| 15.8 | Disconnect/reconnect | Kill network on browser A, restore after 10s | Browser A reconnects, syncs missed changes, no data loss. |
| 15.9 | Invite collaborator | Map owner sends invite link/email | Invitee can open map and edit. |
| 15.10 | Permission enforcement | Non-invited user tries to open collab map | Access denied. |
| 15.11 | Teams billing | Subscribe to Teams tier | Per-seat billing works. Adding/removing seats updates Stripe subscription. |
| 15.12 | Solo user can't collab | Pro (non-Teams) user tries to invite | Feature locked behind Teams tier. Upgrade prompt shown. |

---

## Phase 16 — Full Feature Testing & Documentation

**Effort**: ~1-2 days | **Branch**: `feature/phase-16-testing`

### Goal
Run every manual and automated test across the entire application. Update test documentation to reflect the current state: new features from Phases 13-15 (node sizing, ads, real-time collab), fix any broken tests, and produce a go/no-go report for launch readiness.

### Subtasks

#### 16.1 Update FEATURE_TESTING_CHECKLIST.md
- Add Phase 13 items (node sizing presets)
- Add Phase 14 items (ad integration)
- Update Phase 15 collab section with note sync, expansion sync, canvas background sync
- Update AUTO/MANUAL counts to reflect current state
- Remove any test cases for features that changed or were cut

#### 16.2 Update TESTING_REPORT
- Update total test count (was 154, now 431+)
- Update coverage areas and recent improvements
- Document any known gaps or flaky tests

#### 16.3 Run Full Automated Test Suite
- `npm run test:ci` — all tests pass
- `npm run build` — clean production build
- `npm run typecheck` — no TypeScript errors
- `npm run lint` — no lint errors
- Document results

#### 16.4 Execute ALL Manual Tests
Run through every `[MANUAL]` test in the checklist. For each:
- Record PASS/FAIL
- Note any issues discovered
- File bugs as needed

**Manual Test Areas:**
- Anonymous visitor flows (landing, library browsing, signup)
- Free user flows (dashboard, editor, export, cloud sync, library contributing)
- Pro user flows (payment, unlimited cloud, premium exports, sharing, version history)
- Edge cases (responsive layout, offline, large maps, navigation)
- Real-time collaboration (connection, presence, syncing, cursors, invites, notes)

#### 16.5 Fix Discovered Issues
- Create branches for any bugs found during testing
- Prioritize: P0 (blocking) → P1 (degraded experience) → P2 (cosmetic)

#### 16.6 Update NOTES_TESTING_STRATEGY.md
- Reconcile with current test coverage
- Update performance benchmarks if targets changed

### Phase 16 — Validation Tests

| # | Test | How to Verify | Pass Criteria |
|---|------|---------------|---------------|
| 16.1 | All automated tests pass | `npm run test:ci` | 431+ tests pass, 0 failures |
| 16.2 | Build succeeds | `npm run build` | Clean build, no errors |
| 16.3 | TypeScript clean | `npm run typecheck` | 0 errors |
| 16.4 | Lint clean | `npm run lint` | 0 errors (warnings OK) |
| 16.5 | All MANUAL tests executed | Run through checklist | Every [MANUAL] item has PASS/FAIL recorded |
| 16.6 | Feature checklist updated | Review FEATURE_TESTING_CHECKLIST.md | Reflects all features through Phase 15, correct AUTO/MANUAL counts |
| 16.7 | Testing report updated | Review TESTING_REPORT | Current test count, coverage areas, known issues documented |
| 16.8 | No P0 bugs remain | Review bug list | All blocking issues fixed |

---

## Phase 17 — Marketing Strategy & Growth to First 20 Users

**Effort**: ~1 week | **Branch**: `feature/phase-17-marketing`

### Goal
Evaluate the current monetization model, research the competitive landscape, and execute a concrete plan to acquire the first 20 active users. This is not about code — it's about positioning, distribution, and getting real humans to try the product.

### Subtasks

#### 17.1 Competitive Analysis
- Map the mind mapping tool landscape: MindMeister, Miro, Coggle, Whimsical, XMind, Markmap
- Identify ThoughtNet's differentiators (free public library, fork/rate ecosystem, in-browser with no install)
- Document gaps vs competitors

#### 17.2 Evaluate Current Monetization Model
- **Google AdSense revenue analysis**: estimate RPM for productivity SaaS traffic, project revenue at 100/1K/10K MAU
- **Subscription model health check**: is $3/mo competitive? Should Pro be cheaper or more valuable?
- **Freemium balance**: is the free tier too generous or too restrictive?
- **Recommendation**: ads-first, subscription-first, or hybrid? What mix maximizes revenue at small scale?

#### 17.3 SEO & Content Strategy
- Identify high-value keywords: "free mind map tool", "online mind mapping", "collaborative mind map"
- Audit current landing page for SEO (meta tags, structured data, page speed)
- Plan 5-10 blog posts or landing pages targeting long-tail keywords
- Set up Google Search Console and submit sitemap

#### 17.4 Launch Channels (Free)
- **Product Hunt**: prepare launch assets (tagline, description, screenshots, maker story)
- **Reddit**: identify relevant subreddits (r/productivity, r/GetStudying, r/webdev, r/SideProject)
- **Hacker News**: craft Show HN post
- **Twitter/X**: create product account, post launch thread
- **Dev.to / Hashnode**: write "I built a collaborative mind mapping tool" post

#### 17.5 Launch Channels (Paid — if budget allows)
- Google Ads: estimate CPC for "mind map tool" keywords, project CAC vs LTV
- Should we run ads at this stage? (usually no — organic first, paid at scale)

#### 17.6 Community & Feedback Loop
- Add feedback mechanism in-app (simple "Send Feedback" link → email or form)
- Seed the public library with 10-20 high-quality template maps (study guides, project plans, brainstorm frameworks)
- Engage first users personally — respond to every piece of feedback

#### 17.7 Analytics & Measurement
- Verify Google Analytics / Plausible is tracking key events:
  - Signups, map creates, cloud saves, exports, library publishes, Pro conversions
- Define success metrics for first 30 days post-launch:
  - 20 signups
  - 5 maps published to library
  - 1 Pro conversion

#### 17.8 Pricing & Positioning Recommendation
- Write a 1-page recommendation:
  - Keep/change Pro price?
  - Add a Teams tier now or later?
  - Ad revenue realistic or just supplemental?
  - Best channel for first 20 users

### Phase 17 — Validation Tests

| # | Test | How to Verify | Pass Criteria |
|---|------|---------------|---------------|
| 17.1 | Competitive analysis documented | Review docs/COMPETITIVE_ANALYSIS.md | 5+ competitors mapped with feature comparison matrix |
| 17.2 | Monetization recommendation | Review docs/MONETIZATION_STRATEGY.md | Clear recommendation with projected numbers at 100/1K/10K MAU |
| 17.3 | SEO audit complete | Review landing page and Search Console | Meta tags present, sitemap submitted, page speed >90 on Lighthouse |
| 17.4 | Launch assets ready | Review launch checklist | Product Hunt listing draft, Reddit post draft, screenshots, tagline |
| 17.5 | Library seeded | Browse `/library` | 10+ high-quality template maps published |
| 17.6 | Analytics tracking | Check analytics dashboard | Key events (signup, create, publish, convert) firing correctly |
| 17.7 | Feedback mechanism | Click feedback link in-app | Opens email/form, works for all user types |
| 17.8 | Strategy doc complete | Review docs/MARKETING_STRATEGY.md | Concrete 30-day launch plan with channel priorities and success metrics |

---

## Execution Rules

1. **One phase at a time.** Complete all subtasks and pass all validation tests before moving to next phase.
2. **Each phase gets its own feature branch** and PR to main.
3. **Parallel where possible**: Phases 10+11 (library) and Phase 12 (version history) can overlap since they don't depend on each other.
4. **Every subtask is tested** before marking the phase complete.
5. **Backend changes require ECR deploy + App Runner update** before frontend validation.
6. **Frontend changes deploy via Amplify** on merge to main.
