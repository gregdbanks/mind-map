# ThoughtNet — Feature Testing Checklist

A product-level checklist for validating all user-facing features. Use this before each release to ensure nothing is broken.

**Legend:**
- `[AUTO]` — Covered by automated tests (unit or E2E). Verify these still pass with `npm run test:ci`.
- `[MANUAL]` — Requires manual testing. No automated coverage exists.

---

## First Impressions (Logged Out)
- [AUTO] Visit the site — landing page shows with hero, features, and "Get Started" button
- [AUTO] Click "Get Started" — navigates to signup
- [AUTO] Click the ThoughtNet logo in the landing header — stays on landing page
- [MANUAL] Browse the public library without an account — maps load, search and filters work
- [MANUAL] Open a library map — can view it read-only, see rating and node count
- [MANUAL] Try to fork or rate a library map — prompted to sign in

## Account & Auth
- [MANUAL] Sign up with email and password — account created, redirected to dashboard
- [MANUAL] Log out — returns to landing page
- [AUTO] Log back in — form renders with fields, error handling, loading state
- [MANUAL] Forgot password flow — receive reset email and successfully reset
- [MANUAL] Close the browser, reopen — session persists (no re-login needed)

## Dashboard
- [AUTO] Dashboard loads with your saved maps listed
- [MANUAL] "New Map" creates a blank map and opens the editor
- [AUTO] "Templates" button opens modal with 6 templates to choose from
- [AUTO] Select a template and click "Use Template" — new map opens pre-populated
- [MANUAL] Download a template JSON file from the template modal
- [MANUAL] Import a JSON file — new map appears on dashboard
- [AUTO] Delete a map from dashboard — two-click confirmation, map removed
- [MANUAL] "Library" link in header navigates to the public library
- [AUTO] House ad banner appears for free users, can be dismissed with X

## Mind Map Editor
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

## Search
- [AUTO] Open search (Ctrl/Cmd+F or search icon)
- [AUTO] Type a node title — matching nodes appear in results
- [AUTO] Type text that only exists in a node's notes — note match appears with snippet and file icon
- [AUTO] Click a search result — calls select handler with node ID
- [MANUAL] Click a search result — canvas pans to that node visually

## Editor Header (Responsive)
- [MANUAL] At full width — all buttons visible with labels
- [MANUAL] Resize to tablet (~768px) — buttons shrink, some labels hide
- [MANUAL] Resize to phone (~480px) — further collapse, title truncates
- [MANUAL] Resize to small phone (~360px) — minimal layout, core actions still accessible

## Export
- [AUTO] Export as JSON — file downloads, can be re-imported
- [AUTO] Export as PNG — Pro gating works, dropdown option renders
- [AUTO] Export as SVG — Pro gating works, dropdown option renders
- [AUTO] Export as PDF — Pro gating works, dropdown option renders
- [AUTO] Export as Markdown — hierarchy converted correctly, file generated
- [MANUAL] Export files open correctly in external programs

## Cloud Sync (Free: 1 map, Pro: unlimited)
- [MANUAL] "Save to Cloud" on a map — uploads successfully
- [MANUAL] Close browser, reopen, open the same map — cloud data loads
- [MANUAL] As a free user, try saving a second map to cloud — blocked with upgrade prompt
- [MANUAL] Edit a cloud-saved map — changes auto-save after initial cloud save

## Sharing
- [MANUAL] Click "Share" on a map — share modal opens
- [MANUAL] Toggle public link on — generates a shareable URL
- [MANUAL] Open the share link in an incognito window — map displays read-only
- [MANUAL] Toggle public link off — link stops working

## Public Library
- [MANUAL] Browse library — grid of published maps loads
- [MANUAL] Search by keyword — results filter in real time
- [MANUAL] Filter by category — only matching maps show
- [MANUAL] Sort by newest / highest rated / most forked
- [MANUAL] Pagination — navigate between pages if enough maps exist
- [MANUAL] Open a published map — full read-only view with metadata
- [AUTO] Rate a map (1-5 stars) — widget renders, click calls handler, display updates
- [MANUAL] Change your rating — updates correctly on server
- [MANUAL] Fork a map — copy appears in your dashboard, opens in editor
- [MANUAL] Publish one of your maps — fill in title, description, category, tags
- [MANUAL] Update a published map's details
- [MANUAL] Unpublish a map — removed from library
- [MANUAL] Delete a local map that was published — library entry survives
- [AUTO] House ad banner shows below library filters for free users

## Stripe & Pro Upgrade
- [MANUAL] Click "Upgrade to Pro" — Stripe checkout opens
- [MANUAL] Complete payment with test card — redirected back, plan shows as Pro
- [MANUAL] Pro badge appears in the editor header
- [MANUAL] Cloud save limit removed (can save multiple maps)
- [AUTO] Pro export features unlocked — upgrade modal shown for free users on locked formats
- [MANUAL] Cancel subscription — plan reverts to free at period end
- [MANUAL] Upgrade modal appears when hitting free-tier limits

## Edge Cases
- [MANUAL] Offline usage — can create and edit maps locally without internet
- [MANUAL] Very large map (50+ nodes) — no lag during drag or edit
- [MANUAL] Rapid clicking — no duplicate nodes or broken state
- [MANUAL] Browser back/forward buttons — navigate correctly between dashboard and editor
- [AUTO] Refresh the editor page — map reloads from last saved state
