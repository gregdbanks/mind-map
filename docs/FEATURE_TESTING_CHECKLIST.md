# ThoughtNet — Feature Testing Checklist

A product-level checklist for validating all user-facing features. Use this before each release to ensure nothing is broken.

---

## First Impressions (Logged Out)
- [ ] Visit the site — landing page shows with hero, features, and "Get Started" button
- [ ] Click "Get Started" — navigates to signup
- [ ] Click the ThoughtNet logo in the landing header — stays on landing page
- [ ] Browse the public library without an account — maps load, search and filters work
- [ ] Open a library map — can view it read-only, see rating and node count
- [ ] Try to fork or rate a library map — prompted to sign in

## Account & Auth
- [ ] Sign up with email and password — account created, redirected to dashboard
- [ ] Log out — returns to landing page
- [ ] Log back in — returns to dashboard with your maps
- [ ] Forgot password flow — receive reset email and successfully reset
- [ ] Close the browser, reopen — session persists (no re-login needed)

## Dashboard
- [ ] Dashboard loads with your saved maps listed
- [ ] "New Map" creates a blank map and opens the editor
- [ ] "Templates" button opens modal with 6 templates to choose from
- [ ] Select a template and click "Use Template" — new map opens pre-populated
- [ ] Download a template JSON file from the template modal
- [ ] Import a JSON file — new map appears on dashboard
- [ ] Delete a map from dashboard — map removed, confirm it doesn't break anything else
- [ ] "Library" link in header navigates to the public library
- [ ] House ad banner appears for free users, can be dismissed with X

## Mind Map Editor
- [ ] Nodes render on canvas with connecting lines
- [ ] Click a node to select it — blue highlight appears
- [ ] Click empty canvas — node deselects
- [ ] Double-click a node to edit its text — type new text, click away to save
- [ ] Press Enter with a node selected — creates a child node
- [ ] Press Tab — creates a sibling node
- [ ] Press Delete/Backspace — deletes the selected node (not the root)
- [ ] Drag a node — it moves smoothly, connections follow
- [ ] Undo (Ctrl/Cmd+Z) — reverts last action
- [ ] Redo (Ctrl/Cmd+Shift+Z) — restores undone action
- [ ] Collapse a node's children — children hide, expand brings them back
- [ ] Zoom in/out with scroll wheel — canvas scales smoothly
- [ ] "Fit to View" button — all nodes fit on screen, no node selected
- [ ] Add notes to a node — notes modal opens, text saves
- [ ] Change node color — color picker works, color persists

## Search
- [ ] Open search (Ctrl/Cmd+F or search icon)
- [ ] Type a node title — matching nodes appear in results
- [ ] Type text that only exists in a node's notes — note match appears with snippet and file icon
- [ ] Click a search result — canvas pans to that node and selects it

## Editor Header (Responsive)
- [ ] At full width — all buttons visible with labels
- [ ] Resize to tablet (~768px) — buttons shrink, some labels hide
- [ ] Resize to phone (~480px) — further collapse, title truncates
- [ ] Resize to small phone (~360px) — minimal layout, core actions still accessible

## Export
- [ ] Export as JSON — file downloads, can be re-imported
- [ ] Export as PNG — image downloads with all visible nodes
- [ ] Export as SVG — vector file downloads
- [ ] Export as PDF — document downloads
- [ ] Export as Markdown — text file with hierarchy preserved

## Cloud Sync (Free: 1 map, Pro: unlimited)
- [ ] "Save to Cloud" on a map — uploads successfully
- [ ] Close browser, reopen, open the same map — cloud data loads
- [ ] As a free user, try saving a second map to cloud — blocked with upgrade prompt
- [ ] Edit a cloud-saved map — changes auto-save after initial cloud save

## Sharing
- [ ] Click "Share" on a map — share modal opens
- [ ] Toggle public link on — generates a shareable URL
- [ ] Open the share link in an incognito window — map displays read-only
- [ ] Toggle public link off — link stops working

## Public Library
- [ ] Browse library — grid of published maps loads
- [ ] Search by keyword — results filter in real time
- [ ] Filter by category — only matching maps show
- [ ] Sort by newest / highest rated / most forked
- [ ] Pagination — navigate between pages if enough maps exist
- [ ] Open a published map — full read-only view with metadata
- [ ] Rate a map (1-5 stars) — rating registers, average updates
- [ ] Change your rating — updates correctly
- [ ] Fork a map — copy appears in your dashboard, opens in editor
- [ ] Publish one of your maps — fill in title, description, category, tags
- [ ] Update a published map's details
- [ ] Unpublish a map — removed from library
- [ ] Delete a local map that was published — library entry survives
- [ ] House ad banner shows below library filters for free users

## Stripe & Pro Upgrade
- [ ] Click "Upgrade to Pro" — Stripe checkout opens
- [ ] Complete payment with test card — redirected back, plan shows as Pro
- [ ] Pro badge appears in the editor header
- [ ] Cloud save limit removed (can save multiple maps)
- [ ] Pro export features unlocked
- [ ] Cancel subscription — plan reverts to free at period end
- [ ] Upgrade modal appears when hitting free-tier limits

## Edge Cases
- [ ] Offline usage — can create and edit maps locally without internet
- [ ] Very large map (50+ nodes) — no lag during drag or edit
- [ ] Rapid clicking — no duplicate nodes or broken state
- [ ] Browser back/forward buttons — navigate correctly between dashboard and editor
- [ ] Refresh the editor page — map reloads from last saved state
