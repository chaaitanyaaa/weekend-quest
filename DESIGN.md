---
name: Weekend Quest
description: A joyful, tactile weekend planning circle for close friends.
colors:
  primary: "#FF6A5B"
  primary-dark: "#E54A3B"
  secondary: "#C6E84C"
  secondary-dark: "#A8CF2E"
  neutral-bg: "#FBF5E9"
  neutral-bg-subtle: "#F4EBD6"
  neutral-bg-muted: "#EFE3C8"
  neutral-surface: "#FFFFFF"
  neutral-text: "#16213E"
  dark-bg: "#0F172A"
  dark-surface: "#1B2640"
  dark-text: "#FBF5E9"
  accent-teal: "#7BCFB8"
  accent-amber: "#FFB547"
  accent-plum: "#9B7BC7"
  accent-pink: "#FFD4C9"
typography:
  display:
    fontFamily: "Bricolage Grotesque, -apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 800
    letterSpacing: "-0.02em"
    lineHeight: 1.1
  body:
    fontFamily: "Albert Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 400
    letterSpacing: "normal"
    lineHeight: 1.5
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  card:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.lg}"
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.neutral-bg-subtle}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
---

# Weekend Quest Design System

## Overview
Weekend Quest is an intimate, lively weekend planning companion built for friend groups. The design language rejects clinical productivity tropes and generic AI aesthetics in favor of warm tactile paper-and-ink aesthetics, vibrant high-contrast accents, expressive geometric typography, and confident editorial composition.

## Colors
The palette balances an organic warm paper ground with punchy, retro-modern accents.

- **Primary (`#FF6A5B` - Coral):** The heartbeat action color for affirmations, votes, primary CTAs, and countdown urgency.
- **Secondary (`#C6E84C` - Lime):** Used for locked decisions, winning banner celebrations, and unlocked milestones.
- **Backgrounds:**
  - Light mode: `#FBF5E9` (Cream), `#F4EBD6` (Cream-2), and `#FFFFFF` (Surface cards).
  - Dark mode: `#0F172A` (Slate Navy), `#1B2640` (Card surface).
- **Accents:**
  - Teal (`#7BCFB8`): Nature & outdoor quests.
  - Amber (`#FFB547`): Food, drinks, and social outings.
  - Plum (`#9B7BC7`): Culture, arts, and games.

## Typography
- **Display Face:** *Bricolage Grotesque*. Used for `h1`, `h2`, and card titles. Chunky, rhythmic, and high personality. Tracking stays between `-0.02em` and `-0.03em`.
- **Body Face:** *Albert Sans*. Used for all readable interface copy, badges, inputs, buttons, and metadata. Clean, modern geometric proportions with generous x-height.

## Layout
- **Density:** Generous, breathable group containers with 8pt grid increments (`p-4`, `p-6`, `p-8`).
- **Measure:** Body copy capped at 65ch max-width to protect scannability.
- **Mobile First:** Sticky top app bar, mobile bottom bar navigation, drawer menus, and responsive card grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).

## Elevation & Depth
- **Depth Standard:** Singly-declared elevation. Surfaces declare either crisp borders (`border-navy/5` or `border-white/5`) or deliberate directional shadows (`shadow-soft`: `0 2px 12px -2px rgba(22, 33, 62, 0.08)`).
- **Interactive Hover:** Subtle lift with exponential deceleration (`ease-out`, `hover:-translate-y-0.5`).

## Shapes
- **Container Radii:** Standardized strictly to 16px (`rounded-2xl`) for cards, dialogs, modals, and preview panels.
- **Controls & Buttons:** 12px (`rounded-xl`).
- **Category & Pill Tags:** Fully rounded capsules (`rounded-full`).

## Components
- **Idea Cards:** High-contrast cards featuring category badge, title, concise pitch, suggestion owner avatar, heart tally, and comment counter.
- **Winner Banner:** Bold lime-tinted banner heralding the quest that won the Thursday Lock.
- **Group Circle Selector:** Quick-switch circle header with custom group emoji and accent color.
- **Modal Dialogs:** Centered sheets with backdrop blur, keyboard escape listener, and trapped focus.

## Do's and Don'ts
- **DO** let headings speak for themselves. Headings carry their own weight.
- **DO** use authentic exponential easing curves (`cubic-bezier(0.16, 1, 0.3, 1)`) for sheets and popovers.
- **DO** keep cards to 16px (`rounded-2xl`) rather than ballooning to 24px (`rounded-3xl`).
- **DON'T** use uppercase eyebrow kickers above headings (e.g. "THE IDEA BOARD").
- **DON'T** use generic AI bounce animations or overused fonts.
- **DON'T** use 1px ghost borders combined with zero-offset color halos.
