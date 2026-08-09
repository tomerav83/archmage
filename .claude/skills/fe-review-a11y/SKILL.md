---
name: fe-review-a11y
description: Accessibility pass of a frontend review — WCAG 2.2 AA checks for keyboard access, accessible names, focus, contrast, target size, landmarks, live regions, and pointer-only interactions. Use when reviewing or auditing UI code for accessibility, or as pass 1 of /frontend-review.
---

# Accessibility pass (A11Y)

WCAG 2.2 AA. Automated rules catch ~40% of real failures, so read the
interaction code — do not stop at grepping for `aria-`.

| ID | Check | How to verify | Default sev |
|---|---|---|---|
| A11Y-01 | Every interactive element is a native control or a fully-declared custom one | Find every `onClick`/`onMouseDown`/`onDrag*` handler. If its element is not `button`/`a`/`input`/`select`/`textarea`, it needs `role` **and** `tabIndex={0}` **and** a keydown handler for Enter/Space | blocker |
| A11Y-02 | Every control has an accessible name | Icon-only buttons, close buttons and links with no text need `aria-label`/`aria-labelledby`/visually-hidden text | blocker |
| A11Y-03 | Every input is labelled | Each `input`/`select`/`textarea` sits inside a `<label>` or has `id` + `htmlFor`. `placeholder` is not a label | blocker |
| A11Y-04 | Focus is visible | Grep CSS for `outline: none`/`outline: 0`. Each one needs a `:focus-visible` style replacing it with a ≥3:1 indicator | major |
| A11Y-05 | Popups behave | Menus/dialogs/popovers: focus moves in on open, Escape closes, focus returns to the trigger, focus does not escape a modal | blocker |
| A11Y-06 | Contrast ≥ 4.5:1 body, 3:1 large text and UI/state indicators | Enumerate first, then verdict the whole list — the coverage is what drifts between runs. The list is: every custom property that resolves to a colour, **every fallback in a `var(--x, fallback)`**, and every literal colour, each paired with the background it actually renders on, including the fallback background a value takes when its token is unset or a data-driven case is unmatched. Resolve to hex, compute the ratio, and include disabled-looking, muted, placeholder and severity colours | major |
| A11Y-07 | Target size ≥ 24×24 CSS px (2.5.8) | Compute rendered size for every icon button, close button, list control and chip from CSS (font-size + padding, or explicit size). Measure the **hit area**, not the element: an input wrapped in a `<label>` is targeted by the whole label, and a control with an enlarged pseudo-element or padded parent is targeted by that box. **Exception, apply it:** an undersized target passes if a 24px-diameter circle centred on it overlaps no other target — i.e. the gap to its nearest neighbour covers the shortfall. Undersized *and* tightly packed fails | major |
| A11Y-08 | Focus not obscured (2.4.11) | Sticky headers/footers, fixed toolbars and overlays must not cover a focused element scrolled to the viewport edge | major |
| A11Y-09 | Structure is semantic | Exactly one `h1`, no skipped heading levels, page regions use `header`/`nav`/`main`/`aside`/`footer` or roles, lists use `ul`/`ol`/`li` | minor |
| A11Y-10 | Non-text content has a text alternative | Enumerate **every** `img`, every inline `<svg>` the app authors, and every icon component in scope, then verdict on the full list: `img` needs `alt` (empty if decorative), inline `<svg>` needs `role="img"`+`<title>` or an explicit `aria-hidden`, icon components need hiding from AT when text sits beside them | major |
| A11Y-11 | Dynamic changes are announced | Error text, result counts, toasts and async status need `role="alert"`/`role="status"`/`aria-live`, and must render into the DOM at the moment of the change | major |
| A11Y-12 | Pointer-only paths have an alternative (2.5.7, 2.1.1) | Drag-and-drop, right-click menus, hover-reveal, canvas gestures and click-then-click wiring each need a keyboard route to the same outcome | blocker |
| A11Y-13 | Document basics | `<html lang>`, a descriptive `<title>`, no `user-scalable=no`/`maximum-scale` in the viewport meta | minor |
| A11Y-14 | State is exposed, not just painted | Selected/expanded/pressed/disabled/current states carried by CSS classes or `data-` attributes also need `aria-selected`/`aria-expanded`/`aria-pressed`/`disabled`/`aria-current` — **or** visually-hidden text inside the control naming the state, which conveys the same fact to a screen reader and is a `PASS` | major |
| A11Y-15 | Colour is not the only channel (1.4.1) | Severity, validity, selection and status must also differ by text, icon or shape | major |
