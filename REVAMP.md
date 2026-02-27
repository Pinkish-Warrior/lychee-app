# UI Enhancement Plan — Leeche App

## Context
The app works well functionally but feels plain. The goal is a polished, minimal aesthetic with purposeful motion — focused on the Dashboard as the primary surface. `framer-motion` is already installed and unused; this plan activates it throughout.

---

## 1. Sidebar — App Branding ✅
**File:** `client/src/components/DashboardLayout.tsx`

Replace the generic "Navigation" label with the app name **Leeche** and a `Leaf` icon from lucide-react. When collapsed, only the PanelLeft toggle shows.

---

## 2. Dashboard — Staggered Card Entrance Animations ✅
**File:** `client/src/pages/Dashboard.tsx`

Use `framer-motion` `motion.div` with `variants` + `staggerChildren` so note cards animate in one-by-one (fade up, slight Y offset) when the page loads or notes refresh.

```
Container variant: staggerChildren 0.06s
Child variant: { hidden: opacity 0, y 16 } → { visible: opacity 1, y 0 }
Transition: spring, damping 20
```

---

## 3. Dashboard — Note Card Hover Lift ✅
**File:** `client/src/pages/Dashboard.tsx`

`whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}` on each note card.

---

## 4. Dashboard — Mouse Parallax on Category Sections ✅
**File:** `client/src/pages/Dashboard.tsx`

As the mouse moves over a section, a white gradient overlay shifts subtly (±4px). Uses `useMotionValue` scoped per section.

---

## 5. Dashboard — Animated Stats Counters ✅
**File:** `client/src/pages/Dashboard.tsx`

Numbers animate from previous value → actual value using framer-motion's imperative `animate()` API.

---

## 6. Dashboard — Success Toasts with Category Name ✅
**File:** `client/src/pages/Dashboard.tsx`

Capture toast shows: `"Saved to Ideas"` or `"Saved to Ideas — please review the classification"`.

---

## 7. Dashboard — Exit Animations for Deleted/Archived Notes ✅
**File:** `client/src/pages/Dashboard.tsx`

Notes exit with `AnimatePresence` + `exit={{ opacity: 0, x: -20 }}` immediately on confirm. Optimistic removal via `removedIds` Set.

---

## 8. Dashboard — Confidence Score Legend ✅
**File:** `client/src/pages/Dashboard.tsx`

Tooltip on confidence %:
- 🟢 ≥85% High confidence
- 🟡 60–84% Medium — may need review
- 🔴 <60% Low — needs review

---

## 9. CategoryView — Reasoning Text + Entrance Animations ✅
**File:** `client/src/pages/CategoryView.tsx`

- Reasoning text: `text-gray-500` → `text-muted-foreground`
- Staggered entrance + hover lift + exit animations on delete

---

## 10. Loading Skeletons ✅
**Files:** Dashboard, CategoryView, Archive

Skeleton cards matching note card shape replace spinners during loading.

---

## Files Modified
| File | Changes |
|------|---------|
| `client/src/components/DashboardLayout.tsx` | Leaf icon + "Leeche" branding |
| `client/src/pages/Dashboard.tsx` | All animations, toasts, parallax, legend, skeletons |
| `client/src/pages/CategoryView.tsx` | Animations, text fix, skeletons |
| `client/src/pages/Archive.tsx` | Entrance animations, skeletons, exit animations |
| `tsconfig.json` | Added `"target": "ES2020"` for Set spread support |
