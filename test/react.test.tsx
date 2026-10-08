import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { initLocL } from "../src/index.js";
import { LocLProvider, useTranslation, useLocL, Trans, createLocLReact } from "../src/react/index.js";

describe("React Integration", () => {
  const resources = {
    en: {
      title: "Hello World",
      welcome: "Welcome, {name}!",
      notice: "Please <bold>read</bold> our <link>terms</link>.",
      user: {
        greeting: "Greetings from user namespace!"
      }
    },
    de: {
      title: "Hallo Welt",
      welcome: "Willkommen, {name}!",
      notice: "Bitte <bold>lesen</bold> Sie unsere <link>Bedingungen</link>.",
      user: {
        greeting: "Grüße aus dem Benutzer-Namespace!"
      }
    }
  };

  it("should render translations with useTranslation and LocLProvider", () => {
    const translator = initLocL({ resources, fallbackLanguage: "en" });

    function Component() {
      const { t } = useTranslation();
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
      const { t: arrT } = useTranslation(["user"] as any);
      return (
        <div>
          <p>{t("greeting")}</p>
          <p>{arrT("user.greeting" as any)}</p>
        </div>
      );
    }

    const html = renderToStaticMarkup(
      <LocLProvider translator={translator}>
        <UserComponent />
      </LocLProvider>
    );

    expect(html).toContain("Greetings from user namespace!");
  });

  it("should render rich component tags using Trans", () => {
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
        expect(plural("title" as any, { count: 1 })).toBe("Hello World");
        expect(rich("title", {})).toEqual(["Hello World"]);
        expect(format("123", "number")).toBe("123");
        changeLanguage("de");
        return <div>{t("title")}</div>;
      }

      const html = renderToStaticMarkup(<TestComponent />);
      expect(html).toBe("<div>Hallo Welt</div>");
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

    it("should cover Trans fallback branches and unmatched component tags", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });

      // Trans without translator, with fallback
      const html1 = renderToStaticMarkup(
        <Trans i18nKey="missingKey" fallback="Static Fallback" />
      );
      expect(html1).toBe("Static Fallback");

      // Trans without translator, without fallback (uses key)
      const html2 = renderToStaticMarkup(
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
  });

  describe("createLocLReact Suite & Edge Cases", () => {
    it("should cover createLocLReact suite (Provider, useTranslation, useLocL, Trans)", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });
      const suite = createLocLReact(translator);

      expect(suite.translator).toBe(translator);
      expect(suite.LocLContext).toBeDefined();

      // 1. Root useTranslation via suite
      function RootComp() {
        const { t, language, changeLanguage, plural, rich, format } = suite.useTranslation();
        expect(language).toBe("en");
        expect((plural as any)("title", { count: 1 })).toBe("Hello World");
        expect(rich("title", {})).toEqual(["Hello World"]);
        expect(format("123", "number")).toBe("123");
        changeLanguage("de");
        return <h1>{t("title")}</h1>;
      }

      // Component for testing override translator in Provider (language is "de")
      function ProviderOverrideComp() {
        const { t, language } = suite.useTranslation();
        expect(language).toBe("de");
        return <h1>{t("title")}</h1>;
      }

      // 2. Scoped useTranslation (string and array) & customTranslator override
      const otherTranslator = initLocL({ resources, fallbackLanguage: "de" });
      function ScopedComp() {
        const { t: userT } = suite.useTranslation("user");
        const { t: arrayT } = suite.useTranslation(["user"] as any);
        const { t: customT } = suite.useTranslation("user", otherTranslator);
        return (
          <div>
            <p>{userT("greeting")}</p>
            <p>{arrayT("user.greeting" as any)}</p>
            <p>{customT("greeting")}</p>
          </div>
        );
      }

      // 3. suite.useLocL (with default fallback and custom translator)
      function LocLComp() {
        const { t, language } = suite.useLocL();
        const { t: customT } = suite.useLocL(otherTranslator);
        expect(language).toBe("de");
        return <span>{t("title")}-{customT("title")}</span>;
      }

      // 4. suite.Trans (default, scoped, and custom translator)
      function TransComp() {
        return (
          <div>
            <suite.Trans i18nKey="notice" components={{ bold: <b /> }} />
            <suite.Trans scope="user" i18nKey="greeting" />
            <suite.Trans translator={otherTranslator} i18nKey="title" />
          </div>
        );
      }

      // Render with default BoundLocLProvider
      const html1 = renderToStaticMarkup(
        <suite.LocLProvider>
          <RootComp />
          <ScopedComp />
          <LocLComp />
          <TransComp />
        </suite.LocLProvider>
      );
      expect(html1).toContain("Hallo Welt");

      // Render with explicit translator prop in BoundLocLProvider (using ProviderOverrideComp)
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

    it("should cover Trans with scope, values, and unsubscribe guards", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });

      // Trans with string scope
      const htmlScope = renderToStaticMarkup(
        <Trans translator={translator} scope="user" i18nKey="greeting" />
      );
      expect(htmlScope).toBe("Greetings from user namespace!");

      // Trans with array scope
      const htmlArrScope = renderToStaticMarkup(
        <Trans translator={translator} scope={["other", "user"] as any} i18nKey="user.greeting" />
      );
      expect(htmlArrScope).toBe("Greetings from user namespace!");

      // Trans with values interpolation
      const htmlValues = renderToStaticMarkup(
        <Trans translator={translator} i18nKey="welcome" values={{ name: "Alice" }} />
      );
      expect(htmlValues).toBe("Welcome, Alice!");

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
        subscribe: () => undefined as any,
        getLanguage: () => "en",
        t: () => "Test",
        get: () => "Test"
      };
      let unsub2: any;
      renderToStaticMarkup(<Trans translator={dummyTranslator as any} i18nKey="title" />);
      expect(typeof unsub2).toBe("undefined");
      (React.useSyncExternalStore as any).mockRestore();
    });

    it("should cover useSyncExternalStore in createLocLReact suite and Trans (covers index.tsx 250-253 and Trans.tsx funcs)", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });
      const suite = createLocLReact(translator);

      let subscribeInvocations = 0;

      // Mock useSyncExternalStore so that every subscribe callback and returned cleanup runs
      jest.spyOn(React, "useSyncExternalStore").mockImplementation((subscribe, getSnapshot, getServerSnapshot) => {
        const unsub = subscribe(() => {});
        subscribeInvocations++;
        if (typeof unsub === "function") {
          unsub();
        }
        return getServerSnapshot ? getServerSnapshot() : getSnapshot();
      });

      // 1. Covers index.tsx lines 250-253 in useBoundLocL
      function BoundComp() {
        suite.useLocL();
        return <span>bound</span>;
      }
      renderToStaticMarkup(<BoundComp />);

      // 2. Covers Trans subscribe with activeTranslator
      renderToStaticMarkup(<Trans translator={translator} i18nKey="title" />);

      // 3. Covers Trans subscribe without translator (exercises the `return () => {}` cleanup)
      renderToStaticMarkup(<Trans i18nKey="title" fallback="Fallback" />);

      expect(subscribeInvocations).toBeGreaterThanOrEqual(3);
      (React.useSyncExternalStore as any).mockRestore();
    });

    it("should cover Trans remaining branches (missing key with no fallback, invalid components, plain text)", () => {
      const translator = initLocL({ resources, fallbackLanguage: "en" });

      // 1. Covers line 82-86 branch: missing key with translator, WITHOUT fallback
      const html1 = renderToStaticMarkup(
        <Trans translator={translator} i18nKey="completelyMissing" />
      );
      expect(html1).toBe("completelyMissing");

      // 2. Covers line 118 branch: component is defined but is neither element nor function
      const html2 = renderToStaticMarkup(
        <Trans
          translator={translator}
          i18nKey="notice"
          components={{
            bold: "not-a-component" as any
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
  });
});