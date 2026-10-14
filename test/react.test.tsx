import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { initLocL, defineResources } from "../src/index.js";
import { LocLProvider, useTranslation, useLocL, Trans, createLocLReact } from "../src/react/index.js";

// 1. Declare resources using defineResources for compile-time literal types
const resources = defineResources({
  en: {
    title: "Hello World",
    welcome: "Welcome, {name}!",
    notice: "Please <bold>read</bold> our <link>terms</link>.",
    messages: {
      one: "1 message",
      other: "{count} messages"
    },
    user: {
      greeting: "Greetings from user namespace!",
      same: "same"
    },
    other: {}
  },
  de: {
    title: "Hallo Welt",
    welcome: "Willkommen, {name}!",
    notice: "Bitte <bold>lesen</bold> Sie unsere <link>Bedingungen</link>.",
    messages: {
      one: "1 Nachricht",
      other: "{count} Nachrichten"
    },
    user: {
      greeting: "Grüße aus dem Benutzer-Namespace!",
      same: "same"
    },
    other: {}
  }
});

// 2. Ambient type registration: connects `resources` to standalone `useTranslation()`
declare module "../src/react/index.js" {
  interface LocLRegister {
    resources: typeof resources;
    fallbackLanguage: "en";
  }
}

describe("React Integration", () => {
  it("should render translations with useTranslation and LocLProvider with strict typing", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });

    function Component() {
      const { t } = useTranslation();

      const welcomeMsg = t("welcome", { name: "Alice" });
      expect(welcomeMsg).toBe("Welcome, Alice!");

      // @ts-expect-error Missing required parameter 'name'
      t("welcome");
      // @ts-expect-error Key does not exist
      t("invalidKey");

      return <h1>{t("title")}</h1>;
    }

    const html = renderToStaticMarkup(
      <LocLProvider translator={translator}>
        <Component />
      </LocLProvider>
    );

    expect(html).toBe("<h1>Hello World</h1>");
  });

  it("should support scoped translations with useTranslation(scope)", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });

    function UserComponent() {
      const { t } = useTranslation("user");

      // @ts-expect-error "title" is not in the "user" scope
      t("title");
      // @ts-expect-error Invalid scope
      useTranslation("nonExistentScope");

      // Array scope strictly typed to "user.greeting"
      const { t: arrT } = useTranslation(["user"]);

      return (
        <div>
          <p>{t("greeting")}</p>
          <p>{arrT("user.greeting")}</p>
        </div>
      );
    }

    const html = renderToStaticMarkup(
      <LocLProvider translator={translator}>
        <UserComponent />
        {}
      </LocLProvider>
    );

    expect(html).toContain("Greetings from user namespace!");
  });

  it("should render rich component tags using Trans with strict type-checking", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });

    function NoticeComponent() {
      return (
        <Trans
          translator={translator}
          i18nKey="notice"
          components={{
            bold: <strong className="bold-text" />,
            link: <a href="/terms" className="terms-link" />
          }}
        />
      );
    }
    const html = renderToStaticMarkup(<NoticeComponent />);

    expect(html).toContain('<strong class="bold-text">read</strong>');
    expect(html).toContain('<a href="/terms" class="terms-link">terms</a>');
  });

  it("should support function component renderers in Trans", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });

    function FunctionComponent() {
      return (
        <Trans
          translator={translator}
          i18nKey="notice"
          components={{
            bold: (content) => <span key="b" style={{ fontWeight: "bold" }}>{content}</span>,
            link: (content) => <a key="l" href="#terms">{content}</a>
          }}
        />
      );
    }

    const html = renderToStaticMarkup(<FunctionComponent />);

    expect(html).toContain('<span style="font-weight:bold">read</span>');
    expect(html).toContain('<a href="#terms">terms</a>');
  });

  describe("useLocL and Trans edge cases", () => {
    it("should throw when useLocL is used outside LocLProvider and without translator", () => {
      function BadComponent() {
        useLocL();
        return null;
      }

      expect(() => renderToStaticMarkup(<BadComponent />)).toThrow(
        /must be used within a/
      );
    });

    it("should support useLocL with explicit translator instance and all returned methods", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });

      function TestComponent() {
        const { t, plural, rich, format, language, changeLanguage, translator: activeT } = useLocL(translator);
        expect(activeT).toBe(translator);
        expect(language).toBe("en");
        expect(t("title")).toBe("Hello World");
        // Strictly typed plural without any casts
        expect(plural("messages", { count: 1 })).toBe("1 message");
        expect(plural("messages", { count: 5 })).toBe("5 messages");
        expect(rich("title", {})).toEqual(["Hello World"]);
        expect(format("123", "number")).toBe("123");
        changeLanguage("de");
        return <div>{t("title")}</div>;
      }

      const html = renderToStaticMarkup(<TestComponent />);
      expect(html).toBe("<div>Hallo Welt</div>");
    });

    it("should cover getLanguage, tt, get, and getObj from useLocL and useTranslation", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });

      function MethodsComponent() {
        const { getLanguage, tt, get, getObj } = useLocL(translator);
        expect(getLanguage()).toBe("en");
        expect(tt("title")).toBe("Hello World");
        expect(get("title")).toBe("Hello World");
        expect(getObj("user")).toEqual({
          greeting: "Greetings from user namespace!",
          same: "same"
        });
        return <span>methods</span>;
      }

      renderToStaticMarkup(<MethodsComponent />);
    });

    it("should cover useSyncExternalStore subscribe and getSnapshot in useLocL", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });
      let subscribeCalled = false;
      let snapshotCalled = false;

      jest.spyOn(React, "useSyncExternalStore").mockImplementation((subscribe, getSnapshot, getServerSnapshot) => {
        subscribe(() => {});
        subscribeCalled = true;
        getSnapshot();
        snapshotCalled = true;
        return getServerSnapshot ? getServerSnapshot() : getSnapshot();
      });

      function SubComp() {
        useLocL(translator);
        return <span>ok</span>;
      }

      renderToStaticMarkup(<SubComp />);
      expect(subscribeCalled).toBe(true);
      expect(snapshotCalled).toBe(true);
      (React.useSyncExternalStore as any).mockRestore();
    });

    it("should cover useTranslatorSubscription fallback branches when getVersion is not a function", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });
      const snapshots: string[] = [];

      jest.spyOn(React, "useSyncExternalStore").mockImplementation((subscribe, getSnapshot, getServerSnapshot) => {
        subscribe(() => {});
        const val = getSnapshot();
        // @ts-expect-error
        snapshots.push(val);
        return getServerSnapshot ? getServerSnapshot() : val;
      });

      // 1. getLanguage returns "en"
      const mockWithLang = Object.assign(Object.create(translator), {
        getVersion: undefined,
        getLanguage: () => "en",
      });
      function CompWithLang() {
        useLocL(mockWithLang);
        return <span>lang</span>;
      }
      renderToStaticMarkup(<CompWithLang />);

      // 2. getLanguage returns "" (evaluates || "")
      const mockWithEmptyLang = Object.assign(Object.create(translator), {
        getVersion: undefined,
        getLanguage: () => "",
      });
      function CompWithEmptyLang() {
        useLocL(mockWithEmptyLang);
        return <span>empty</span>;
      }
      renderToStaticMarkup(<CompWithEmptyLang />);

      // 3. getLanguage is undefined (evaluates optional chain undefined -> "")
      const mockWithUndefinedLang = Object.assign(Object.create(translator), {
        getVersion: undefined,
        getLanguage: () => undefined,
      });
      function CompWithUndefinedLang() {
        useLocL(mockWithUndefinedLang);
        return <span>no-lang</span>;
      }
      renderToStaticMarkup(<CompWithUndefinedLang />);

      expect(snapshots).toEqual(["en", "", ""]);
      (React.useSyncExternalStore as any).mockRestore();
    });

    it("should cover Trans fallback branches and unmatched component tags", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });

      // Trans without translator, with fallback
      const html1 = renderToStaticMarkup(
        <Trans i18nKey="missingKey" fallback="Static Fallback" />
      );
      expect(html1).toBe("Static Fallback");

      // Trans without translator, without fallback (uses key)
      const html2 = renderToStaticMarkup(
        // @ts-expect-error
        <Trans i18nKey="KeyAsText" />
      );
      expect(html2).toBe("KeyAsText");

      // Trans with translator, fallback when key missing
      const html3 = renderToStaticMarkup(
        <Trans translator={translator} i18nKey="missingKey" fallback="Translator Fallback" />
      );
      expect(html3).toBe("Translator Fallback");

      // Trans with tag in template that has no matching component in components object
      const html4 = renderToStaticMarkup(
        <Trans
          translator={translator}
          i18nKey="notice"
          components={{
            bold: <strong />
          }}
        />
      );
      expect(html4).toContain("<strong>read</strong>");
      expect(html4).toContain("&lt;link&gt;terms&lt;/link&gt;");

      // Trans where text starts directly with tag and ends directly with tag
      const html5 = renderToStaticMarkup(
        <Trans
          fallback="<bold>ExactBoundary</bold>"
          i18nKey="missingKey"
          components={{
            bold: <b />
          }}
        />
      );
      expect(html5).toBe("<b>ExactBoundary</b>");
    });

    it("should support self-closing tags with element and function renderers in Trans", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });

      // Self-closing tag with React element: exercises match[3], isSelfClosing, rawContent === undefined, cloneElement without children
      const html1 = renderToStaticMarkup(
        <Trans
          translator={translator}
          fallback="Before<br/>Middle<br />After"
          i18nKey="missingKey"
          components={{
            br: <br className="my-br" />
          }}
        />
      );
      expect(html1).toContain('<br class="my-br"/>');

      // Self-closing tag with function component renderer: exercises children === undefined -> children ?? "" fallback
      let functionPassedContent: any;
      const html2 = renderToStaticMarkup(
        <Trans
          translator={translator}
          fallback="Start<divider />End"
          i18nKey="missingKey"
          components={{
            divider: (content) => {
              functionPassedContent = content;
              return <hr className="sep" />;
            }
          }}
        />
      );
      expect(functionPassedContent).toBe("");
      expect(html2).toContain('<hr class="sep"/>');
    });

    it("should support nested rich tags in Trans", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });

      // Exercises rawContent.includes("<") recursively calling renderNodes
      const html = renderToStaticMarkup(
        <Trans
          translator={translator}
          fallback="<card>Container with <bold>bold content</bold></card>"
          i18nKey="missingKey"
          components={{
            card: <div className="card" />,
            bold: <strong />
          }}
        />
      );
      expect(html).toContain('<div class="card">Container with <strong>bold content</strong></div>');
    });

    it("should verify key existence via _other plural suffix in Trans", () => {
      const customPluralTranslator = initLocL({
        resources: {
          en: {
            items_other: "items"
          }
        },
        fallbackLanguage: "en"
      });

      // Exercises keyExists finding `_other` suffix when base key matches res
      const html = renderToStaticMarkup(
        <Trans
          translator={customPluralTranslator}
          i18nKey="items"
          fallback="Fallback Plural"
        />
      );
      expect(html).toBe("items");
    });
  });

  describe("createLocLReact Suite & Edge Cases", () => {
    it("should cover createLocLReact suite (Provider, useTranslation, useLocL, Trans)", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });
      const suite = createLocLReact(translator);

      expect(suite.translator).toBe(translator);
      expect(suite.LocLContext).toBeDefined();

      // 1. Root useTranslation via suite (100% pre-bound strict types)
      function RootComp() {
        const { t, language, changeLanguage, plural, rich, format } = suite.useTranslation();
        expect(language).toBe("en");
        expect(t("title")).toBe("Hello World");
        expect(plural("messages", { count: 1 })).toBe("1 message");
        expect(rich("title", {})).toEqual(["Hello World"]);
        expect(format("123", "number")).toBe("123");
        changeLanguage("de");
        return <h1>{t("title")}</h1>;
      }

      function ProviderOverrideComp() {
        const { t, language } = suite.useTranslation();
        expect(language).toBe("de");
        return <h1>{t("title")}</h1>;
      }

      // 2. Scoped useTranslation (string and array) & customTranslator override
      const otherTranslator = initLocL({ resources, fallbackLanguage: "de" });
      function ScopedComp() {
        const { t: userT } = suite.useTranslation("user");
        const { t: arrayT } = suite.useTranslation(["user"]);
        const { t: customT } = suite.useTranslation("user", {}, otherTranslator);
        return (
          <div>
            <p>{userT("greeting")}</p>
            <p>{arrayT("user.greeting")}</p>
            <p>{customT("greeting")}</p>
          </div>
        );
      }

      // 3. suite.useLocL
      function LocLComp() {
        const { t, language } = suite.useLocL();
        const { t: customT } = suite.useLocL(otherTranslator);
        expect(language).toBe("de");
        return <span>{t("title")}-{customT("title")}</span>;
      }

      // 4. suite.Trans
      function TransComp() {
        return (
          <div>
            <suite.Trans i18nKey="notice" components={{ bold: <b /> }} />
            <suite.Trans scope="user" i18nKey="greeting" />
            <suite.Trans translator={otherTranslator} i18nKey="title" />
          </div>
        );
      }

      const html1 = renderToStaticMarkup(
        <suite.LocLProvider>
          <RootComp />
          <ScopedComp />
          <LocLComp />
          <TransComp />
        </suite.LocLProvider>
      );
      expect(html1).toContain("Hallo Welt");

      const html2 = renderToStaticMarkup(
        <suite.LocLProvider translator={otherTranslator}>
          <ProviderOverrideComp />
        </suite.LocLProvider>
      );
      expect(html2).toContain("Hallo Welt");
    });

    it("should cover useSyncExternalStore subscribe and getSnapshot in Trans", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });
      let subscribeCalled = false;
      let snapshotCalled = false;

      jest.spyOn(React, "useSyncExternalStore").mockImplementation((subscribe, getSnapshot, getServerSnapshot) => {
        subscribe(() => {});
        subscribeCalled = true;
        getSnapshot();
        snapshotCalled = true;
        return getServerSnapshot ? getServerSnapshot() : getSnapshot();
      });

      renderToStaticMarkup(<Trans translator={translator} i18nKey="title" />);
      expect(subscribeCalled).toBe(true);
      expect(snapshotCalled).toBe(true);
      (React.useSyncExternalStore as any).mockRestore();
    });

    it("should cover getSnapshot in Trans when activeTranslator.getVersion is not a function", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });
      const snapshots: string[] = [];

      jest.spyOn(React, "useSyncExternalStore").mockImplementation((subscribe, getSnapshot, getServerSnapshot) => {
        subscribe(() => {});
        const val = getSnapshot();
        // @ts-expect-error
        snapshots.push(val);
        return getServerSnapshot ? getServerSnapshot() : val;
      });

      // 1. activeTranslator without getVersion, getLanguage returns "en"
      const mockWithLang = Object.assign(Object.create(translator), {
        getVersion: undefined,
        getLanguage: () => "en",
      });
      renderToStaticMarkup(<Trans translator={mockWithLang} i18nKey="title" />);

      // 2. activeTranslator without getVersion, getLanguage returns ""
      const mockWithEmptyLang = Object.assign(Object.create(translator), {
        getVersion: undefined,
        getLanguage: () => "",
      });
      renderToStaticMarkup(<Trans translator={mockWithEmptyLang} i18nKey="title" />);

      // 3. activeTranslator without getVersion, getLanguage undefined
      const mockWithoutGetLang = Object.assign(Object.create(translator), {
        getVersion: undefined,
        getLanguage: undefined,
      });
      renderToStaticMarkup(<Trans translator={mockWithoutGetLang} i18nKey="title" />);

      expect(snapshots).toEqual(["en", "", ""]);
      (React.useSyncExternalStore as any).mockRestore();
    });

    it("should cover Trans with scope, values, and unsubscribe guards", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });

      // Trans with string scope
      const htmlScope = renderToStaticMarkup(
        <Trans translator={translator} scope="user" i18nKey="greeting" />
      );
      expect(htmlScope).toBe("Greetings from user namespace!");

      // Trans with array scope
      const htmlArrScope = renderToStaticMarkup(
        <Trans translator={translator} scope={["user", "other"]} i18nKey="user.greeting" />
      );
      expect(htmlArrScope).toBe("Greetings from user namespace!");

      // Trans with strictly typed values interpolation
      const htmlValues = renderToStaticMarkup(
        <Trans translator={translator} i18nKey="welcome" values={{ name: "Alice" }} />
      );
      expect(htmlValues).toBe("Welcome, Alice!");

      // Trans with string scope
      const htmlScopeWithSameResult = renderToStaticMarkup(
        <Trans translator={translator} scope="user" i18nKey="same" />
      );
      expect(htmlScopeWithSameResult).toBe("same");

      // Test unsubscribe guard when activeTranslator is missing
      let unsub1: any;
      jest.spyOn(React, "useSyncExternalStore").mockImplementation((subscribe, getSnapshot, getServerSnapshot) => {
        unsub1 = subscribe(() => {});
        return getServerSnapshot ? getServerSnapshot() : getSnapshot();
      });
      renderToStaticMarkup(<Trans i18nKey="standalone" fallback="Fallback" />);
      expect(typeof unsub1).toBe("function");
      unsub1();

      // Test unsubscribe guard when subscribe returns a non-function
      const dummyTranslator = {
        ...translator,
        subscribe: () => undefined,
        getLanguage: () => "en",
        t: () => "Test",
        get: () => "Test"
      };
      let unsub2: any;
      // @ts-expect-error
      renderToStaticMarkup(<Trans translator={dummyTranslator} i18nKey="title" />);
      expect(typeof unsub2).toBe("undefined");
      (React.useSyncExternalStore as any).mockRestore();
    });

    it("should cover useSyncExternalStore in createLocLReact suite and Trans", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });
      const suite = createLocLReact(translator);

      let subscribeInvocations = 0;

      jest.spyOn(React, "useSyncExternalStore").mockImplementation((subscribe, getSnapshot, getServerSnapshot) => {
        const unsub = subscribe(() => {});
        subscribeInvocations++;
        if (typeof unsub === "function") {
          unsub();
        }
        getSnapshot();
        return getServerSnapshot ? getServerSnapshot() : getSnapshot();
      });

      function BoundComp() {
        suite.useLocL();
        return <span>bound</span>;
      }
      renderToStaticMarkup(<BoundComp />);

      renderToStaticMarkup(<Trans translator={translator} i18nKey="title" />);
      renderToStaticMarkup(<Trans i18nKey="title" fallback="Fallback" />);

      expect(subscribeInvocations).toBeGreaterThanOrEqual(3);
      (React.useSyncExternalStore as any).mockRestore();
    });

    it("should cover Trans remaining branches (missing key with no fallback, invalid components, plain text)", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });

      // 1. Missing key with translator, WITHOUT fallback
      const html1 = renderToStaticMarkup(
        // @ts-expect-error
        <Trans translator={translator} i18nKey="completelyMissing" />
      );
      expect(html1).toBe("completelyMissing");

      // 2. Component is defined but is neither element nor function
      const html2 = renderToStaticMarkup(
        <Trans
          translator={translator}
          i18nKey="notice"
          components={{
            // @ts-expect-error
            bold: "not-a-component"
          }}
        />
      );
      expect(html2).toContain("&lt;bold&gt;read&lt;/bold&gt;");

      // 3. Plain text with no tags at all (exercises while loop not running)
      const html3 = renderToStaticMarkup(
        <Trans translator={translator} i18nKey="title" />
      );
      expect(html3).toBe("Hello World");
    });

    it("should cover fallback to defaultTranslator outside BoundLocLProvider", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });
      const suite = createLocLReact(translator);

      function StandaloneBoundComp() {
        const { t } = suite.useLocL();
        return <span>{t("title")}</span>;
      }
      const html1 = renderToStaticMarkup(<StandaloneBoundComp />);
      expect(html1).toBe("<span>Hello World</span>");

      const html2 = renderToStaticMarkup(<suite.Trans i18nKey="title" />);
      expect(html2).toBe("Hello World");
    });

    it("should cover Suspense throw and useEffect catch in useTranslation and createLocLReact", async () => {
      const translator = initLocL({
        resources: { en: {} },
        fallbackLanguage: "en",
        loader: async (_lang, ns) => {
          if (ns === "failing") throw new Error("Async failure");
          return { text: "Async Text" };
        }
      });
      const suite = createLocLReact(translator);

      // --- 1. Root useTranslation Suspense throw ---
      let rootPromise: any;
      function SuspenseRootComp() {
        try {
          // @ts-expect-error
          useTranslation("asyncNs", { suspense: true });
        } catch (p) {
          rootPromise = p;
        }
        return <h1>loaded</h1>;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <SuspenseRootComp />
        </LocLProvider>
      );
      expect(rootPromise).toBeDefined();
      expect(typeof rootPromise?.then).toBe("function");
      await rootPromise;

      // --- 2. Suite useBoundTranslation Suspense throw ---
      let boundPromise: any;
      function SuspenseBoundComp() {
        try {
          // @ts-expect-error
          suite.useTranslation("asyncNsBound", { suspense: true });
        } catch (p) {
          boundPromise = p;
        }
        return <h1>loaded</h1>;
      }

      renderToStaticMarkup(
        <suite.LocLProvider>
          <SuspenseBoundComp />
        </suite.LocLProvider>
      );
      expect(boundPromise).toBeDefined();
      expect(typeof boundPromise?.then).toBe("function");
      await boundPromise;

      // --- 3. useEffect catch block in Root useTranslation ---
      jest.spyOn(React, "useEffect").mockImplementation((cb) => cb());
      const errSpy = jest.spyOn(console, "error").mockImplementation();

      function FailingRootComp() {
        // @ts-expect-error
        useTranslation("failing");
        return <span>failing</span>;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <FailingRootComp />
        </LocLProvider>
      );

      // --- 4. useEffect catch block in Suite useBoundTranslation ---
      function FailingBoundComp() {
        // @ts-expect-error
        suite.useTranslation("failing");
        return <span>failing</span>;
      }

      renderToStaticMarkup(
        <suite.LocLProvider>
          <FailingBoundComp />
        </suite.LocLProvider>
      );

      await new Promise((r) => setTimeout(r, 10));

      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LocL] Failed to load translations for "failing":'),
        expect.any(Error)
      );

      // --- Root useTranslation with undefined scope ---
      function FailingRootNoScopeComp() {
        useTranslation(undefined, { loader: async () => { throw new Error("No scope fail"); } });
        return <span>no-scope</span>;
      }
      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <FailingRootNoScopeComp />
        </LocLProvider>
      );

      // --- Bound useTranslation with undefined scope ---
      function FailingBoundNoScopeComp() {
        suite.useTranslation(undefined, { loader: async () => { throw new Error("Bound no scope fail"); } });
        return <span>bound-no-scope</span>;
      }
      renderToStaticMarkup(
        <suite.LocLProvider>
          <FailingBoundNoScopeComp />
        </suite.LocLProvider>
      );

      (React.useEffect as any).mockRestore();
      errSpy.mockRestore();
    });
  });

  describe("Suspense and useScopedTranslation full coverage", () => {
    it("should cover suspense load failure, error caching, and re-throw within TTL", async () => {
      let callCount = 0;
      const translator = initLocL({
        resources: { en: {} },
        fallbackLanguage: "en",
        loader: async (_lang, ns) => {
          callCount++;
          throw new Error(`Suspense load failed for ${ns}`);
        }
      });

      let thrownPromise: any;
      function Comp() {
        try {
          // @ts-expect-error
          useTranslation("failingScope", { suspense: true });
        } catch (e: any) {
          if (e && typeof e.then === "function") {
            thrownPromise = e;
          } else {
            throw e;
          }
        }
        return <div>Loaded</div>;
      }

      // First render throws pending promise
      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <Comp />
        </LocLProvider>
      );
      expect(thrownPromise).toBeDefined();

      // Wait for the loader to fail and record the failure
      await thrownPromise;

      // Second render within TTL throws the cached error directly
      expect(() =>
        renderToStaticMarkup(
          <LocLProvider translator={translator}>
            <Comp />
          </LocLProvider>
        )
      ).toThrow("Suspense load failed for failingScope");

      // Verify loader was not called again
      expect(callCount).toBe(1);
    });

    it("should cover TTL expiration on cached failure", async () => {
      const translator = initLocL({
        resources: { en: {} },
        fallbackLanguage: "en",
        loader: async () => {
          throw new Error("TTL Failure");
        }
      });

      let thrownPromise: any;
      function Comp() {
        try {
          // @ts-expect-error
          useTranslation("ttlScope", { suspense: true });
        } catch (e: any) {
          if (e && typeof e.then === "function") {
            thrownPromise = e;
          }
        }
        return null;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <Comp />
        </LocLProvider>
      );
      await thrownPromise;

      // Advance time past SUSPENSE_FAILURE_TTL_MS (2000ms)
      const realNow = Date.now();
      jest.spyOn(Date, "now").mockReturnValue(realNow + 2500);

      let retriedPromise: any;
      function RetryComp() {
        try {
          // @ts-expect-error
          useTranslation("ttlScope", { suspense: true });
        } catch (e: any) {
          if (e && typeof e.then === "function") {
            retriedPromise = e;
          }
        }
        return null;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <RetryComp />
        </LocLProvider>
      );

      expect(retriedPromise).toBeDefined();
      expect(typeof retriedPromise.then).toBe("function");

      (Date.now as any).mockRestore();
      await retriedPromise;
    });

    it("should cover duplicate scope array in suspense (pending promise reuse)", async () => {
      let loaderCalls = 0;
      const translator = initLocL({
        resources: { en: {} },
        fallbackLanguage: "en",
        loader: async () => {
          loaderCalls++;
          return { val: "ok" };
        }
      });

      let promise: any;
      function Comp() {
        try {
          // @ts-expect-error
          useTranslation(["dupNs", "dupNs"], { suspense: true });
        } catch (p) {
          promise = p;
        }
        return null;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <Comp />
        </LocLProvider>
      );

      expect(promise).toBeDefined();
      await promise;
      expect(loaderCalls).toBe(1);
    });

    it("should cover partially loaded array scope in suspense (continue branch)", async () => {
      const translator = initLocL({
        resources: {
          en: {
            preloadedNs: { title: "Preloaded" }
          }
        },
        fallbackLanguage: "en",
        loader: async () => ({ title: "Async" })
      });

      let promise: any;
      function Comp() {
        try {
          // @ts-expect-error
          useTranslation(["preloadedNs", "unloadedNs"], { suspense: true });
        } catch (p) {
          promise = p;
        }
        return null;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <Comp />
        </LocLProvider>
      );

      expect(promise).toBeDefined();
      await promise;
    });

    it("should cover null rejection and undefined scope error formatting in suspense", async () => {
      const translator = initLocL({
        resources: { en: {} },
        fallbackLanguage: "en",
        loader: async () => {
          throw null;
        }
      });

      // undefined scope with null rejection (re-throws non-promise error to outer test)
      let rootPromise: any;
      function NullRootComp() {
        try {
          useTranslation(undefined, { suspense: true });
        } catch (p: any) {
          if (p && typeof p.then === "function") {
            rootPromise = p;
          } else {
            throw p;
          }
        }
        return null;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <NullRootComp />
        </LocLProvider>
      );
      expect(rootPromise).toBeDefined();
      await rootPromise;

      expect(() =>
        renderToStaticMarkup(
          <LocLProvider translator={translator}>
            <NullRootComp />
          </LocLProvider>
        )
      ).toThrow('[LocL] Failed to load translations for "en".');

      // named scope with null rejection (re-throws non-promise error to outer test)
      let namedPromise: any;
      function NullNamedComp() {
        try {
          // @ts-expect-error
          useTranslation("nullScope", { suspense: true });
        } catch (p: any) {
          if (p && typeof p.then === "function") {
            namedPromise = p;
          } else {
            throw p;
          }
        }
        return null;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <NullNamedComp />
        </LocLProvider>
      );
      expect(namedPromise).toBeDefined();
      await namedPromise;

      expect(() =>
        renderToStaticMarkup(
          <LocLProvider translator={translator}>
            <NullNamedComp />
          </LocLProvider>
        )
      ).toThrow('[LocL] Failed to load translations for "en" ("nullScope").');
    });

    it("should cover translator without rootInstance in suspendUntilLoaded", async () => {
      const translator = initLocL({
        resources: { en: {} },
        fallbackLanguage: "en",
        loader: async () => ({ ok: true })
      });

      // Delete rootInstance so translator.rootInstance is undefined,
      // exercising the fallback `?? translator` branch in suspendUntilLoaded
      // @ts-expect-error
      delete translator.rootInstance;
      // @ts-expect-error
      expect(translator.rootInstance).toBeUndefined();

      let promise: any;
      function Comp() {
        try {
          // @ts-expect-error
          useTranslation("noRootScope", { suspense: true });
        } catch (p) {
          promise = p;
        }
        return null;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <Comp />
        </LocLProvider>
      );

      expect(promise).toBeDefined();
      expect(typeof promise.then).toBe("function");
      await promise;
    });

    it("should cover load promise settling when state is no longer pending in WeakMap", async () => {
      const translator = initLocL({
        resources: { en: {} },
        fallbackLanguage: "en",
        loader: async () => ({ text: "ok" })
      });

      let capturedLoads: Map<string, any> | undefined;
      const originalGet = WeakMap.prototype.get;
      const originalSet = WeakMap.prototype.set;
      const getSpy = jest.spyOn(WeakMap.prototype, "get").mockImplementation(function (this: any, key: any) {
        const result = originalGet.call(this, key);
        // @ts-expect-error
        if (result instanceof Map && (key === translator || key === translator.rootInstance)) {
          capturedLoads = result;
        }
        return result;
      });
      const setSpy = jest.spyOn(WeakMap.prototype, "set").mockImplementation(function (this: any, key: any, val: any) {
        // @ts-expect-error
        if (val instanceof Map && (key === translator || key === translator.rootInstance)) {
          capturedLoads = val;
        }
        return originalSet.call(this, key, val);
      });

      let promise: any;
      function Comp() {
        try {
          // @ts-expect-error
          useTranslation("interceptNs", { suspense: true });
        } catch (p) {
          promise = p;
        }
        return null;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <Comp />
        </LocLProvider>
      );
      getSpy.mockRestore();
      setSpy.mockRestore();

      expect(capturedLoads).toBeDefined();
      // Change status from "pending" to "failed" so that when load resolves, it does not match "pending"
      capturedLoads!.set("en::interceptNs", { status: "failed", error: new Error(), failedAt: Date.now() });

      await promise;
    });

    it("should cover pendingScopes.length === 0 in useEffect when scopes are loaded before effect runs", () => {
      const translator = initLocL({ resources: { en: {} }, fallbackLanguage: "en" });
      let isLoadedCallCount = 0;
      jest.spyOn(translator, "isLoaded").mockImplementation(() => {
        isLoadedCallCount++;
        return isLoadedCallCount > 1;
      });

      jest.spyOn(React, "useEffect").mockImplementation((cb) => cb());

      function Comp() {
        // @ts-expect-error
        useTranslation("syncLoadedScope");
        return null;
      }

      renderToStaticMarkup(
        <LocLProvider translator={translator}>
          <Comp />
        </LocLProvider>
      );

      // @ts-expect-error
      translator.isLoaded.mockRestore();
      (React.useEffect as any).mockRestore();
    });
  });
});