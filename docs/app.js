/**
 * LocL.js Documentation Interactive Engine
 */

(function () {
  "use strict";

  // --- Theme Management ---
  const themeToggleBtn = document.getElementById("themeToggle");
  const htmlEl = document.documentElement;

  function initTheme() {
    const savedTheme = localStorage.getItem("locl_docs_theme");
    if (savedTheme) {
      htmlEl.setAttribute("data-theme", savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      htmlEl.setAttribute("data-theme", prefersDark ? "dark" : "light");
    }
  }

  themeToggleBtn?.addEventListener("click", () => {
    const currentTheme = htmlEl.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    htmlEl.setAttribute("data-theme", newTheme);
    localStorage.setItem("locl_docs_theme", newTheme);
  });

  initTheme();

  // --- Mobile Drawer Toggle ---
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");

  mobileMenuBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
  });

  document.addEventListener("click", (e) => {
    if (
      sidebar?.classList.contains("mobile-open") &&
      !sidebar.contains(e.target) &&
      !mobileMenuBtn?.contains(e.target)
    ) {
      sidebar.classList.remove("mobile-open");
    }
  });

  // --- Code Copying ---
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const codeWrapper = btn.closest(".code-wrapper");
      const codeEl = codeWrapper?.querySelector("code");
      if (!codeEl) return;

      try {
        await navigator.clipboard.writeText(codeEl.innerText);
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span>✔ Copied!</span>`;
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      } catch (err) {
        console.error("Copy failed", err);
      }
    });
  });

  // --- Search Index & Modal ---
  const searchModalBackdrop = document.getElementById("searchModalBackdrop");
  const searchInput = document.getElementById("searchInput");
  const searchResultsList = document.getElementById("searchResultsList");
  const searchTrigger = document.getElementById("searchTrigger");

  const searchIndex = [
    { title: "Quick Start & Installation", desc: "5-minute setup and basic usage", hash: "#quickstart" },
    { title: "Configuration Options", desc: "initLocL options: resources, fallbackLanguage, strictParams", hash: "#configuration" },
    { title: "Scopes & Namespaces", desc: "Scoped translator proxies and multi-namespace configuration", hash: "#scopes" },
    { title: "ICU Inline Plurals & Offsets", desc: "{count, plural, offset:1 =0 {...} one {#} other {#}}", hash: "#plurals-icu" },
    { title: "Exact Quantities (=0, =1, =N)", desc: "Numeric exceptions prioritized over CLDR rules", hash: "#plurals-exact" },
    { title: "Native Ordinal Plurals", desc: "1st, 2nd, 3rd, 4th formatting with Intl.PluralRules", hash: "#plurals-ordinal" },
    { title: "CLDR Language Parity", desc: "Language-aware plural category rules across hundreds of locales", hash: "#plurals-cldr" },
    { title: "Developer CLI (`locl`)", desc: "Automated extraction, parity, and compilation", hash: "#cli" },
    { title: "Key Extraction (`locl extract`)", desc: "Source file scanning and key synchronization", hash: "#cli-extract" },
    { title: "Parity & Parameter Linting (`locl check`)", desc: "Deep CI parameter and markup tag mismatch checking", hash: "#cli-check" },
    { title: "AI Machine Translation (`locl translate`)", desc: "DeepL, OpenAI, Google, and Ollama integration with token masking", hash: "#cli-translate" },
    { title: "AOT Bundle Compilation (`locl compile`)", desc: "Pre-bundle JSON files into TypeScript or JavaScript modules", hash: "#cli-compile" },
    { title: "React Integration (`locl-js/react`)", desc: "createLocLReact, useTranslation, useLocL", hash: "#react" },
    { title: "The <Trans /> Component", desc: "Safe JSX tag and component interpolation without dangerouslySetInnerHTML", hash: "#react-trans" },
    { title: "<Link /> & useLocalizedPath", desc: "Localization-aware navigation with prefix strategies", hash: "#react-navigation" },
    { title: "<LocLHydrate /> (SSR Hydration)", desc: "SSR client hydration without layout shifts or unlocalized flashes", hash: "#react-hydrate" },
    { title: "React Server Components (locl-js/server)", desc: "Next.js App Router, AsyncLocalStorage request isolation", hash: "#server" },
    { title: "Server State Dehydration (`dehydrate`)", desc: "Extract server translator state to pass to client components", hash: "#server-dehydrate" },
    { title: "Svelte Integration (`locl-js/svelte`)", desc: "createLocLSvelte readable store and $t auto-subscription in Svelte 4/5", hash: "#frameworks-svelte" },
    { title: "Vue 3 Integration (`locl-js/vue`)", desc: "createLocLVue composable with shallowRef reactivity", hash: "#frameworks-vue" },
    { title: "Vite Plugin & HMR (`locl-js/vite`)", desc: "loclVitePlugin and setupLocLHmr for live translation reload", hash: "#frameworks-vite" },
    { title: "Solid.js & Vanilla JavaScript", desc: "Reactive store subscriptions via translator.subscribe()", hash: "#frameworks-solid" },
    { title: "Built-in Formatters", desc: "list (Intl.ListFormat), languageName, regionName, currency, date", hash: "#formatters" },
    { title: "Multi-Pipe Chaining", desc: "Chain formatters sequentially: {val | trim | upper | truncate:10}", hash: "#formatters-chaining" },
    { title: "OTA Remote Loader (`createRemoteLoader`)", desc: "Stale-While-Revalidate caching with offline fallback", hash: "#remote-loader" },
    { title: "Universal Language Detector", desc: "Browser detector, RFC 7231 Accept-Language, BCP 47 negotiation", hash: "#detector" },
    { title: "Migrating from i18next", desc: "Drop-in i18next compatibility via locl-js/compat", hash: "#migration" },
    { title: "Full API Reference", desc: "Exhaustive TypeScript API declarations and signatures", hash: "#api-reference" }
  ];

  function openSearch() {
    searchModalBackdrop?.classList.add("open");
    searchInput?.focus();
    renderSearchResults("");
  }

  function closeSearch() {
    searchModalBackdrop?.classList.remove("open");
  }

  searchTrigger?.addEventListener("click", openSearch);

  searchModalBackdrop?.addEventListener("click", (e) => {
    if (e.target === searchModalBackdrop) {
      closeSearch();
    }
  });

  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearch();
    }
    if (e.key === "Escape") {
      closeSearch();
    }
  });

  function renderSearchResults(query) {
    if (!searchResultsList) return;
    const q = query.trim().toLowerCase();
    const matches = q
      ? searchIndex.filter((item) =>
          item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
        )
      : searchIndex.slice(0, 8);

    searchResultsList.innerHTML = matches.length
      ? matches
          .map(
            (m) => `
        <li>
          <a href="${m.hash}" class="search-result-item" onclick="document.getElementById('searchModalBackdrop').classList.remove('open')">
            <div class="search-result-title">${m.title}</div>
            <div class="search-result-desc">${m.desc}</div>
          </a>
        </li>
      `
          )
          .join("")
      : `<li style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">No results found for "${query}"</li>`;
  }

  searchInput?.addEventListener("input", (e) => {
    renderSearchResults(e.target.value);
  });

  // --- Live Interactive Playground Simulation ---
  const pgTemplate = document.getElementById("pgTemplate");
  const pgValues = document.getElementById("pgValues");
  const pgLang = document.getElementById("pgLang");
  const pgOutput = document.getElementById("pgOutput");

  const playgroundPresets = {
    icuPlural: {
      template: "{count, plural, offset:1 =0 {No likes yet} =1 {You liked this} one {You and # other person} other {You and # other people}}",
      values: JSON.stringify({ count: 5, user: "Alice" }, null, 2),
      lang: "en"
    },
    listFormatter: {
      template: "Team members present: {members | list}",
      values: JSON.stringify({ members: ["Alice", "Bob", "Charlie", "Diana"] }, null, 2),
      lang: "en"
    },
    displayNames: {
      template: "Target language: {code | languageName:de}. Region: {region | regionName:de}.",
      values: JSON.stringify({ code: "ja", region: "JP" }, null, 2),
      lang: "de"
    },
    multiPipe: {
      template: "Welcome, {username | trim | upper | truncate:10, ...}!",
      values: JSON.stringify({ username: "   alexander_the_great   " }, null, 2),
      lang: "en"
    }
  };

  function updatePlayground() {
    if (!pgTemplate || !pgValues || !pgOutput) return;

    let vals = {};
    try {
      vals = JSON.parse(pgValues.value || "{}");
    } catch {
      pgOutput.innerText = "❌ Invalid JSON in Values";
      return;
    }

    const lang = pgLang?.value || "en";
    let text = pgTemplate.value;

    try {
      // 1. Evaluate ICU Inline Plurals: {field, plural, offset:N cases}
      text = text.replace(/\{(\w+),\s*plural,\s*([\s\S]+?)\}/g, (_, field, body) => {
        const rawCount = vals[field] ?? 0;
        const count = Number(rawCount) || 0;
        let offset = 0;
        const offsetMatch = body.match(/^\s*offset\s*:\s*(\d+)\s*([\s\S]+)$/);
        let casesBody = body;
        if (offsetMatch) {
          offset = parseInt(offsetMatch[1], 10);
          casesBody = offsetMatch[2];
        }

        const countForRules = count - offset;
        const cases = {};
        const caseRegex = /(=?\w+)\s*\{([^{}]+)\}/g;
        let m;
        while ((m = caseRegex.exec(casesBody)) !== null) {
          cases[m[1]] = m[2];
        }

        const exactKey = `=${count}`;
        let chosen = cases[exactKey];
        if (!chosen) {
          try {
            const pr = new Intl.PluralRules(lang, { type: "cardinal" });
            const cat = pr.select(countForRules);
            chosen = cases[cat] ?? cases.other ?? "";
          } catch {
            chosen = cases.other ?? "";
          }
        }

        const numFmt = new Intl.NumberFormat(lang).format(countForRules);
        return chosen.replace(/#/g, numFmt);
      });

      // 2. Evaluate Variables and Formatters: {var | fmt:arg1,arg2}
      text = text.replace(/\{([^{}]+)\}/g, (_, inner) => {
        const parts = inner.split("|").map((s) => s.trim());
        const varName = parts[0];
        let val = vals[varName] !== undefined ? vals[varName] : "";

        for (let i = 1; i < parts.length; i++) {
          const seg = parts[i];
          const colonIdx = seg.indexOf(":");
          const name = colonIdx === -1 ? seg : seg.slice(0, colonIdx).trim();
          const args = colonIdx === -1 ? [] : seg.slice(colonIdx + 1).split(",").map((a) => a.trim());

          if (name === "upper") val = String(val).toUpperCase();
          if (name === "lower") val = String(val).toLowerCase();
          if (name === "trim") val = String(val).trim();
          if (name === "truncate") {
            const len = parseInt(args[0], 10) || 10;
            const suffix = args[1] || "...";
            const s = String(val);
            val = s.length > len ? s.slice(0, len) + suffix : s;
          }
          if (name === "list") {
            try {
              const items = Array.isArray(val) ? val : [String(val)];
              const listFmt = new Intl.ListFormat(args[0] || lang, {
                type: args[1] || "conjunction",
                style: args[2] || "long"
              });
              val = listFmt.format(items);
            } catch {
              val = Array.isArray(val) ? val.join(", ") : String(val);
            }
          }
          if (name === "languageName") {
            try {
              const dn = new Intl.DisplayNames(args[0] || lang, { type: "language" });
              val = dn.of(String(val)) || val;
            } catch {
              val = String(val);
            }
          }
          if (name === "regionName") {
            try {
              const dn = new Intl.DisplayNames(args[0] || lang, { type: "region" });
              val = dn.of(String(val)) || val;
            } catch {
              val = String(val);
            }
          }
          if (name === "currencyName") {
            try {
              const dn = new Intl.DisplayNames(args[0] || lang, { type: "currency" });
              val = dn.of(String(val)) || val;
            } catch {
              val = String(val);
            }
          }
        }
        return String(val);
      });

      pgOutput.innerText = text;
    } catch (err) {
      pgOutput.innerText = "Error: " + err.message;
    }
  }

  pgTemplate?.addEventListener("input", updatePlayground);
  pgValues?.addEventListener("input", updatePlayground);
  pgLang?.addEventListener("change", updatePlayground);

  document.querySelectorAll(".preset-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".preset-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const key = chip.getAttribute("data-preset");
      const preset = playgroundPresets[key];
      if (preset && pgTemplate && pgValues && pgLang) {
        pgTemplate.value = preset.template;
        pgValues.value = preset.values;
        pgLang.value = preset.lang;
        updatePlayground();
      }
    });
  });

  // --- Scroll Spy & Link Highlighting ---
  const sidebarLinks = Array.from(document.querySelectorAll(".sidebar-link"));
  const tocLinks = Array.from(document.querySelectorAll(".toc-link"));
  let isClickScrolling = false;
  let clickTimeout = null;

  function setActiveLink(id) {
    if (!id) return;
    sidebarLinks.forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("active", href === `#${id}`);
    });
    tocLinks.forEach((link) => {
      const href = link.getAttribute("href");
      link.classList.toggle("active", href === `#${id}`);
    });
  }

  // Instant active class update on click
  function handleLinkClick(e) {
    const targetHref = this.getAttribute("href");
    if (targetHref && targetHref.startsWith("#")) {
      const targetId = targetHref.slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        isClickScrolling = true;
        clearTimeout(clickTimeout);
        setActiveLink(targetId);

        // Resume scroll spy after smooth scroll finishes
        clickTimeout = setTimeout(() => {
          isClickScrolling = false;
        }, 800);
      }
      if (sidebar?.classList.contains("mobile-open")) {
        sidebar.classList.remove("mobile-open");
      }
    }
  }

  sidebarLinks.forEach((link) => link.addEventListener("click", handleLinkClick));
  tocLinks.forEach((link) => link.addEventListener("click", handleLinkClick));

  function onScroll() {
    if (isClickScrolling) return;

    const scrollPos = window.scrollY + 130;
    const trackedElements = Array.from(document.querySelectorAll("section[id], h2[id], h3[id]"));
    let currentId = "";

    // Find the last section/heading that has been scrolled past
    for (let i = 0; i < trackedElements.length; i++) {
      const el = trackedElements[i];
      if (el.offsetTop <= scrollPos) {
        currentId = el.getAttribute("id");
      } else {
        break;
      }
    }

    if (currentId) {
      setActiveLink(currentId);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  // Handle initial hash on page load
  if (window.location.hash) {
    const initialId = window.location.hash.slice(1);
    setActiveLink(initialId);
  }
})();
