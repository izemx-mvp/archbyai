# Elevate Platform

make sure to do excatly what being asked in that cahier du charge  and make this backoffice in french: Redesign the entire application from scratch into a premium, enterprise-grade SaaS platform. The current application is functional, but the design is outdated and boring. Your mission is to completely transform the UI/UX while preserving every existing functionality, API, route, database interaction, and business logic.

The final result should feel like a product built by Apple, Stripe, Linear, Notion, Framer, Vercel, HubSpot, and Raycast — modern, elegant, responsive, fast, and delightful to use.

Company branding

The application belongs to [COMPANY_NAME].

Official website: [WEBSITE_URL]

Use this URL as the branding source.

Requirements:

Automatically extract the official company logo directly from the website.

Do NOT ask me to upload the logo.

Do NOT recreate or redesign the logo.

Do NOT place any text beside, above, or below the logo because the logo already contains the company name.

Use the extracted logo everywhere: login page, sidebar, top navigation, loading screen, browser favicon, splash screen, and empty states where appropriate.

Extract the official color palette from the website and use it throughout the application.

If multiple logo formats exist, prefer SVG or transparent PNG.

Respect the company's visual identity while modernizing the interface.

Note: automatic logo/color extraction from a live site isn't always 100% reliable — keep the official logo file and hex codes on hand as a fallback so the build isn't blocked.

General design

Create a premium modern SaaS experience.

The interface should feel: minimal, elegant, premium, professional, luxurious, clean, fast, intuitive.

Use: beautiful spacing, rounded corners, excellent typography, smooth shadows, soft gradients, glassmorphism only where appropriate, modern cards, excellent hierarchy, beautiful empty states, smooth loading states, a professional color palette, and high-quality icons (Lucide Icons).

Vibrant background:

Add a vibrant, dynamic background across the app — not just on the login page. Use vivid but elegant gradients drawn from the brand color palette, with subtle animated blobs/shapes on key pages (login, dashboard) and blur effects to keep foreground content readable.

Keep it more subtle on data-dense pages (tables, forms) so it doesn't hurt legibility, and more expressive on landing/login/dashboard pages.

Ensure it adapts correctly to both light and dark mode.

Everything should feel polished.

Light & dark mode

Implement a complete Light Mode and Dark Mode.

Add a theme switcher in the top navigation.

Remember the user's preference using local storage.

Automatically detect the system theme on first visit.

Every page and component must support both themes.

Use beautiful dark colors instead of pure black.

Ensure proper contrast and accessibility.

Update: backgrounds, cards, buttons, inputs, tables, charts, sidebars, navigation, modals, tooltips, dropdowns, notifications, login page.

The logo should adapt perfectly for both light and dark backgrounds.

Ensure gradients and shadows are adjusted appropriately for each theme.

Login page

Completely redesign the login page.

Premium centered login card, beautiful responsive layout.

Official [COMPANY_NAME] logo extracted from the website — do NOT write the company name next to the logo.

Beautiful animated, vibrant background: floating gradient blobs, soft mesh gradients, animated geometric shapes, blur effects.

Glassmorphism card, smooth entrance animations.

The login page should include: email field, password field with show/hide, remember me, forgot password, login button, loading state, validation animations.

For demonstration purposes, automatically pre-fill the login credentials in the email and password fields so the app can be tested immediately without typing them manually.

Desktop version: login form on one side, a beautiful industrial illustration or abstract premium graphic on the other side.

Buttons

Redesign every button: primary, secondary, outline, ghost, danger, icon buttons, floating buttons.

Add: beautiful hover animations, active state, focus state, ripple effects, soft shadows, loading animation, disabled state.

Forms

Completely redesign all forms.

Use: floating labels, icons, better spacing, better typography, better validation, animated focus, better error handling, better success states.

Improve: text inputs, password fields, selects, multi-select, checkboxes, switches, radios, date picker, time picker, file upload, textareas.

Search

Create a premium intelligent search component: search icon, rounded design, suggestions, keyboard shortcuts, auto-complete, clear button, smooth animation.

Filters

Completely redesign every filter: advanced filter panel, multi-select chips, date range picker, search inside dropdowns, active filter badges, reset button, apply button, beautiful transitions.

Tables

Redesign every table: sticky headers, zebra rows, better typography, better spacing, hover animation, rounded container, pagination, sorting, search, filters, responsive layout, loading skeletons, empty states.

Sidebar

Create a premium sidebar: smooth collapse animation, active indicator, beautiful icons, user profile, notifications, theme switch, better spacing, better hover effects.

Top navigation

Redesign the navbar: search, notifications, user menu, theme switch, breadcrumb, beautiful spacing, premium shadows.

Cards

Modernize every card: soft shadows, rounded corners, hover elevation, animated borders, beautiful spacing.

Dashboard

Create a premium dashboard: animated KPI cards, beautiful charts, progress indicators, statistics, quick actions, recent activity, modern widgets.

Modals

Redesign every modal: blur background, smooth animation, better spacing, better typography, premium buttons.

Notifications

Create premium toast notifications supporting success, error, warning, information — with beautiful icons, smooth animations, auto-dismiss, progress bar.

Loading

Replace every loading spinner with skeleton loaders, animated placeholders, shimmer effects, and smooth page transitions.

Empty states

Create beautiful empty states with custom illustrations, helpful messages, and CTA buttons.

Animations

Add tasteful animations across the application: fade, slide, scale, hover lift, page transitions, loading transitions, dropdown animations, modal animations, card animations, sidebar animations, button animations. Animations should feel smooth and premium without affecting performance.

Typography

Use a premium font such as Inter, Geist, or Plus Jakarta Sans. Create a clear typography hierarchy.

Responsiveness

The application must be fully responsive for desktop, laptop, tablet, and mobile. Every page should adapt beautifully.

UX improvements

Improve every screen: better alignment, better spacing, better hierarchy, better grouping, fewer clicks, better visual feedback, better accessibility, better consistency. Every interaction should feel modern and intuitive.

IMPORTANT — hard constraints

DO NOT modify: backend, API, routes, database, business logic, existing functionality.

Only redesign and improve the UI/UX.

The final application should look like a premium enterprise SaaS product released in 2026 with exceptional UI, UX, animations, responsiveness, accessibility, a complete Light/Dark mode experience, and a vibrant, brand-consistent background across the app.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/33ebf6e1-2110-4dc7-9e9a-9947227c2a73).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
