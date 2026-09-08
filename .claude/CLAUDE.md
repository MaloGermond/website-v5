# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal portfolio site (malogermond.com) built with Astro + Preact islands + Tailwind CSS v4. Bilingual (fr/en), content-driven from JSON locale files, with per-project case-study pages (currently: Unistellar).

UI/UX decisions (spacing, color tokens, animation, accessibility, typography) are governed by `.claude/rules/best-practices.md`, loaded automatically every session.

## Commands

```sh
npm run dev             # Start dev server at localhost:4321
npm run build            # Production build to ./dist/
npm run preview          # Preview the production build locally
npm run astro check      # Type-check .astro files
npm run format           # Format with Prettier
npm run format:check     # Check formatting without writing
node scripts/generateImageMetadata.js <dir>   # Scan a folder for png/jpg and add missing entries to <dir>/images-metadata.json (fr/en alt text stubs)
```

There is no test suite and no lint script configured.

## Architecture

### Routing & i18n

Locales are declared in `src/locales/config.json` (`locales`, `defaultLocale`). Routes live under `src/pages/[lang]/`:
- `src/pages/[lang]/index.astro` — home page, `getStaticPaths` fans out one path per locale.
- `src/pages/[lang]/[project]/index.astro` — case-study page. `getStaticPaths` cross-products locales with a **hardcoded** `projects` array (currently just `['unistellar']`) — add new case studies there. It then dynamically imports `src/layouts/project/<project>.astro` via `import.meta.glob`, so a new project needs a matching file in `src/layouts/project/`.
- `src/pages/index.astro` is empty (root `/` has no content); the real entry point is `/<lang>/`.

Content is not colocated with components — it lives in `src/locales/*.json` and is pulled in through `getTranslation(lang, projectName?)` in `src/utils/handleLocales.js`, which globs all locale JSON eagerly and looks up either `<lang>.json` (site-wide copy) or `<project>_<lang>.json` (per-project copy). Every page/layout receives a `content` object from this lookup and reads copy off it — there's no i18n key-lookup helper, the whole translated tree is passed down.

`LanguageSwitcher.astro` derives the opposite-language URL by string-splitting the current pathname, so route shapes must stay `/<lang>/...`.

### Project case-study pages

`src/layouts/project/unistellar.astro` is the template for a case study; each new project gets its own file here following the same shape (hero, context, mosaic, frames) driven by its `content` prop.

Images for a case study live in `src/assets/unistellar/` alongside a hand-authored `images-metadata.json` (per-image `alt.fr`/`alt.en`). `scripts/generateImageMetadata.js` bootstraps new entries but does not fill in the alt text — that's manual. `src/utils/useScreens.js` (`loadScreensOnce`) globs the image folder, resolves each with Astro's asset pipeline, merges in the metadata, and memoizes the result in a module-level cache — call it once per project layout, not per component.

`Mosaic.astro` filters the loaded images by `name.startsWith('screen-')` to build its grid; naming screenshots `screen-*` is what makes them show up there.

### Path aliases

Defined in `astro.config.mjs` under `vite.resolve.alias` — always import through these rather than relative paths:
`@` → `src`, `@components`, `@layouts`, `@assets`, `@styles`, `@analytics` → `src/components/analytics`, `@locales`, `@utils`.

### Styling

Tailwind v4 via `@tailwindcss/vite`, configured inline in `src/styles/global.css` with `@theme` (custom `gray` scale in oklch, `font-satoshi`/`font-avara`) rather than a `tailwind.config.js`. Dark mode is class-based (`@custom-variant dark (&:where(.dark, .dark *))`) and toggled by `ThemeSwitcher.jsx` (a Preact island, `client:load`), which reads/writes `localStorage('theme')` and toggles the `light`/`dark` class on `<html>`. Custom entrance-animation utilities (`fade-in`, `animation-duration-*`, `animation-delay-*`) are also defined here rather than via a JS animation library, even though `gsap` is a dependency (available for more complex sequences).

### Islands

Preact is used only where interactivity is needed (`client:load` directive), e.g. `ThemeSwitcher.jsx`. Everything else is static `.astro` components — default to `.astro` unless client-side state/reactivity is actually required.

## Code style

- **Pure functions by default.** Any new function (in `.js`/`.jsx`/frontmatter scripts) should be pure — no side effects, deterministic, depends only on its parameters — unless the framework forces otherwise (e.g. a Preact event handler, a `useEffect`). An impure function must be tagged `@impure` in its JSDoc and list its side effects/external dependencies; a pure one gets `@pure`.
  ```js
  /** @pure */
  function getAvailableLocales(config) {
    return config.locales;
  }

  /** @impure - writes to localStorage, mutates document.documentElement */
  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }
  ```
- **Validate early, return early.** Check inputs at the top of a function and `return`/throw immediately on invalid input rather than nesting the valid path inside an `if`.
- **No nested conditionals.** Prefer early returns over nested `if`s.
- **No nested arrays-in-chains.** Extract a named helper instead of `array.map(item => item.subArray.map(...))`.
- **One responsibility per function**, ideally under ~20 lines; group related functions and separate pure from impure.

## Workflow

- **Branches**: create a dedicated branch off `dev` (never `main`), named `<ticket-number>-<ticket-name>` in kebab-case (e.g. `42-add-dark-mode`). Without a ticket number, use a `feature/` or `bugfix/` prefix.
- **Commits**: see `.claude/rules/commit-convention.md` for the commit message convention (gitmoji + description format, glossary, examples).
- **Pull requests**: open PRs as **draft**, targeting `dev` (never `main`). If the branch/task maps to a GitHub issue, link it in the PR description with a closing keyword (`Closes #<number>`, `Fixes #<number>`).
