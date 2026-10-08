import { initLocL } from "../src/index.js";

describe("Reactivity, Dynamic Resources, and Modern Features", () => {
  const resources = {
    en: {
      welcome: "Hello, {name}!",
      welcome_double: "Hello, {{name}}!",
      items: {
        one: "You have 1 item.",
        other: "You have {count} items."
      },
      tags: "Click <link>here</link> or read <bold>more</bold>."
    },
    de: {
      welcome: "Hallo, {name}!",
      welcome_double: "Hallo, {{name}}!",
      items: {
        one: "Du hast 1 Artikel.",
        other: "Du hast {count} Artikel."
      },
      tags: "Klicke <link>hier</link> oder lies <bold>mehr</bold>."
    }
  };

  it("should support subscribe store contract with immediate callback and updates", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    const received: string[] = [];

    const unsubscribe = translator.subscribe((lang) => {
      received.push(lang);
    });

    // Should call immediately with current language (Svelte store contract)
    expect(received).toEqual(["en"]);

    // Should call on changeLanguage
    translator.changeLanguage("de");
    expect(received).toEqual(["en", "de"]);

    // Unsubscribe should prevent further calls
    unsubscribe();
    translator.changeLanguage("en");
    expect(received).toEqual(["en", "de"]);
  });

  it("should provide getLanguage()", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    expect(translator.getLanguage()).toBe("en");
    translator.changeLanguage("de");
    expect(translator.getLanguage()).toBe("de");
  });

  it("should support both single {var} and double {{var}} curly brackets", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    expect(translator.t("welcome", { name: "Sam" })).toBe("Hello, Sam!");
    expect(translator.t("welcome_double", { name: "Sam" })).toBe("Hello, Sam!");
  });

  it("should resolve object plurals automatically inside t() when count is passed", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });
    expect(translator.t("items", { count: 1 })).toBe("You have 1 item.");
    expect(translator.t("items", { count: 5 })).toBe("You have 5 items.");

    translator.changeLanguage("de");
    expect(translator.t("items", { count: 1 })).toBe("Du hast 1 Artikel.");
    expect(translator.t("items", { count: 5 })).toBe("Du hast 5 Artikel.");
  });

  it("should support dynamic addResource and addResources", () => {
    const translator = initLocL({
      resources: { en: {}, de: {} },
      fallbackLanguage: "en"
    });

    translator.addResource("en", "dynamic.greeting", "Hi there!");
    expect(translator.tt("dynamic.greeting")).toBe("Hi there!");

    translator.addResources("en", {
      auth: {
        login: "Log in",
        logout: "Log out"
      }
    });

    expect(translator.tt("auth.login")).toBe("Log in");
    expect(translator.tt("auth.logout")).toBe("Log out");
  });

  it("should support rich tag interpolation via rich() method", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });

    const chunks = translator.rich("tags", {
      link: (text) => `[A:${text}]`,
      bold: (text) => `[B:${text}]`
    });

    expect(chunks.join("")).toBe("Click [A:here] or read [B:more].");
  });
});
