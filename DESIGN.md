---
name: Zēllu
description: Cuidado emocional no ritmo do trabalho. Brand cream with whole fields of ink and terracotta, framing the real app running in its clay palette.
colors:
  cream: "#fdf8f4"
  cream-deep: "#f3eee1"
  ink: "#4d332d"
  ink-soft: "#5b5248"
  terracotta: "#e5987d"
  terracotta-deep: "#d48468"
  sage: "#92a085"
  sage-deep: "#66745b"
  sage-field: "#e3e8dc"
  hairline: "#e3d8cc"
  clay-cream: "oklch(0.945 0.022 84)"
  clay-title: "oklch(0.55 0.04 254)"
  clay-text: "oklch(0.38 0.025 260)"
  clay-cta: "oklch(0.78 0.045 250)"
  clay-cta-2: "oklch(0.85 0.03 250)"
typography:
  display:
    fontFamily: "Quicksand, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 4vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Quicksand, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.8vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Quicksand, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body-list:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Quicksand, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
rounded:
  input: "12px"
  frame: "22px"
  form: "26px"
  phone-screen: "34px"
  phone: "44px"
  pill: "999px"
spacing:
  section-block: "clamp(4.5rem, 9vw, 7.5rem)"
  gutter-mobile: "1.25rem"
  gutter-desktop: "2rem"
  column-gap: "3rem"
  container: "80rem"
components:
  button-terra:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-terra-hover:
    backgroundColor: "{colors.terracotta-deep}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "0 1.75rem"
    height: "3.25rem"
  button-cream:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "0 1.25rem"
    height: "2.75rem"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    padding: "0 0.95rem"
    height: "3rem"
  app-frame:
    backgroundColor: "#ffffff"
    rounded: "{rounded.frame}"
  app-frame-body:
    backgroundColor: "{colors.clay-cream}"
    padding: "1.1rem"
  app-frame-title:
    textColor: "{colors.clay-title}"
    typography: "{typography.label}"
  example-data-pill:
    backgroundColor: "{colors.cream-deep}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0.2rem 0.55rem"
  question-ruler:
    backgroundColor: "{colors.cream-deep}"
    textColor: "{colors.ink}"
  form-card:
    backgroundColor: "{colors.cream}"
    rounded: "{rounded.form}"
    padding: "clamp(1.5rem, 4vw, 2.5rem)"
  phone:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.phone}"
    padding: "12px"
    width: "min(340px, 86vw)"
---

# Design System: Zēllu

## Overview

**Creative North Star: "The Product, Shown Working"**

Zēllu has two layers. The brand layer is warm and editorial: brand cream paper, whole fields of ink and terracotta, a light sage field, Quicksand headlines set tight and heavy. The product layer is the app itself, the companion and the RH panel, in its own clay palette (clay cream ground, slate-blue titles, soft blue CTAs). The brand layer never imitates the product; it frames it. Every claim on a brand surface is backed by a real app component running inside a frame, fed with example data and labeled as such.

Density is calm and sectional. Each section is one question with one answer and one piece of working proof, separated by a change of color field rather than by cards, dividers, or icons. Ornament is minimal: terracotta dots for lists, numbered ink discs for steps, a tilt of under one degree on two proof frames. The bear mascot appears only where the product speaks to the person (the check-in, the closing invitation), never as decoration on HR-facing argument.

**Key Characteristics:**
- Brand cream ground; sections change by full-width color field (ink, sage field, terracotta), not by boxed cards.
- Real product components inside app frames, always carrying the "Dados de exemplo" pill.
- Quicksand 700 for every headline, label, and button; Nunito Sans for reading text.
- Pill buttons; generous rounded frames (22px) and a device frame for the phone.
- One authored motion moment (the develop reveal); everything else is short state transitions.

## Colors

A warm, low-saturation brand palette (cream, ink, terracotta, sage) wrapped around the app's cooler clay palette, so the product reads as a distinct object on the page.

### Primary
- **Terracotta Clay** (terracotta): the brand's action color. Primary CTA fill ("Agendar demonstração"), list bullets, ruler underline tint, text selection, and the whole closing field. Text on it is always ink, never cream.
- **Fired Terracotta** (terracotta-deep): hover state for terracotta buttons, the caret color in inputs, and the tint of the terracotta button's soft shadow.

### Secondary
- **Cacao Ink** (ink): all brand headlines and strong text, the full-width privacy field, the submit button on the terracotta field, step numerals, the phone bezel, and the focus outline. It is the brand's dark, used instead of black.
- **Warm Graphite** (ink-soft): body paragraphs, list text, captions, the example-data pill text, footer copy.

### Tertiary
- **Field Sage** (sage): identity color carried by the logo lockup and symbol; on landing surfaces it is expressed through its deep and field variants rather than as a fill.
- **Moss** (sage-deep): small brand signatures on cream, such as the "Powered by" line.
- **Sage Wash** (sage-field): the light sage section field (the "how much work is this for HR" answer).

### Neutral
- **Brand Cream** (cream): page ground, header (at 92% with blur), form card, cream button.
- **Linen** (cream-deep): question ruler band, footer, example-data pill.
- **Thread** (hairline): header bottom border, ruler borders, input borders, footer divider.

### Product layer (clay)
- **Clay Cream** (clay-cream): the app's ground; every app frame body and phone screen uses it with the app's two soft radial washes, so the framed product looks exactly as it does in use.
- **Slate Title** (clay-title): app headings and the app-frame title text.
- **Slate Text** (clay-text): app body text.
- **Sky CTA / Mist CTA** (clay-cta, clay-cta-2): the app's gradient call to action and progress bars, seen only inside product frames.

### Named Rules
**The Two Palettes Rule.** Brand colors (cream, ink, terracotta, sage) live outside the frame; clay colors live inside it. A brand surface never paints its own UI in clay blue, and the product is never recolored to match the brand.

**The Ink-On-Terracotta Rule.** Text and controls on terracotta are ink. Cream on terracotta fails legibility and is not used.

**The Whole Field Rule.** Ink, sage field, and terracotta are used as full-bleed section grounds, one per section, with cream sections between them. They are not used as card fills or badges.

## Typography

**Display Font:** Quicksand (with system-ui, sans-serif), via `--font-display`
**Body Font:** Nunito Sans (with system-ui, sans-serif), via `--font-body`

**Character:** Quicksand's rounded terminals at weight 700 and tight negative tracking give the headlines a friendly but firm voice; Nunito Sans keeps reading text open and plain.

### Hierarchy
- **Display** (700, clamp(2.4rem, 4vw, 3.6rem), 1.04, -0.035em, max 18ch, balanced): the single page headline.
- **Headline** (700, clamp(2rem, 3.8vw, 3.25rem), 1.05, -0.03em, max 20ch, balanced): one per section, phrased as the question the section answers.
- **Title** (700, 1.2rem, -0.01em): sub-column headings within a section.
- **Body** (400, 1.125rem, 1.625): section lead paragraphs, held to 48–60ch.
- **Body list** (400, 1.02rem, 1.55; tight variant 0.98rem): bulleted answers, with the lead phrase in ink 700.
- **Label** (Quicksand 700, 0.9rem): form labels, ruler links (0.98rem), buttons (0.95rem; large 1.05rem), app-frame titles (0.75rem bar).

### Named Rules
**The Quicksand Speaks Rule.** Anything that names or commands (headings, labels, buttons, ruler links, frame titles) is Quicksand 700. Anything to be read at length is Nunito Sans 400; header and footer nav links are Nunito Sans 600.

**The Question Heading Rule.** Section headlines are the visitor's question, verbatim, and the ruler repeats them as anchors. No eyebrow or kicker line sits above a heading.

## Layout

Single column of full-width sections, content held in a centered container (max 80rem) with 1.25rem side gutters on mobile and 2rem from 640px. Sections breathe with clamp(4.5rem, 9vw, 7.5rem) block padding and a 4.5rem scroll margin so anchored headings clear the sticky header.

At 1024px and up, each section becomes an asymmetric two-column grid (ratios near 0.9fr/1.1fr, swapped per section so proof alternates sides) with a 3rem gap: text column on one side, the proof frame on the other. On the sage section the text column is sticky (top 7rem) while the long email preview scrolls. Below 1024px everything stacks: text first, proof after, tilts removed.

The hero is the same two-column grid, followed immediately by the question ruler: a full-width linen band listing the five section questions as wrapping anchor links.

## Elevation & Depth

Depth is structural, not ambient: shadows exist only to lift the objects that represent the real product (app frames, phone, email preview, form card) and to seat the two filled buttons. Brand sections themselves are flat color fields. All shadows are tinted with ink via `color-mix`, never neutral black, and are long and soft with a negative spread so the object floats above the field.

### Shadow Vocabulary
- **Proof lift** (`0 30px 60px -20px ink 30%, 0 2px 6px ink 10%`): app frames.
- **Device lift** (`0 40px 70px -25px ink 55%, 0 2px 4px ink 20%`): the phone frame, deeper because it is a physical object.
- **Form lift** (`0 30px 60px -24px ink 45%`): the demo form card on the terracotta field.
- **Button seat** (`0 6px 16px terracotta-deep 35%` / `0 8px 20px ink 30%`): terracotta and ink buttons only.

### Named Rules
**The Only-Proof-Floats Rule.** If it is not the product (or the form that books it), it sits flat on its field.

## Shapes

Rounded and soft throughout, with no square corners on any visible container. Controls are pills (999px). Inputs use a gently curved 12px; product frames 22px; the form card 26px; the phone a 44px bezel around a 34px screen. Borders are hairlines (1px on bands, 1.5px on inputs and the line button as an inset shadow). Circles mark sequence and state: terracotta list dots, ink step discs, the privacy respondent dots.

## Components

### Buttons
Tactile and confident: pill-shaped, Quicksand 700, never more than one filled button per view region.
- **Shape:** full pill (999px), min height 2.75rem; large size 3.25rem with 1.75rem padding.
- **Terracotta (primary):** terracotta fill, ink text, terracotta-deep seat shadow; hover deepens to terracotta-deep. Used for every "Agendar demonstração" on cream.
- **Ink:** ink fill, cream text; hover darkens to a deeper cacao. Used as the submit on the terracotta field, where terracotta would vanish.
- **Cream:** cream fill, ink text; hover to white. The primary action on the ink field.
- **Line:** transparent with an inset 1.5px cream ring at 55%, full cream on hover. Secondary action on the ink field.
- **States:** 0.2s transitions on the shared ease; active nudges down 1px; disabled at 55% opacity with a not-allowed cursor. Focus is the global 2px ink outline, 3px offset.

### Navigation
- **Header:** sticky, cream at 92% with a 10px saturating blur and a hairline bottom border. Logo lockup left, section links center (hidden under 768px), "Entrar" link and the terracotta button right.
- **Links:** Nunito Sans 600 ink text with a 2px underline that is transparent at rest and turns terracotta on hover.
- **Question ruler:** linen band between hairlines; Quicksand 700 ink links with a permanent 2px terracotta-tinted underline that turns ink on hover.

### App Frame (signature)
The container for every piece of product proof.
- **Structure:** white figure with a 22px radius and proof-lift shadow; a white title bar (Quicksand 700 title in clay slate, truncating) and a right-aligned "Dados de exemplo" pill in linen; a body painted in clay cream with the app's own radial washes.
- **Flush variant:** clay cream body with no padding, for content that brings its own layout (email, PDF page).
- **Tilt:** the hero frame rotates 0.6deg and the PDF frame -0.8deg at desktop only; the hero body is zoomed 1.32x so the panel reads at landing scale.

### Phone Frame
Ink bezel (12px padding, 44px radius, device-lift shadow) around a clay cream screen with radial washes, min height 560px, width min(340px, 86vw). Holds the real check-in component.

### Lists and Steps
- **List:** answers set as a grid with 0.9rem gaps; each item carries an 0.55rem terracotta dot and opens with an ink 700 lead phrase.
- **Steps:** an ordered list whose numerals are 2.2rem ink discs with cream Quicksand numbers.

### Inputs / Fields
- **Style:** white field, 1.5px hairline border, 12px radius, 3rem tall, Nunito Sans 1rem ink text, terracotta-deep caret. Labels stack above in Quicksand 700.
- **Focus:** border shifts to ink (0.2s); no glow.
- **Select:** native appearance removed, chevron drawn with two ink gradient triangles.
- **Error:** a single semibold message under the submit, with `role="alert"`.

### Form Card
Cream card, 26px radius, form-lift shadow, fluid padding; sits on the terracotta field so it is the brightest object in the closing section.

### Privacy Reveal (signature)
Five 2.1rem respondent dots on the ink field, each a cream ring at 40%; the fifth carries an extra terracotta halo marking the threshold. Filled dots turn terracotta and scale to 1.06 (0.45s). "Adicionar uma resposta" (cream button) adds one; "Recomeçar" (line button) resets. At five answers the real panel inside the adjacent frame plays the develop animation: blur 8px and 40% saturation to sharp, 0.9s. With reduced motion the count jumps to five and the panel appears without animation.

## Do's and Don'ts

### Do:
- **Do** render product proof from the real app components (the work-factor panel, the check-in question, the monthly email builder) fed with example data, inside an App Frame that shows the "Dados de exemplo" pill.
- **Do** generate any raster of the product from the product's own code (the PDF preview comes from the real PDF builder) and ship it with a provenance sidecar next to the file.
- **Do** keep clay colors inside frames and brand colors outside them (The Two Palettes Rule).
- **Do** separate sections by full-bleed field color (ink, sage field, terracotta) with cream between, one field per section.
- **Do** use ink text on terracotta and cream text on ink.
- **Do** use the shared ease `cubic-bezier(0.16, 1, 0.3, 1)` for every transition, keep state transitions at 0.2s, and give `prefers-reduced-motion` a no-animation path that still reaches the end state.
- **Do** tint every shadow with ink or terracotta-deep via `color-mix`.

### Don't:
- **Don't** paste screenshots of the app as proof; screenshots drift from the product and carry real data.
- **Don't** show product UI without the example-data label, or with real customer data.
- **Don't** add a second authored motion moment; the develop reveal is the one.
- **Don't** put the bear mascot beside HR-facing claims; it appears only where the product speaks to the person.
- **Don't** set cream or white text on terracotta.
- **Don't** add eyebrow or kicker lines above headings; the heading is the question.
- **Don't** use neutral gray or black shadows on brand surfaces, or shadows on flat brand fields; shadows inside frames belong to the product.
