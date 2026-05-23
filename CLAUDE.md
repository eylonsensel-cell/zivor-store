# CLAUDE.md — Frontend Website Rules

## Always Ask First (Mandatory Pre-Work Questions)
Before writing any code, invoking any skill, or making any design decision, Claude **must** ask the user the following three questions using the AskUserQuestion tool. Do not proceed until all three are answered. Do not assume answers based on context — always ask explicitly, every session.

### Question 1 — Site Type
> "האם האתר יהיה חנות שקונים דרכה (E-commerce), קטלוג תצוגה בלבד, או הזמנה מראש (Pre-order)?"

Options to present:
- **חנות מלאה עם תשלום** — E-commerce אמיתי: עגלת קניות, צ'קאאוט, סליקה (Stripe / PayPal / Bit), ניהול הזמנות.
- **קטלוג תצוגה בלבד** — תצוגה של המוצרים ללא רכישה באתר; הזמנות מתבצעות דרך WhatsApp / טלפון / טופס.
- **הזמנה מראש (Pre-order)** — טופס Pre-order לקראת המצעד; איסוף שמות ומידות ללא תשלום מיידי.

### Question 2 — Color Palette
> "איזו פלטת צבעים להגדיר באתר?"

Present these four options and wait for explicit approval before using any colors:
- **Bold Protest** — `#D62828` (אדום עז), `#1A1A1A` (שחור), `#FFF8E7` (קרם), `#F4A261` (צהוב מבטא). אנרגטי, מתאים לרוח מצעד.
- **Streetwear מודרני** — `#0A0A0A` (שחור), `#F5F5F0` (לבן שבור), `#E4FF1A` (ניאון מבטא), `#2D2D2D` (אפור). אורבני, סגנון טי-שירט.
- **Vintage Earthy** — `#C9A227` (חרדל), `#606C38` (זית), `#BC6C25` (טרקוטה), `#FEFAE0` (קרם). חם, נוסטלגי.
- **Minimal Mono** — `#000000`, `#FFFFFF`, `#E8E4DD` (אפור-בז'), `#FF3B30` (אדום מבטא). נקי, מתוחכם.

Do not invent or substitute colors. Once approved, derive all shades from the chosen palette only.

### Question 3 — Brand Name
> "מה השם של המצעד / מקום העבודה שיופיע באתר?"

Options:
- **המשתמש מספק את השם** — השתמש בפלייסהולדר `[שם המצעד]` עד שהשם יסופק.
- **השאר גנרי לעת עתה** — השתמש בכותרת ניטרלית עד לעדכון.

---

## Language & Direction (Hard Rule)
- **All website content must be in Hebrew.** No English copy in user-facing text. UI labels, buttons, headings, body copy, error messages, footer — all Hebrew.
- **The entire layout must be RTL (right-to-left).**
  - Set `<html lang="he" dir="rtl">` on every page.
  - Use Tailwind's logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) instead of `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`.
  - Mirror icons that imply direction (arrows, chevrons).
  - Text alignment defaults to `text-right`; only override for centered/justified content with intent.
- **Hebrew typography:** Use a Hebrew-supporting font pair. Default to `Heebo`, `Assistant`, or `Rubik` for body, and `Frank Ruhl Libre`, `Noto Serif Hebrew`, or `Suez One` for display. Never use a font that doesn't include Hebrew glyphs.
- **Numbers, dates, currency:** Use Hebrew conventions. Currency in ₪ (NIS). Dates in `DD/MM/YYYY` or Hebrew month names.
- **Hebrew punctuation:** Use Hebrew quotation marks (`״` `׳`) where appropriate; avoid mixed English/Hebrew punctuation in headings.

---

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.
- Then ask the three mandatory questions above.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic Hebrew copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/nateh/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing
- **RTL check:** verify the layout flows right-to-left, Hebrew text renders correctly, and no English fallback glyphs appear.

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- `<html lang="he" dir="rtl">` — always
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive
- Hebrew font loaded from Google Fonts in `<head>`

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.
- **The user-approved palette from Question 2 overrides any default — but a palette defined in `brand_assets/` overrides everything.**

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Use only the user-approved palette from Question 2 and derive shades from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display Hebrew font with a clean Hebrew sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Dropshipping Essentials
When the answer to Question 1 is **"חנות מלאה עם תשלום"** (E-commerce), the following elements are mandatory. Treat them as a checklist — do not ship without them.

### Trust Signals (אמון)
- Star ratings + review count on every product card and product page.
- "מלאי אחרון" / "נשארו X יחידות" badge when stock is low.
- Live viewers counter ("X אנשים צופים במוצר כרגע") on product pages.
- Secure payment icons (Visa, Mastercard, Bit, PayPal) in checkout and footer.
- SSL / lock icon next to "תשלום מאובטח" label.
- "החזרה תוך 14 יום" badge prominent near the buy button.

### Product Page (דף מוצר)
- Image gallery: minimum 4 images, multi-angle + at least one lifestyle shot.
- Zoom on hover / pinch-to-zoom on mobile.
- Size chart (`טבלת מידות`) in Hebrew with cm — mandatory for clothing.
- Variant selector (color + size) with visual swatches, not just a dropdown.
- Sticky "הוסף לעגלה" CTA on mobile, visible while scrolling.
- "קונים יחד עם" (frequently bought together) — upsell module.
- Related products carousel at the bottom.
- Stock status: "במלאי" / "אזל" / "נשארו X" — never hide it.

### Shipping & Returns (משלוחים והחזרות)
- Dedicated `/shipping` page with honest delivery windows (be transparent — dropshipping = 14–21 days typically).
- Shipping cost calculator on the cart page.
- `/returns` page with the return policy in plain Hebrew.
- Order tracking page (`/track`) with order number + email lookup.

### Conversion Optimization
- Exit-intent popup with discount code (first-time visitors only).
- Email capture for coupon ("הירשם וקבל 10% הנחה").
- Cart abandonment flow (email trigger after 1h / 24h).
- Express checkout: Apple Pay, Google Pay, Bit — above the form.
- Guest checkout — never force registration.
- Free shipping threshold bar at the top ("עוד ₪50 למשלוח חינם").

### Performance (חובה — דרופשיפינג חי על מהירות)
- Lazy loading on all images below the fold (`loading="lazy"`).
- WebP format with JPG fallback.
- Lighthouse score 90+ on mobile.
- LCP < 2.5s, CLS < 0.1.
- Preload hero image and primary font.
- Inline critical CSS; defer everything else.

### Tracking & Pixels
- Meta Pixel placeholder in `<head>` — leave a clear `<!-- META_PIXEL_ID -->` comment.
- Google Tag Manager placeholder.
- TikTok Pixel placeholder.
- Track standard events: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase.
- Never hardcode pixel IDs — always use a placeholder the user fills in.

### Israeli Market Specifics (שוק ישראלי)
- Bit as a payment option — non-negotiable.
- Floating WhatsApp button (bottom-left in RTL) with the store's number.
- Prices include VAT (מע"מ) — never show ex-VAT prices.
- Mandatory legal pages: `/terms` (תקנון), `/privacy` (מדיניות פרטיות), `/returns` (מדיניות החזרה).
- Phone number in Israeli format (`05X-XXX-XXXX`).
- Customer support hours in Israel time.

### SEO Basics
- `<title>` and `<meta description>` in Hebrew on every page.
- Open Graph tags (`og:title`, `og:description`, `og:image`) for social shares.
- Schema.org `Product` markup with price, availability, reviews.
- `sitemap.xml` and `robots.txt`.
- Canonical URLs.
- Hebrew slugs in URLs where possible (or transliterated).

---

## Hard Rules
- Do not skip the three mandatory questions
- Do not write English copy in user-facing text
- Do not use LTR layout
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
- Do not hardcode pixel IDs or API keys — always use placeholders
- Do not hide stock status, shipping times, or return policy
- Do not force account registration before checkout
