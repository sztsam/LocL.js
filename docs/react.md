# React Integration (`locl-js/react`)

LocL provides official React bindings designed for concurrency safety, zero unnecessary re-renders, and full compatibility with both Client Components and React Server Components (RSC).

---

## Installation

```bash
npm install locl-js
```

LocL's React bindings are located in `locl-js/react` and support React 18 and React 19.

---

## Recommended Workflow: `createLocLReact`

The fastest and most ergonomic way to use LocL in React is the `createLocLReact` factory. It creates a pre-bound React suite tailored to your translator's type schema with zero manual `.d.ts` declaration merging:

```tsx
// src/i18n-react.ts
import { initLocL, defineResources } from "locl-js";
import { createLocLReact } from "locl-js/react";

export const translator = initLocL({
  resources: defineResources({
    en: {
      nav: { home: "Home", about: "About", pricing: "Pricing" },
      welcome: "Welcome back, {name}!",
      notice: "Please <bold>read</bold> our <link href=\"/terms\">terms</link>."
    },
    de: {
      nav: { home: "Startseite", about: "Über uns", pricing: "Preise" },
      welcome: "Willkommen zurück, {name}!",
      notice: "Bitte <bold>lesen</bold> Sie unsere <link href=\"/terms\">AGB</link>."
    }
  }),
  fallbackLanguage: "en"
});

export const {
  LocLProvider,
  useTranslation,
  useLocL,
  Trans,
  Hydrate,
  Link,
  useLocalizedPath
} = createLocLReact(translator);
```

Wrap your root application in `<LocLProvider>`:

```tsx
// src/App.tsx
import React from "react";
import { LocLProvider, useTranslation } from "./i18n-react";

export function App() {
  return (
    <LocLProvider>
      <Header />
      <MainContent />
    </LocLProvider>
  );
}

function Header() {
  const { t, language, changeLanguage, direction } = useTranslation();

  return (
    <header dir={direction}>
      <p>{t("welcome", { name: "Alice" })}</p>
      <button onClick={() => changeLanguage("de")}>
        Switch to German (Current: {language})
      </button>
    </header>
  );
}
```

---

## Scoped Autocomplete: `useTranslation(scope)`

Narrow down autocompletion and keys to a specific namespace by passing a scope:

```tsx
function Navigation() {
  // Autocomplete strictly offers "home" | "about" | "pricing"
  const { t } = useTranslation("nav");

  return (
    <nav>
      <a href="/">{t("home")}</a>
      <a href="/about">{t("about")}</a>
      <a href="/pricing">{t("pricing")}</a>
    </nav>
  );
}
```

---

## Localized Navigation: `<Link />` & `useLocalizedPath`

LocL automatically generates and normalizes localized links according to your routing prefix strategy (`"as-needed"`, `"always"`, or `"never"`):

```tsx
import { Link, useLocalizedPath } from "./i18n-react";

export function Navbar() {
  const getPath = useLocalizedPath("as-needed");

  return (
    <nav>
      {/* If 'en' is default: renders href="/about"
          If 'de' is active:  renders href="/de/about" */}
      <Link href="/about">About Us</Link>

      {/* Force a specific target locale */}
      <Link href="/pricing" locale="fr">Tarifs (French)</Link>

      {/* Force prefix regardless of default locale */}
      <Link href="/contact" prefixStrategy="always">Contact</Link>

      {/* Programmatic path helper */}
      <button onClick={() => window.location.href = getPath("/settings")}>
        Settings
      </button>
    </nav>
  );
}
```

---

## SSR Hydration: `<LocLHydrate />`

When rendering server components or HTML on the server, pass the serialized state to `<LocLHydrate />` on the client. It seeds the translator immediately and renders a `<script id="__LOCL_DATA__" type="application/json">` block, preventing UI flickering and hydration errors:

```tsx
// src/components/ClientRoot.tsx ("use client")
import React from "react";
import { LocLProvider, LocLHydrate } from "locl-js/react";
import { translator } from "@/i18n";

export function ClientRoot({ state, children }: { state: any; children: React.ReactNode }) {
  return (
    <LocLProvider translator={translator}>
      <LocLHydrate state={state}>
        {children}
      </LocLHydrate>
    </LocLProvider>
  );
}
```

---

## The `<Trans />` Component

Safely interpolate formatting tags (`<bold>`, `<em>`), links (`<link href="/path">`), and self-closing tags (`<br />`) without `dangerouslySetInnerHTML`:

```tsx
import { Trans } from "./i18n-react";

function TermsNotice() {
  return (
    <Trans
      i18nKey="notice"
      components={{
        bold: <strong className="font-semibold text-primary" />,
        link: <a href="/terms" target="_blank" className="underline" />
      }}
      fallback="Please read our terms."
    />
  );
}
```

### `<Trans />` Capabilities

- **Strict Prop Checking**: If a translation key contains `{user}`, the `values={{ user: ... }}` prop is required at compile time.
- **Tag Attributes**: Preserves attributes written in the translation or provided on JSX element clones.
- **Nested Markup**: Handles nested tags cleanly (`<bold>Click <link>here</link></bold>`).
- **Function Renderers**: Pass a callback renderer `(children) => <span className="highlight">{children}</span>`.
- **Concurrent-Safe**: Driven by React's native `useSyncExternalStore` for flicker-free concurrent re-rendering.

---

## React `<Suspense>` Lazy Loading

Load translation namespaces on demand using dynamic `import()`:

```tsx
import React, { Suspense } from "react";
import { useTranslation } from "./i18n-react";

function LazyDashboard() {
  // Suspends component until the 'dashboard' bundle is downloaded
  const { t } = useTranslation("dashboard", { suspense: true });

  return <h1>{t("title")}</h1>;
}

export function Page() {
  return (
    <Suspense fallback={<div>Loading translations...</div>}>
      <LazyDashboard />
    </Suspense>
  );
}
```
