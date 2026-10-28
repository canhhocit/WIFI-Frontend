# WI-FI CAPTIVE PORTAL - FRONTEND UX & UI RULES

Design for real public users and enterprise administrators, not static screenshots.

## 1. Design Direction
- Clean, modern, trustworthy, restrained enterprise design.
- The guest portal is mobile-first (optimized for 375px–430px smartphone screens).
- The admin dashboard is responsive across desktop (1280px–1920px) and tablet (768px–1024px).
- Use Lucide React icons; do NOT use emoji icons.
- Avoid generic AI-generated styling, excessive gradients, neon colors, and distracting animations.

## 2. UX Priorities
1. Make the primary action obvious (e.g., "Connect to Wi-Fi", "Login to Dashboard").
2. Explicit consent checkbox for Terms & Conditions must be required before connecting.
3. Provide crystal-clear loading, empty, error, and success states.
4. Provide confirmation dialogs before destructive actions (e.g., revoking an active guest session).
5. All visible buttons, filters, searches, and pagination controls must connect to real APIs and work as intended.
6. Preserve context when users navigate, filter, search, or return to a previous page.

## 3. Implementation Requirements
- Inspect actual backend endpoints, request DTOs, and error formats before integrating.
- Reuse existing components, API clients (`api.ts`), validation utilities, and shared types.
- Every visible button, menu item, filter, form, and pagination control must work as intended.
- Support mobile screens around 375–390px, tablets around 768px, and desktop layouts around 1280–1440px.
- Test key flows at different viewport sizes.
- Verify loading, empty, error, and success states.
- Run `npm run build` to verify production builds with zero TypeScript errors.

## 4. Task Reports & Deliverables
- After completing any coding, bug fix, feature update, or audit task:
  1. Always write a comprehensive task report to:
     `D:\Download\AMZ\Wi-Fi-Captive-Portal\docs\report/`
  2. Naming format: `{năm}_{tháng}_{ngày}_{Nội dung task}.md`
  3. Commit and push changes to `https://github.com/canhhocit/WIFI-Frontend.git` (nhánh `main`).
