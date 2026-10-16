# Server Components & Full-Stack (`locl-js/server`)

LocL.js provides headless async request isolation powered by Node's native `AsyncLocalStorage`. Designed specifically for **React Server Components (RSC)**, **Next.js App Router**, **Remix**, **Astro**, and backend Node servers (Express/Fastify), you get compile-time typed translations on the server with zero client bundle overhead and no `"use client"` directives.

---

## Architecture: Why `AsyncLocalStorage`?

In server environments, concurrent incoming HTTP requests must not leak locale preferences into each other. LocL uses Node.js `AsyncLocalStorage` to bind request-scoped translations to the asynchronous execution tree, ensuring 100% thread-safe isolation without prop-drilling.

---

## 1. Setup Server Suite (`src/i18n-server.ts`)

```typescript
import { initLocL, defineResources } from "locl-js";
import { createLocLServer } from "locl-js/server";

export const translator = initLocL({
  resources: defineResources({
    en: {
      dashboard: {
        title: "Analytics Dashboard",
        greeting: "Welcome, {name}!",
        stats: "{count, plural, one {# active visitor} other {# active visitors}}"
      }
    },
    de: {
      dashboard: {
        title: "Analytik-Übersicht",
        greeting: "Willkommen, {name}!",
        stats: "{count, plural, one {# aktiver Besucher} other {# aktive Besucher}}"
      }
    }
  }),
  fallbackLanguage: "en"
});

export const {
  getTranslator,
  getTranslations,
  getSyncTranslator,
  runWithLocale,
  runWithTranslator,
  getLocale,
  setLocale
} = createLocLServer(translator);
```

---

## 2. Using in Next.js Server Components

In Next.js App Router, call `await getTranslator()` directly in your async Server Components:

```tsx
// app/[locale]/page.tsx (Server Component — no "use client"!)
import { getTranslator } from "@/i18n-server";

export default async function Page() {
  const t = await getTranslator();

  return (
    <main>
      <h1>{t("dashboard.title")}</h1>
      <p>{t("dashboard.greeting", { name: "Alice" })}</p>
      <p>{t("dashboard.stats", { count: 120 })}</p>
    </main>
  );
}
```

### Scoped Translations on the Server

Pass a namespace to scope autocompletion:

```tsx
export default async function DashboardPage() {
  const t = await getTranslator("dashboard");

  return (
    <section>
      <h1>{t("title")}</h1>
      <p>{t("greeting", { name: "Bob" })}</p>
    </section>
  );
}
```

---

## 3. Server Translator Capabilities

The resolved `t` object is both a callable translation function and a feature-packed utility:

```typescript
const t = await getTranslator();

// 1. Direct translation
t("dashboard.title");
t("dashboard.greeting", { name: "Sarah" });

// 2. Plural and Ordinal helpers
t.plural("dashboard.stats", { count: 5 });
t.ordinal("rank.placement", { count: 1 });

// 3. Direction and RTL inspection
t.language;       // "en"
t.direction;      // "ltr"
t.isRTL();        // false
t.getMetadata();  // { language: "en", direction: "ltr", isRTL: false }

// 4. Standalone formatting
t.format("2026-10-16", "date", ["short"]);

// 5. Access underlying LocL instance
t.translator;
```

---

## 4. Middleware & Request Isolation (`runWithLocale`)

Bind the active language for the entire request lifecycle:

```typescript
// middleware.ts or custom HTTP handler
import { runWithLocale } from "@/i18n-server";

export async function middleware(request: Request, next: () => Promise<Response>) {
  const locale = request.headers.get("x-locale") || "en";

  return runWithLocale(locale, () => {
    // All downstream Server Components will resolve this locale automatically!
    return next();
  });
}
```

---

## 5. Dehydrating Server State for Client Hydration (`dehydrate`)

In mixed Server + Client component architectures, extract the server translator's state and pass it down to `<LocLHydrate />` to prevent hydration mismatches:

```tsx
// app/[locale]/layout.tsx (Server Component Layout)
import { getTranslator, dehydrate } from "@/i18n-server";
import { ClientRoot } from "@/components/ClientRoot";

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslator();
  const dehydratedState = dehydrate(t);

  return (
    <html lang={dehydratedState.locale} dir={dehydratedState.direction}>
      <body>
        <ClientRoot state={dehydratedState}>
          {children}
        </ClientRoot>
      </body>
    </html>
  );
}
```

And in your client wrapper:

```tsx
// src/components/ClientRoot.tsx ("use client")
import React from "react";
import { LocLProvider, LocLHydrate } from "locl-js/react";
import { clientTranslator } from "@/i18n-client";

export function ClientRoot({ state, children }: { state: any; children: React.ReactNode }) {
  return (
    <LocLProvider translator={clientTranslator}>
      <LocLHydrate state={state}>
        {children}
      </LocLHydrate>
    </LocLProvider>
  );
}
```
