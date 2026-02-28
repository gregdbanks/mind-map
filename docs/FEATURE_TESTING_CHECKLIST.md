# ThoughtNet — Feature Testing Checklist

A product-level checklist for validating all user-facing features. Use this before each release to ensure nothing is broken.

**Legend:**
- `[AUTO]` — Covered by automated tests (unit or E2E). Verify these still pass with `npm run test:ci`.
- `[MANUAL]` — Requires manual testing. No automated coverage exists.

**Coverage:** 62 AUTO / 44 MANUAL (106 total test cases)

---

## 1. Anonymous Visitor (Logged Out)

Everything a first-time visitor or non-authenticated user can do.

### Landing Page
- [AUTO] Visit the site — landing page shows with hero, features, and "Get Started" button
- [AUTO] Click "Get Started" — navigates to signup
- [AUTO] Click the ThoughtNet logo in the landing header — stays on landing page

### Public Library (Browsing)
- [AUTO] Browse the public library without an account — maps load, search and filters work
- [AUTO] Search by keyword — results filter in real time
- [AUTO] Filter by category — only matching maps show
- [AUTO] Sort by newest / highest rated / most forked
- [AUTO] Pagination — navigate between pages if enough maps exist
- [AUTO] Open a published map — full read-only view with metadata
- [AUTO] Try to fork or rate a library map — prompted to sign in
- [AUTO] House ad banner shows below library filters for free users

### Account Creation & Recovery
- [AUTO] Sign up with email and password — account created, redirected to dashboard
- [AUTO] Log back in — form renders with fields, error handling, loading state
- [AUTO] Forgot password flow — receive reset email and successfully reset
- [MANUAL] Close the browser, reopen — session persists (no re-login needed)

---

## 2. Free User (Authenticated, Free Plan)

Core features available to all signed-in users on the free plan.

### Dashboard
- [AUTO] Dashboard loads with your saved maps listed
- [AUTO] "New Map" creates a blank map and opens the editor
- [AUTO] "Templates" button opens modal with 6 templates to choose from
- [AUTO] Select a template and click "Use Template" — new map opens pre-populated
- [AUTO] Download a template JSON file from the template modal
- [AUTO] Import a JSON file — new map appears on dashboard
- [AUTO] Delete a map from dashboard — two-click confirmation, map removed
- [AUTO] "Library" link in header navigates to the public library
- [AUTO] House ad banner appears for free users, can be dismissed with X

### Mind Map Editor
- [AUTO] Nodes render on canvas with connecting lines
- [AUTO] Click a node to select it — blue highlight appears
- [AUTO] Click empty canvas — node deselects
- [AUTO] Double-click a node to edit its text — type new text, click away to save
- [AUTO] Press Enter with a node selected — creates a child node
- [AUTO] Press Tab — creates a sibling node
- [AUTO] Press Delete/Backspace — deletes the selected node (not the root)
- [AUTO] Drag a node — it moves smoothly, connections follow
- [AUTO] Undo (Ctrl/Cmd+Z) — reverts last action
- [AUTO] Redo (Ctrl/Cmd+Shift+Z) — restores undone action
- [AUTO] Collapse a node's children — children hide, expand brings them back
- [AUTO] Zoom in/out with scroll wheel — canvas scales smoothly
- [MANUAL] "Fit to View" button — all nodes fit on screen, no node selected
- [AUTO] Add notes to a node — notes modal opens, text saves
- [AUTO] Change node color — color picker renders, contrast logic correct

### Search
- [AUTO] Open search (Ctrl/Cmd+F or search icon)
- [AUTO] Type a node title — matching nodes appear in results
- [AUTO] Type text that only exists in a node's notes — note match appears with snippet and file icon
- [AUTO] Click a search result — calls select handler with node ID
- [MANUAL] Click a search result — canvas pans to that node visually

### Export
- [AUTO] Export as JSON — file downloads, can be re-imported
- [AUTO] Locked export formats (PNG, SVG, PDF, Markdown) show Pro badge and trigger upgrade prompt
- [MANUAL] Exported JSON file opens correctly in external programs

### Cloud Sync (1 map limit)
- [MANUAL] "Save to Cloud" on a map — uploads successfully
- [MANUAL] Close browser, reopen, open the same map — cloud data loads
- [AUTO] As a free user, try saving a second map to cloud — blocked with upgrade prompt
- [MANUAL] Edit a cloud-saved map — changes auto-save after initial cloud save

### Public Library (Contributing)
- [AUTO] Rate a map (1-5 stars) — widget renders, click calls handler, display updates
- [MANUAL] Change your rating — updates correctly on server
- [AUTO] Fork a map — copy appears in your dashboard, opens in editor
- [AUTO] Publish one of your maps — fill in title, description, category, tags
- [MANUAL] Update a published map's details
- [MANUAL] Unpublish a map — removed from library
- [MANUAL] Delete a local map that was published — library entry survives

### Upgrade Prompts
- [AUTO] Click "Upgrade to Pro" — Stripe checkout opens
- [AUTO] Pro export features unlocked — upgrade modal shown for free users on locked formats
- [AUTO] Upgrade modal appears when hitting free-tier limits

### Auth & Session
- [AUTO] Log out — returns to landing page
- [AUTO] Refresh the editor page — map reloads from last saved state

---

## 3. Pro User (Authenticated, Pro Plan)

Features unlocked by the Pro subscription.

### Payment & Subscription
- [MANUAL] Complete payment with test card — redirected back, plan shows as Pro
- [AUTO] Pro badge appears in the editor header
- [MANUAL] Cancel subscription — plan reverts to free at period end

### Cloud Sync (Unlimited)
- [MANUAL] Cloud save limit removed (can save multiple maps)

### Export (Pro Formats)
- [AUTO] Export as PNG — dropdown option renders, export works
- [AUTO] Export as SVG — dropdown option renders, export works
- [AUTO] Export as PDF — dropdown option renders, export works
- [AUTO] Export as Markdown — hierarchy converted correctly, file generated
- [MANUAL] Exported files open correctly in external programs

### Sharing
- [AUTO] Click "Share" on a map — share modal opens
- [AUTO] Toggle public link on — generates a shareable URL
- [MANUAL] Open the share link in an incognito window — map displays read-only
- [AUTO] Toggle public link off — link stops working

---

## 4. Edge Cases & Resilience

Cross-cutting concerns that apply regardless of user type.

### Responsive Layout (Editor Header)
- [MANUAL] At full width — all buttons visible with labels
- [MANUAL] Resize to tablet (~768px) — buttons shrink, some labels hide
- [MANUAL] Resize to phone (~480px) — further collapse, title truncates
- [MANUAL] Resize to small phone (~360px) — minimal layout, core actions still accessible

### Performance & Stability
- [MANUAL] Offline usage — can create and edit maps locally without internet
- [MANUAL] Very large map (50+ nodes) — no lag during drag or edit
- [MANUAL] Rapid clicking — no duplicate nodes or broken state

### Navigation
- [MANUAL] Browser back/forward buttons — navigate correctly between dashboard and editor

---

## 5. Real-Time Collaboration (Pro Plan)

Features for simultaneous multi-user editing on the same mind map.

### Connection & Presence
- [MANUAL] Open a map as a Pro user — connection indicator (green dot) appears in header
- [MANUAL] Open same map in a second browser/tab — presence panel shows both users with colored dots
- [MANUAL] Close one tab — remaining tab's presence panel updates to show 1 user

### Real-Time Syncing
- [MANUAL] Add a node in Tab A — node appears in Tab B within 500ms
- [MANUAL] Edit a node's text in Tab A — updated text appears in Tab B
- [MANUAL] Delete a node in Tab A — node disappears from Tab B
- [MANUAL] Drag a node in Tab A — node moves in real-time in Tab B (during drag, not just on drop)

### Note Syncing
- [MANUAL] User A expands a note — User B sees the note expand (accordion: only one at a time)
- [MANUAL] User A types in a note — content appears for User B after ~300ms (debounced)
- [MANUAL] User A deletes a note — note disappears for User B
- [MANUAL] Typing in a note does NOT clear content or lose focus
- [MANUAL] Existing notes load correctly when joining a collab session (from Yjs initial sync)

### Canvas Background Sync
- [MANUAL] User A changes canvas background (light/dark) — User B's background updates
- [MANUAL] Node colors adjust correctly to the synced background theme

### Cursor Presence
- [MANUAL] Move mouse in Tab A — colored cursor with username label appears in Tab B

### Conflict Resolution
- [MANUAL] Both users edit different properties of the same node simultaneously — both changes merge cleanly (Yjs CRDT)

### Collaboration Invites
- [MANUAL] Click "Invite" button as map owner — invite modal opens
- [MANUAL] Generate an invite link — link copies to clipboard
- [MANUAL] Open invite link in another browser session — invite accepted, map opens in editor
- [MANUAL] Non-invited user cannot join the collaboration room — access denied

### Disconnect & Reconnect
- [MANUAL] Disconnect network, make edits offline, reconnect — changes merge with remote edits

### Plan Gating
- [AUTO] Non-Pro user clicks "Invite" — upgrade modal shown
- [AUTO] Version History button shows "Pro" badge for free users
