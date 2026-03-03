# ThoughtNet — Pre-Launch Feature Testing Checklist

Use this checklist to verify all user-facing features before launch. Fill in the **Status** column as you test: `PASS`, `FAIL`, or `SKIP`.

**Automated coverage:** 442 unit/component tests + 37 E2E tests (across Chromium, Firefox, WebKit). Run `npm run test:ci` and `npx playwright test` to verify before manual testing.

**Legend:**
- **AUTO** — Covered by automated tests (unit, component, or E2E). Still worth a quick visual check.
- **MANUAL** — Requires real browser testing. No automated coverage for the full integration path.

**Date tested:** _______________ **Tester:** _______________ **Branch/Build:** _______________

---

## 1. Auth Flows

Cognito is mocked in tests — these need real browser verification.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 1.1 | Sign up with valid email/username/password — receive verification code | MANUAL | PASS | |
| 1.2 | Enter verification code — auto-login — redirected to dashboard | MANUAL | PASS | |
| 1.3 | Sign up with weak password — validation errors shown inline | MANUAL | PASS | |
| 1.4 | Sign up with existing email — appropriate error | MANUAL | PASS | |
| 1.5 | Login with valid credentials — dashboard loads | MANUAL | PASS | |
| 1.6 | Login with wrong password — error message shown | MANUAL | PASS | |
| 1.7 | Forgot password — enter username — receive code — reset — login | MANUAL | PASS | |
| 1.8 | Logout — redirected to landing, session cleared | AUTO | PASS | |
| 1.9 | Refresh page while logged in — session persists | MANUAL | PASS | |
| 1.10 | Visit /dashboard while logged out — redirected to landing | AUTO | | |

---

## 2. Dashboard & Map Management

Dashboard.test.tsx (12 tests) + MapCard.test.tsx (9 tests) cover rendering, creation, import, deletion, sync badges.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 2.1 | "New Map" creates blank map — opens in editor with root node | AUTO | | |
| 2.2 | "Templates" button opens modal — select template — map pre-populated | AUTO | | |
| 2.3 | Import JSON file — new map appears in dashboard, opens in editor | AUTO | | |
| 2.4 | Delete map from dashboard — two-click confirmation, removed from list | AUTO | | |
| 2.5 | Map cards show correct node count, dates, sync status badges | AUTO | | |
| 2.6 | Map card click navigates to editor | AUTO | | |
| 2.7 | Rename map inline on dashboard — title persists on reload | AUTO | PASS | E2E: dashboard-navigation |
| 2.8 | Dashboard merges local + cloud maps correctly | MANUAL | PASS | |
| 2.9 | "Library" link in header navigates to library page | AUTO | | |
| 2.10 | Profile dropdown shows when authenticated, sign-in link when not | AUTO | | |

---

## 3. Canvas & Node Operations

MindMapNode.test.tsx (15), NodeActions.test.tsx (8), NodeEditor.test.tsx (8), useMindMapOperations.test.tsx (23), useDragInteraction.test.tsx (9), MindMapCanvas.test.tsx (5) cover core node interactions.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 3.1 | Click node to select — blue highlight appears | AUTO | | |
| 3.2 | Click empty canvas — selection cleared | AUTO | | |
| 3.3 | Double-click node — edit modal opens | AUTO | | |
| 3.4 | Edit node text — Enter to save, Escape to cancel | AUTO | | |
| 3.5 | Add child node (Enter key or + button) | AUTO | | |
| 3.6 | Add sibling node (Tab key) | AUTO | | |
| 3.7 | Delete node (Delete key or X button) — children cascade deleted | AUTO | | |
| 3.8 | Delete confirmation dialog appears before deleting | AUTO | | |
| 3.9 | Change node color — color applies immediately | AUTO | | |
| 3.10 | Drag node — position updates, links follow smoothly | AUTO | | |
| 3.11 | Undo (Ctrl+Z) — last action reversed | AUTO | | |
| 3.12 | Redo (Ctrl+Y) — undone action restored | AUTO | | |
| 3.13 | Collapse/expand node children — toggle works, icon changes | AUTO | | |
| 3.14 | Canvas renders SVG with zoom behavior initialized | AUTO | | |
| 3.15 | Change node size (XS/S/M/L/XL) — rect resizes correctly | MANUAL | PASS | |
| 3.16 | Multi-select (Ctrl+click or marquee drag) — drag group together | MANUAL | PASS | |
| 3.17 | Spread/compress selected nodes (] / [) — spacing changes | MANUAL | PASS | |
| 3.18 | Zoom in/out (scroll wheel) — canvas scales smoothly | AUTO | PASS | E2E: canvas-interactions |
| 3.19 | Pan (Space+drag) — canvas pans | AUTO | PASS | E2E: canvas-interactions |
| 3.20 | Lines clip at node edges — no lines through nodes | MANUAL | PASS | |
| 3.21 | Nodes render on top of lines (z-order correct) | MANUAL | PASS | |

---

## 4. Layouts & Backgrounds

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 4.1 | Switch to each layout (Custom, Smart Radial, Tree, Compact Tree, Basic Radial, Force Physics) — nodes rearrange | AUTO | PASS | E2E: layouts-and-backgrounds |
| 4.2 | Layout preference persists across page reload | AUTO | PASS | E2E: layouts-and-backgrounds |
| 4.3 | Switch to each background (White, Light Gray, Warm Gray, Dark, Dot Grid, Dot Grid Dark, Line Grid) — canvas updates | AUTO | PASS | E2E: layouts-and-backgrounds |
| 4.4 | Background persists across reload | AUTO | PASS | E2E: layouts-and-backgrounds |
| 4.5 | Dark backgrounds — node text colors adjust for contrast | MANUAL | PASS | |

---

## 5. Notes

NotesModal.test.tsx (15 tests) covers modal open/close, save, delete, keyboard shortcuts, change tracking. useIndexedDBNotes.test.ts (8 tests) covers persistence.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 5.1 | Notes modal opens, shows existing note content | AUTO | | |
| 5.2 | Save note via button or Ctrl+S / Cmd+S | AUTO | | |
| 5.3 | Delete note — note removed | AUTO | | |
| 5.4 | Close modal with Escape key | AUTO | | |
| 5.5 | Unsaved changes — confirmation dialog before closing | AUTO | | |
| 5.6 | Note persists to IndexedDB — reload page, note still there | AUTO | | |
| 5.7 | Click note button on canvas — note expands inline | AUTO | PASS | E2E: notes-inline |
| 5.8 | Click same note button again — note collapses (toggle) | AUTO | PASS | E2E: notes-inline |
| 5.9 | Expand note A, then note B — A collapses (accordion) | AUTO | PASS | E2E: notes-inline |
| 5.10 | Rich text: bold, italic, headings, bulleted/ordered lists | MANUAL | PASS | |
| 5.11 | Add code block — syntax highlighting appears | MANUAL | PASS | Can't format code blocks |
| 5.12 | Note indicator (purple dot) shows on nodes with notes | MANUAL | PASS | |
| 5.13 | Edit button on expanded note — collapses note, opens edit modal | MANUAL | PASS | |
| 5.14 | Hold backspace in code block — no focus loss | MANUAL | PASS | |

---

## 6. Search

SearchBar.test.tsx (12 tests) covers rendering, node/note search, result selection, keyboard shortcuts.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 6.1 | Open search (Ctrl+F or search icon) — input focused | AUTO | | |
| 6.2 | Type node title — matching nodes appear in dropdown | AUTO | | |
| 6.3 | Type text from note content — note match with snippet shown | AUTO | | |
| 6.4 | Click result — selects the node | AUTO | | |
| 6.5 | Escape closes search dropdown | AUTO | | |
| 6.6 | Clear button resets search | AUTO | | |
| 6.7 | Click search result — canvas visually pans to that node | AUTO | PASS | E2E: canvas-interactions |

---

## 7. Cloud Sync

API calls are mocked in tests — these need real server verification.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 7.1 | "Save to Cloud" — sync badge changes to "synced" | MANUAL | | |
| 7.2 | Edit a cloud-saved map — auto-saves (status: saving → saved) | MANUAL | | |
| 7.3 | Open same map in incognito — data pulls from cloud correctly | MANUAL | | |
| 7.4 | Free user: 1 cloud save limit enforced, upgrade prompt shown | AUTO | | |
| 7.5 | Pro user: unlimited cloud saves work | MANUAL | | |
| 7.6 | Go offline → edit → go online → syncs to cloud | MANUAL | | |
| 7.7 | Delete cloud map — removed from server and dashboard | MANUAL | | |

---

## 8. Editor Header & Save Status

EditorHeader.test.tsx (25 tests) covers title editing, save status indicators, action buttons, share/publish gating.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 8.1 | Map title renders, click to edit, Enter to save, Escape to cancel | AUTO | | |
| 8.2 | Save status shows correct state (Saving/Saved/Syncing/Synced/Offline/Error) | AUTO | | |
| 8.3 | Back button navigates to dashboard | AUTO | | |
| 8.4 | Share button: shows upgrade modal for free users, ShareModal for Pro | AUTO | | |
| 8.5 | Publish button opens PublishModal | AUTO | | |
| 8.6 | "Saved locally" click: redirects to /login if not authenticated | AUTO | | |
| 8.7 | "Saved locally" click: shows upgrade modal if at cloud limit | AUTO | | |
| 8.8 | Action buttons hidden when not authenticated | AUTO | | |

---

## 9. Sharing (Public Links)

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 9.1 | Enable sharing — link generated | AUTO | | |
| 9.2 | Disable sharing — toggle works | AUTO | | |
| 9.3 | Copy link → open in incognito — read-only view loads | MANUAL | | |
| 9.4 | Shared view shows nodes, links, colors, notes correctly | MANUAL | | |
| 9.5 | Disable sharing — link returns error/404 | MANUAL | | |
| 9.6 | Non-logged-in user can view shared map | MANUAL | | |

---

## 10. Library

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 10.1 | Browse library — maps load with cards, ratings, fork counts | MANUAL | | |
| 10.2 | Search by title — results filter correctly | MANUAL | | |
| 10.3 | Filter by category — only matching maps shown | MANUAL | | |
| 10.4 | Sort by rating/forks/newest/trending — order changes | MANUAL | | |
| 10.5 | Pagination — next/prev loads different maps | MANUAL | | |
| 10.6 | Click map card — LibraryMapView loads with D3 visualization | MANUAL | | |
| 10.7 | Rate a map (1-5 stars) — rating submits and displays | MANUAL | | |
| 10.8 | Fork a map — copy appears in dashboard | MANUAL | | |
| 10.9 | Forked map: colors, notes, node sizes all preserved | MANUAL | | |
| 10.10 | Forked map: all actions work (edit, delete, add, drag, notes) | MANUAL | | |
| 10.11 | No 429 rate limit errors for logged-in users | MANUAL | | |
| 10.12 | Unauthenticated user: fork/rate prompts sign-in | MANUAL | | |

---

## 11. Publishing to Library

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 11.1 | Publish button — form with title, description, category, tags | MANUAL | | |
| 11.2 | Submit publish — map appears in library browse | MANUAL | | |
| 11.3 | Published map shows author name and dates | MANUAL | | |
| 11.4 | Local-only map — publish modal prompts "Save to Cloud" before showing form | MANUAL | | |
| 11.5 | Click "Save to Cloud & Continue" — map syncs, then publish form appears | MANUAL | | |
| 11.6 | Cloud-synced map — publish form shown immediately (no sync prompt) | MANUAL | | |
| 11.7 | Publish button in editor checks status — shows "Already Published" if published | MANUAL | | |
| 11.8 | "Already Published" modal shows Unpublish button and explanation | MANUAL | | |
| 11.9 | Click Unpublish in modal — map removed from library, modal closes | MANUAL | | |
| 11.10 | After unpublishing, clicking Publish again shows the publish form (not "Already Published") | MANUAL | | |
| 11.11 | Library map view — author sees Unpublish button, non-author does not | MANUAL | | |
| 11.12 | Click Unpublish on library map view — confirmation, map removed, redirected to /library | MANUAL | | |
| 11.13 | Unpublished map's existing forks remain accessible to forking users | MANUAL | | |
| 11.14 | Cloud sync prompt — shown when map is local-only, hidden after sync | AUTO | | |
| 11.15 | Publish status check — API error gracefully handled (modal still opens) | AUTO | | |

---

## 12. Real-Time Collaboration

Requires two browser sessions (different browsers or incognito). collab-ui.spec.ts has 8 E2E scaffolding tests for UI rendering.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 12.1 | Presence panel renders in editor header | AUTO | | |
| 12.2 | Invite button visible for authenticated users | AUTO | | |
| 12.3 | Collab join page renders | AUTO | | |
| 12.4 | Create collab invite — link generated and copied | MANUAL | | |
| 12.5 | Second user opens invite link — accepted, redirected to map | MANUAL | | |
| 12.6 | Invited user sees the full map (no phantom standalone node) | MANUAL | | |
| 12.7 | User A adds node — appears on User B's canvas | MANUAL | | |
| 12.8 | User A edits node text — updates on User B | MANUAL | | |
| 12.9 | User A deletes node — removed on User B | MANUAL | | |
| 12.10 | User A drags node — movement visible on User B in real-time | MANUAL | | |
| 12.11 | User A changes node color — color updates on User B | MANUAL | | |
| 12.12 | User A edits note — note content syncs to User B | MANUAL | | |
| 12.13 | Presence panel shows both users with colored avatars | MANUAL | | |
| 12.14 | Remote cursors visible and moving | MANUAL | | |
| 12.15 | Disconnect + reconnect — state re-syncs correctly | MANUAL | | |
| 12.16 | No console errors (Yjs, WebSocket) | MANUAL | | |
| 12.17 | Non-Pro map owner — collaborator gets "needs Pro" message | MANUAL | | |
| 12.18 | Background change syncs between users | MANUAL | | |
| 12.19 | Non-invited user cannot access collab room — access denied | MANUAL | | |

---

## 13. Version History (Pro)

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 13.1 | Toggle history panel — version list loads with timestamps | MANUAL | | |
| 13.2 | Versions show relative timestamps (1m ago, 2h ago) | MANUAL | | |
| 13.3 | Preview version — read-only view of old state | MANUAL | | |
| 13.4 | Restore version — map reverts to that state | MANUAL | | |
| 13.5 | Free user — history button hidden or shows Pro gate | AUTO | | |

---

## 14. Exports

ExportSelector.test.tsx (12 tests) covers dropdown rendering, Pro gating, format options, JSON export. E2E covers JSON export.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 14.1 | Export dropdown renders with all format options | AUTO | | |
| 14.2 | JSON export always available (free) — file downloads | AUTO | | |
| 14.3 | Pro formats show lock icon for free users | AUTO | | |
| 14.4 | Free user clicks locked format — upgrade modal shown | AUTO | | |
| 14.5 | Re-import exported JSON — map recreated correctly | AUTO | | E2E: export-reimport |
| 14.6 | Export PNG (Pro) — image includes nodes, links, background | MANUAL | | |
| 14.7 | Export SVG (Pro) — vector file opens correctly | MANUAL | | |
| 14.8 | Export PDF (Pro) — print-ready document | MANUAL | | |
| 14.9 | Export Markdown (Pro) — outline with headings and bullets | MANUAL | | |

---

## 15. Payments (Stripe)

Stripe requires real checkout flow — cannot be automated.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 15.1 | Click upgrade — plan options shown (monthly $5, annual $40) | AUTO | | |
| 15.2 | Select plan — redirected to Stripe checkout page | MANUAL | | |
| 15.3 | Complete checkout — plan upgrades, Pro features unlock | MANUAL | | |
| 15.4 | "Manage Subscription" — Stripe billing portal opens | MANUAL | | |
| 15.5 | Cancel subscription — features downgrade at period end | MANUAL | | |

---

## 16. Ads

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 16.1 | Free user sees ad banners on dashboard and library | AUTO | | |
| 16.2 | Pro user — no ad banners anywhere | AUTO | | |
| 16.3 | Ad fails to load — fallback upgrade CTA shown | MANUAL | | |

---

## 17. Help & Onboarding

HelpGuideModal.test.tsx (6 tests) covers modal rendering, content sections, keyboard/backdrop close.

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 17.1 | Press ? key — help modal opens with shortcuts, mouse actions, tips | AUTO | | |
| 17.2 | Escape closes help modal | AUTO | | |
| 17.3 | Backdrop click closes help modal | AUTO | | |
| 17.4 | Landing page renders with hero, features, CTA buttons | AUTO | | |

---

## 18. Cross-Cutting & Edge Cases

| # | Test | Type | Status | Notes |
|---|------|------|--------|-------|
| 18.1 | Route: / shows landing (logged out) or dashboard (logged in) | AUTO | | |
| 18.2 | Route: /map/:id loads editor | AUTO | | |
| 18.3 | Canvas resizes on window resize | AUTO | | |
| 18.4 | Error boundary catches crash — fallback UI shown | MANUAL | | |
| 18.5 | Chrome — core features work | AUTO | | E2E: all specs on Chromium |
| 18.6 | Firefox — core features work | AUTO | | E2E: all specs on Firefox |
| 18.7 | Safari — core features work | AUTO | | E2E: all specs on WebKit |
| 18.8 | Mobile/tablet — responsive layout, touch interactions | MANUAL | | |
| 18.9 | Large map (50+ nodes) — no performance degradation | MANUAL | | |
| 18.10 | Navigate between maps quickly — correct data loads each time | MANUAL | | |
| 18.11 | Browser back/forward buttons — navigate correctly | MANUAL | | |
| 18.12 | Rapid clicking — no duplicate nodes or broken state | MANUAL | | |

---

## Summary

| Section | Total | AUTO | MANUAL |
|---------|-------|------|--------|
| 1. Auth Flows | 10 | 2 | 8 |
| 2. Dashboard & Maps | 10 | 9 | 1 |
| 3. Canvas & Nodes | 21 | 16 | 5 |
| 4. Layouts & Backgrounds | 5 | 4 | 1 |
| 5. Notes | 14 | 9 | 5 |
| 6. Search | 7 | 7 | 0 |
| 7. Cloud Sync | 7 | 1 | 6 |
| 8. Editor Header | 8 | 8 | 0 |
| 9. Sharing | 6 | 2 | 4 |
| 10. Library | 12 | 0 | 12 |
| 11. Publishing | 15 | 2 | 13 |
| 12. Collaboration | 19 | 3 | 16 |
| 13. Version History | 5 | 1 | 4 |
| 14. Exports | 9 | 5 | 4 |
| 15. Payments | 5 | 1 | 4 |
| 16. Ads | 3 | 2 | 1 |
| 17. Help & Onboarding | 4 | 4 | 0 |
| 18. Cross-Cutting | 12 | 6 | 6 |
| **TOTAL** | **172** | **82** | **90** |

---

**Priority order for testing:**

1. **Auth + Dashboard** (sections 1-2) — users can't do anything if these break
2. **Canvas + Notes + Search** (sections 3, 5, 6) — core product experience
3. **Cloud Sync + Sharing** (sections 7, 9) — data safety
4. **Library + Fork + Publish** (sections 10-11) — growth engine
5. **Collaboration** (section 12) — most complex, most recent changes
6. **Payments + Exports** (sections 14-15) — revenue path
7. **Version History + Ads + Cross-cutting** (sections 13, 16-18) — polish
