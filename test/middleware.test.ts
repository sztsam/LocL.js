import { resolveRouteLocale, createI18nMiddleware, formatCookieHeader, handleI18nRouting, getHreflangLinks, getLocalizedPath } from "../src/detector/middleware.js";

describe("Next.js & Full-Stack Route Middleware Helper", () => {
  const options = {
    locales: ["en", "de", "es"] as const,
    defaultLocale: "en"
  };

  describe("resolveRouteLocale — Prefix Strategy 'as-needed' (Default)", () => {
    it("should serve default locale on root path without redirect", () => {
      const res = resolveRouteLocale({ url: "https://example.com/" }, options);
      expect(res.locale).toBe("en");
      expect(res.pathname).toBe("/");
      expect(res.shouldRedirect).toBe(false);
      expect(res.headers["x-locl-locale"]).toBe("en");
    });

    it("should redirect root path if user prefers non-default locale", () => {
      const res = resolveRouteLocale(
        {
          url: "https://example.com/about",
          headers: { "accept-language": "de-DE,de;q=0.9" }
        },
        options
      );
      expect(res.shouldRedirect).toBe(true);
      expect(res.redirectUrl).toBe("/de/about");
      expect(res.locale).toBe("de");
    });

    it("should serve prefixed path for non-default locale without redirect", () => {
      const res = resolveRouteLocale({ url: "https://example.com/de/dashboard" }, options);
      expect(res.shouldRedirect).toBe(false);
      expect(res.locale).toBe("de");
      expect(res.pathname).toBe("/dashboard");
    });

    it("should redirect prefixed path to unprefixed path for default locale", () => {
      const res = resolveRouteLocale({ url: "https://example.com/en/about?ref=locl" }, options);
      expect(res.shouldRedirect).toBe(true);
      expect(res.redirectUrl).toBe("/about?ref=locl");
      expect(res.locale).toBe("en");
    });
  });

  describe("resolveRouteLocale — Prefix Strategy 'always'", () => {
    const alwaysOpts = { ...options, prefixStrategy: "always" as const };

    it("should redirect unprefixed path to default locale prefix", () => {
      const res = resolveRouteLocale({ url: "https://example.com/about" }, alwaysOpts);
      expect(res.shouldRedirect).toBe(true);
      expect(res.redirectUrl).toBe("/en/about");
    });

    it("should not redirect if locale prefix is present", () => {
      const res = resolveRouteLocale({ url: "https://example.com/en/about" }, alwaysOpts);
      expect(res.shouldRedirect).toBe(false);
      expect(res.locale).toBe("en");
      expect(res.pathname).toBe("/about");
    });
  });

  describe("resolveRouteLocale — Prefix Strategy 'never'", () => {
    const neverOpts = { ...options, prefixStrategy: "never" as const };

    it("should strip locale prefix and redirect to unprefixed path", () => {
      const res = resolveRouteLocale({ url: "https://example.com/de/about" }, neverOpts);
      expect(res.shouldRedirect).toBe(true);
      expect(res.redirectUrl).toBe("/about");
      expect(res.locale).toBe("de");
    });

    it("should serve unprefixed path using detected locale without redirect", () => {
      const res = resolveRouteLocale(
        {
          url: "https://example.com/about",
          headers: { cookie: "NEXT_LOCALE=de" }
        },
        neverOpts
      );
      expect(res.shouldRedirect).toBe(false);
      expect(res.locale).toBe("de");
      expect(res.pathname).toBe("/about");
    });
  });

  describe("Asset & API Route Ignoring", () => {
    it("should automatically ignore Next.js internals and static assets", () => {
      expect(resolveRouteLocale({ url: "https://example.com/_next/static/chunk.js" }, options).isIgnored).toBe(true);
      expect(resolveRouteLocale({ url: "https://example.com/favicon.ico" }, options).isIgnored).toBe(true);
      expect(resolveRouteLocale({ url: "https://example.com/images/hero.png" }, options).isIgnored).toBe(true);
      expect(resolveRouteLocale({ url: "https://example.com/api/user" }, options).isIgnored).toBe(true);
    });

    it("should respect custom ignore lists and predicates", () => {
      const customOpts = {
        ...options,
        ignore: ["/custom-hook", /^\/webhooks/]
      };
      expect(resolveRouteLocale({ url: "https://example.com/custom-hook/test" }, customOpts).isIgnored).toBe(true);
      expect(resolveRouteLocale({ url: "https://example.com/webhooks/stripe" }, customOpts).isIgnored).toBe(true);
      expect(resolveRouteLocale({ url: "https://example.com/dashboard" }, customOpts).isIgnored).toBe(false);
    });
  });

  describe("createI18nMiddleware Web Response Execution", () => {
    const middleware = createI18nMiddleware(options);

    it("should return a 307 redirect Response when redirection is needed", () => {
      const req = {
        url: "https://example.com/en/about",
        headers: new Headers()
      };
      const response = middleware(req);
      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/about");
      expect(response.headers.get("Set-Cookie")).toContain("NEXT_LOCALE=en");
    });

    it("should return a 200 Response with routing headers when path is valid", () => {
      const req = {
        url: "https://example.com/de/about",
        headers: new Headers()
      };
      const response = middleware(req);
      expect(response.status).toBe(200);
      expect(response.headers.get("x-locl-locale")).toBe("de");
      expect(response.headers.get("x-locl-pathname")).toBe("/about");
    });
  });

  describe("Middleware & Route Resolution Edge Cases", () => {
    it("should cover ignore function, ignore __next, malformed cookie, invalid URL, and request.cookies", () => {
      expect(resolveRouteLocale({ url: "https://example.com/ignored-fn" }, { ...options, ignore: (p) => p === "/ignored-fn" }).isIgnored).toBe(true);

      expect(resolveRouteLocale({ url: "https://example.com/__next/static" }, options).isIgnored).toBe(true);

      expect(resolveRouteLocale({ url: "https://example.com/about", headers: { cookie: "NEXT_LOCALE=%" } }, options).locale).toBe("en");

      expect(resolveRouteLocale({ url: "https://example.com/about", headers: { cookie: "noequals" } }, options).locale).toBe("en");

      expect(resolveRouteLocale({ url: "http://[invalid" }, options).pathname).toBe("/");

      const resCookiesGet = resolveRouteLocale({
        url: "https://example.com/about",
        cookies: { get: (name: string) => (name === "NEXT_LOCALE" ? { value: "de" } : undefined) }
      }, options);
      expect(resCookiesGet.locale).toBe("de");

      const resCookiesObj = resolveRouteLocale({
        url: "https://example.com/about",
        cookies: { NEXT_LOCALE: "es" }
      }, options);
      expect(resCookiesObj.locale).toBe("es");

      expect(resolveRouteLocale({ url: "https://example.com/about?customLang=de" }, { ...options, queryParam: "customLang" }).locale).toBe("de");
      expect(resolveRouteLocale({ url: "https://example.com/about?locale=es" }, options).locale).toBe("es");

      expect(resolveRouteLocale({ url: "https://example.com/about" }, { ...options, setCookie: false }).cookie).toBeUndefined();

      const formatted = formatCookieHeader("NEXT_LOCALE", "de", { secure: true, domain: "example.com" });
      expect(formatted).toContain("; Secure");
      expect(formatted).toContain("; Domain=example.com");

      const rootRedirect = resolveRouteLocale({
        url: "https://example.com/",
        headers: { "accept-language": "de" }
      }, options);
      expect(rootRedirect.shouldRedirect).toBe(true);
      expect(rootRedirect.redirectUrl).toBe("/de");

      const alwaysRoot = resolveRouteLocale({
        url: "https://example.com/",
        headers: { "accept-language": "en" }
      }, { ...options, prefixStrategy: "always" });
      expect(alwaysRoot.shouldRedirect).toBe(true);
      expect(alwaysRoot.redirectUrl).toBe("/en");

      expect(resolveRouteLocale({ url: "https://example.com/about", headers: { cookie: "emptyVal=; =emptyKey; NEXT_LOCALE=de" } }, options).locale).toBe("de");
    });

    it("should handle createI18nMiddleware ignored routes, redirect URL errors, and handleI18nRouting", () => {
      const mw = createI18nMiddleware(options);

      const ignoredRes = mw({ url: "https://example.com/api/test", headers: new Headers() });
      expect(ignoredRes.status).toBe(200);

      const redirectCatchRes = mw({ url: "http://[invalid/en/about", headers: new Headers() });
      expect(redirectCatchRes.status).toBe(307);
      expect(redirectCatchRes.headers.get("Location")).toBe("/about");

      expect(typeof handleI18nRouting).toBe("function");
      const mw2 = handleI18nRouting(options);
      expect(mw2({ url: "https://example.com/de/about", headers: new Headers() }).status).toBe(200);

      const mwNoCookie = createI18nMiddleware({ ...options, setCookie: false });
      const res307NoCookie = mwNoCookie({ url: "https://example.com/en/about", headers: new Headers() });
      expect(res307NoCookie.status).toBe(307);
      expect(res307NoCookie.headers.get("Set-Cookie")).toBeNull();

      const res200NoCookie = mwNoCookie({ url: "https://example.com/about", headers: new Headers() });
      expect(res200NoCookie.status).toBe(200);
      expect(res200NoCookie.headers.get("Set-Cookie")).toBeNull();
    });

    it("should generate valid alternate hreflang links", () => {
      // Test default prefixStrategy argument ("as-needed")
      const defaultLinks = getHreflangLinks("https://example.com", "/about", ["en", "de", "es"], "en");
      expect(defaultLinks).toEqual([
        { rel: "alternate", hreflang: "en", href: "https://example.com/about" },
        { rel: "alternate", hreflang: "de", href: "https://example.com/de/about" },
        { rel: "alternate", hreflang: "es", href: "https://example.com/es/about" },
        { rel: "alternate", hreflang: "x-default", href: "https://example.com/about" }
      ]);

      // Test prefixStrategy: "never" with root path "/" (exercises cleanPath || "/" fallback)
      const neverRootLinks = getHreflangLinks("https://example.com", "/", ["en", "de"], "en", "never");
      expect(neverRootLinks[0].href).toBe("https://example.com/");
    
      // Trailing slash in baseUrl exercises end-- and cleanBase.slice(0, end)
      const links = getHreflangLinks("https://example.com/", "/about", ["en", "de"], "en");
      expect(links[0].href).toBe("https://example.com/about");

      // Multiple trailing slashes
      const linksMulti = getHreflangLinks("https://example.com///", "/about", ["en", "de"], "en");
      expect(linksMulti[0].href).toBe("https://example.com/about");

      // Unknown/unmatched prefixStrategy in resolveRouteLocale exercises the else branch of strategy === "never"
      const resUnknown = resolveRouteLocale(
        { url: "https://example.com/about" },
        // @ts-expect-error
        { locales: ["en", "de"], defaultLocale: "en", prefixStrategy: "custom" }
      );
      expect(resUnknown.locale).toBe("en");
    });

    it("should resolve localized paths with getLocalizedPath", () => {
      // Omit prefixStrategy to trigger default `prefixStrategy = "as-needed"`
      expect(getLocalizedPath("/about", "de", "en")).toBe("/de/about");

      // Root path "/" with "as-needed" (triggers pathWithoutLocale === "/" branch -> "/de")
      expect(getLocalizedPath("/", "de", "en", "as-needed")).toBe("/de");

      // Root path "/" with "always" (triggers pathWithoutLocale === "/" branch -> "/en")
      expect(getLocalizedPath("/", "en", "en", "always")).toBe("/en");

      // Standard paths
      expect(getLocalizedPath("/about", "de", "en", "as-needed")).toBe("/de/about");
      expect(getLocalizedPath("/about", "en", "en", "as-needed")).toBe("/about");
      expect(getLocalizedPath("about", "en", "en", "as-needed")).toBe("/about");
      expect(getLocalizedPath("/about", "de", "en", "always")).toBe("/de/about");
      expect(getLocalizedPath("/about", "en", "en", "always")).toBe("/en/about");
      expect(getLocalizedPath("/de/about", "en", "en", "never")).toBe("/about");

      expect(getLocalizedPath("/de/about", "en", "en", "never", ["en", "de"])).toBe("/about");
      expect(getLocalizedPath("/about", "en", "en", "never", ["en", "de"])).toBe("/about");
    });
  });
});