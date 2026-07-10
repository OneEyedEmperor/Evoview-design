# Vite React SPA

Single-page application built with Vite, React, TypeScript, and Tailwind CSS v4.

## Commands

- `pnpm dev` - Start dev server
- `pnpm build` - Type-check and build for production
- `pnpm preview` - Preview production build

## Stack

- **Vite 7** - Build tool and dev server
- **React 19** - UI framework
- **TypeScript 5.9** - Strict mode enabled
- **Tailwind CSS v4** - Styling via `@tailwindcss/vite` plugin (no PostCSS config needed)
- **React Router DOM v7** - Client-side routing
- **shadcn/ui** - Component library (new-york style, Lucide icons)

## Structure

```
src/
  main.tsx          - React root entry point
  App.tsx           - Router setup
  index.css         - Tailwind imports + CSS variables (light/dark themes)
  pages/            - Route page components
  components/       - Shared components
  components/ui/    - shadcn/ui components
  lib/utils.ts      - cn() utility (clsx + tailwind-merge)
```

## Key Patterns

- Path alias: `@/` maps to `./src/`
- Add shadcn components: `npx shadcn@latest add <component>`
- Dark mode: toggle `.dark` class on root element, use CSS variables
- Routing: file-based pages in `src/pages/`, registered in `App.tsx`
- Theming: CSS variables in `src/index.css` (`:root` for light, `.dark` for dark)
