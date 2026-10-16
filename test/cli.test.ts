import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { extractKeys, checkTranslations, compileTranslations, getTranslationStatus, maskTokens, unmaskTokens, translateTranslations, translateBatchWithProvider, runCli } from "../src/cli/index.js";
import { setNested } from "../src/cli/extract.js";
import { initLocL } from "../src/index.js";
import { loclVitePlugin, setupLocLHmr } from "../src/vite/index.js";


describe("LocL CLI & Developer Pipeline (locl-cli)", () => {
  let tempDir: string;
  let srcDir: string;
  let localesDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "locl-cli-test-"));
    srcDir = path.join(tempDir, "src");
    localesDir = path.join(tempDir, "locales");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(localesDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("locl extract", () => {
    it("should scan .tsx and .ts files and extract translation keys into base JSON", () => {
      // Create dummy React/TS component files
      const componentContent = `
        import React from "react";
        import { useTranslation, Trans } from "locl-js/react";

        export function MyComponent() {
          const { t, plural, ordinal, rich, get, getObj } = useTranslation();
          return (
            <div>
              <h1>{t("dashboard.title", "My Dashboard")}</h1>
              <p>{t("user.welcome")}</p>
              <span>{plural("messages", { count: 2 })}</span>
              <strong>{ordinal("place", { count: 1 })}</strong>
              <span>{rich("rich.key", {})}</span>
              <span>{get("getter.key")}</span>
              <span>{getObj("getter.obj")}</span>
              <Trans i18nKey="legal.terms" />
              <Trans i18nKey={'dynamic.key'} fallback={'Dynamic Fallback'} />
              <Trans i18nKey="static.key" fallback="Static Fallback" />
            </div>
          );
        }
      `;
      fs.writeFileSync(path.join(srcDir, "Component.tsx"), componentContent, "utf8");

      // Run extraction
      const result = extractKeys({
        src: srcDir,
        localesDir,
        baseLang: "en"
      });

      expect(result.filesScanned).toBe(1);
      expect(result.keysFound).toContain("dashboard.title");
      expect(result.keysFound).toContain("user.welcome");
      expect(result.keysFound).toContain("messages");
      expect(result.keysFound).toContain("place");
      expect(result.keysFound).toContain("rich.key");
      expect(result.keysFound).toContain("getter.key");
      expect(result.keysFound).toContain("getter.obj");
      expect(result.keysFound).toContain("legal.terms");
      expect(result.keysFound).toContain("dynamic.key");
      expect(result.keysFound).toContain("static.key");

      // Inspect generated en.json
      const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
      expect(enJson.dashboard.title).toBe("My Dashboard");
      expect(enJson.user.welcome).toBe("user.welcome");
      expect(enJson.legal.terms).toBe("legal.terms");
      expect(enJson.dynamic.key).toBe("Dynamic Fallback");
      expect(enJson.static.key).toBe("Static Fallback");
    });

    it("should preserve existing keys without overwriting translations and guard against object collisions", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ dashboard: { title: "Custom Title" } }, null, 2),
        "utf8"
      );
      fs.writeFileSync(
        path.join(srcDir, "App.ts"),
        `t("dashboard.title", "Default Title"); t("auth.login"); t("dashboard", "Should Not Overwrite Object");`,
        "utf8"
      );

      const result = extractKeys({ src: srcDir, localesDir, baseLang: "en" });
      const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));

      expect(result.newKeysCount).toBe(1);
      expect(enJson.dashboard.title).toBe("Custom Title");
      expect(enJson.auth.login).toBe("auth.login");
    });

    it("should prune obsolete keys when clean option is enabled", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ obsolete: "Old Key", active: "Keep Me" }, null, 2),
        "utf8"
      );
      fs.writeFileSync(
        path.join(srcDir, "Active.ts"),
        't("active", "Keep Me");',
        "utf8"
      );

      const result = extractKeys({ src: srcDir, localesDir, baseLang: "en", clean: true });
      const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
      expect(result.keysFound).toContain("active");
      expect(enJson.obsolete).toBeUndefined();
      expect(enJson.active).toBe("Keep Me");
    });

    it("should recursively scan subdirectories and ignore ignored directories", () => {
      const subDir = path.join(srcDir, "sub");
      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(path.join(subDir, "Sub.tsx"), 't("sub.title", "Sub Title");', "utf8");

      for (const ignored of ["node_modules", ".git", "dist", "build", ".next"]) {
        const ignoredDir = path.join(srcDir, ignored);
        fs.mkdirSync(ignoredDir, { recursive: true });
        fs.writeFileSync(path.join(ignoredDir, "Ignored.tsx"), 't("ignored.key", "Ignored");', "utf8");
      }

      const res = extractKeys({ src: srcDir, localesDir, baseLang: "en" });
      expect(res.keysFound).toContain("sub.title");
      expect(res.keysFound).not.toContain("ignored.key");
    });

    it("should handle array src, empty src, omitted src, flat mode, dryRun, and custom defaultValue", () => {
      fs.writeFileSync(path.join(srcDir, "App.tsx"), 't("flat.title", "Flat Title"); t("flat.desc");', "utf8");

      // src as array
      const resArr = extractKeys({ src: [srcDir], localesDir, baseLang: "en" });
      expect(resArr.filesScanned).toBeGreaterThan(0);

      // options.src omitted (runs DEFAULT_SRC_DIRS.filter((d) => fs.existsSync(d)))
      const resDefaultSrc = extractKeys({ localesDir, baseLang: "en" });
      expect(resDefaultSrc).toBeDefined();

      // src as empty array (falls back to ".")
      const resEmptySrc = extractKeys({ src: [], localesDir, baseLang: "en" });
      expect(resEmptySrc).toBeDefined();

      // non-existent dir returns empty results
      const resMissing = extractKeys({ src: path.join(tempDir, "nonexistent-src"), localesDir });
      expect(resMissing.filesScanned).toBe(0);

      // flat: true, defaultValue function, and sort: false
      const flatOut = path.join(localesDir, "flat.json");
      const resFlat = extractKeys({
        src: srcDir,
        localesDir,
        outputFile: flatOut,
        flat: true,
        defaultValue: (k) => `CUSTOM_${k}`,
        sort: false
      });
      expect(resFlat.newKeysCount).toBeGreaterThan(0);
      const flatJson = JSON.parse(fs.readFileSync(flatOut, "utf8"));
      expect(flatJson["flat.title"]).toBe("Flat Title");
      expect(flatJson["flat.desc"]).toBe("CUSTOM_flat.desc");

      // Running again with flat: true covers branch where currentJson[item.key] !== undefined
      const resFlat2 = extractKeys({
        src: srcDir,
        localesDir,
        outputFile: flatOut,
        flat: true
      });
      expect(resFlat2.newKeysCount).toBe(0);

      // dryRun: true does not write file
      const dryOut = path.join(localesDir, "dryrun.json");
      extractKeys({ src: srcDir, localesDir, outputFile: dryOut, dryRun: true });
      expect(fs.existsSync(dryOut)).toBe(false);

      // static string defaultValue
      extractKeys({ src: srcDir, localesDir, defaultValue: "STATIC_VAL" });

      // Omit localesDir to exercise default "locales"
      const resNoLocalesDir = extractKeys({ src: srcDir, dryRun: true });
      expect(resNoLocalesDir.outputFile).toContain("locales");

      // Default arguments options = {}
      const mkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation();
      const writeSpy = jest.spyOn(fs, "writeFileSync").mockImplementation();
      const resNoArgs = extractKeys();
      expect(resNoArgs).toBeDefined();
      mkdirSpy.mockRestore();
      writeSpy.mockRestore();

      // Prototype pollution keys in source files
      fs.writeFileSync(
        path.join(srcDir, "Proto.ts"),
        't("__proto__.evil"); t("constructor.evil"); t("prototype.evil"); t("safe.__proto__"); t("safe.constructor"); t("safe.prototype");',
        "utf8"
      );
      extractKeys({ src: srcDir, localesDir, baseLang: "en" });

      // Non-file, non-directory entry in readdirSync
      const readdirSpy = jest.spyOn(fs, "readdirSync").mockReturnValueOnce([
        // @ts-expect-error
        { name: "sock", isDirectory: () => false, isFile: () => false }
      ]);
      extractKeys({ src: srcDir, localesDir, dryRun: true });
      readdirSpy.mockRestore();

      const target = { user: { profile: "info" } };
      setNested(target, "user", "primitive value");
      expect(target.user).toEqual({ profile: "info" });
    });
  });

  describe("locl check", () => {
    it("should detect missing keys across secondary language files", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ title: "Hello", save: "Save", cancel: "Cancel" }, null, 2),
        "utf8"
      );
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ title: "Hallo" }, null, 2), // missing 'save' and 'cancel'
        "utf8"
      );

      const check = checkTranslations({ localesDir, baseLang: "en" });
      expect(check.success).toBe(false);
      expect(check.locales.de.missing).toEqual(["save", "cancel"]);
    });

    it("should automatically backfill missing keys when --fix is enabled d on nested and plural targets", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({
          auth: { login: "Log In", logout: "Log Out" },
          messages: { one: "1 item", other: "{count} items", "=0": "no items", ordinal: "ord" }
        }, null, 2),
        "utf8"
      );
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({
          auth: { login: "Anmelden" },
          messages: { one: "1 Artikel", other: "{count} Artikel", "=0": "keine", ordinal: "ord" }
        }, null, 2),
        "utf8"
      );

      const check = checkTranslations({ localesDir, baseLang: "en", fix: true });
      expect(check.success).toBe(true);

      const fixedDe = JSON.parse(fs.readFileSync(path.join(localesDir, "de.json"), "utf8"));
      expect(fixedDe.auth.login).toBe("Anmelden");
      expect(fixedDe.auth.logout).toBe("Log Out");
      expect(fixedDe.messages.other).toBe("{count} Artikel");

      fs.writeFileSync(path.join(localesDir, "ignore.txt"), "text");
      fs.writeFileSync(path.join(localesDir, ".hidden.json"), "{}");
      fs.writeFileSync(path.join(localesDir, "locales.compiled.json"), "{}");
      fs.writeFileSync(
        path.join(localesDir, "fr.json"),
        JSON.stringify({ title: "Bonjour" })
      );
      const checkFlat = checkTranslations({ localesDir, baseLang: "en", fix: true });
      expect(checkFlat.success).toBe(true);
      const fixedFr = JSON.parse(fs.readFileSync(path.join(localesDir, "fr.json"), "utf8"));
      expect(fixedFr.title).toBe("Bonjour");
      expect(fixedFr["auth.login"]).toBe("Log In");
      expect(fixedFr.auth).toBeUndefined();
    });

    it("should throw an error when base language file is missing", () => {
      expect(() => checkTranslations({ localesDir: path.join(tempDir, "missing-locales") })).toThrow(
        /Base language file not found/
      );
    });

    it("should fail when strict mode is enabled and extraneous or empty keys exist", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ title: "Hello", save: "Save" }, null, 2),
        "utf8"
      );
      // Extraneous keys
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ title: "Hallo", save: "Speichern", extra: "Extra" }, null, 2),
        "utf8"
      );

      const checkExtra = checkTranslations({ localesDir, baseLang: "en", strict: true });
      expect(checkExtra.success).toBe(false);
      expect(checkExtra.locales.de.extraneous).toContain("extra");

      // Empty string keys
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ title: "Hallo", save: "" }, null, 2),
        "utf8"
      );
      const checkEmpty = checkTranslations({ localesDir, baseLang: "en", strict: true });
      expect(checkEmpty.success).toBe(false);
      expect(checkEmpty.locales.de.empty).toContain("save");
    });

    it("should run with default arguments when options are omitted", () => {
      const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const readSpy = jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({ a: "b" }));
      const readdirSpy = jest.spyOn(fs, "readdirSync").mockReturnValue([]);

      const defaultCheck = checkTranslations();
      expect(defaultCheck.success).toBe(true);

      existsSpy.mockRestore();
      readSpy.mockRestore();
      readdirSpy.mockRestore();

      //(totalKeys <= 0 -> : 100)
      fs.writeFileSync(path.join(localesDir, "en.json"), "{}");
      fs.writeFileSync(path.join(localesDir, "de.json"), "{}");
      const statsEmpty = getTranslationStatus({ localesDir, baseLang: "en" });
      expect(statsEmpty.totalKeys).toBe(0);
      expect(statsEmpty.locales.de.percentage).toBe(100);
    });

    it("should guard against object collisions in setNested", () => {
      const target = { user: { profile: "info" } };
      setNested(target, "user", "primitive value");
      expect(target.user).toEqual({ profile: "info" });
    });

    it("should filter non-json, hidden, and compiled files and handle flat target with fix", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ auth: { login: "Log In" } }, null, 2),
        "utf8"
      );
      fs.writeFileSync(path.join(localesDir, "ignore.txt"), "text");
      fs.writeFileSync(path.join(localesDir, ".hidden.json"), "{}");
      fs.writeFileSync(path.join(localesDir, "locales.compiled.json"), "{}");
      fs.writeFileSync(
        path.join(localesDir, "fr.json"),
        JSON.stringify({ title: "Bonjour" })
      );
      const checkFlat = checkTranslations({ localesDir, baseLang: "en", fix: true });
      expect(checkFlat.success).toBe(true);
      const fixedFr = JSON.parse(fs.readFileSync(path.join(localesDir, "fr.json"), "utf8"));
      expect(fixedFr.title).toBe("Bonjour");
      expect(fixedFr["auth.login"]).toBe("Log In");
      expect(fixedFr.auth).toBeUndefined();
    });

    it("should lint parameters and XML tags with checkTranslations --lint-params", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ greeting: "Hello {name}", terms: "Read <link>terms</link>" }),
        "utf8"
      );
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ greeting: "Hallo {naem}", terms: "Lies <badtag>terms</badtag>" }),
        "utf8"
      );

      const res = checkTranslations({ localesDir, baseLang: "en", lintParams: true });
      expect(res.success).toBe(false);
      expect(res.locales.de.paramMismatches?.length).toBe(1);
      expect(res.locales.de.tagMismatches?.length).toBe(1);

      // Tag mismatch without param mismatch (covers tagMismatches branch of ||)
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ greeting: "Hello {name}", terms: "Read <badtag>terms</badtag>" }),
        "utf8"
      );
      const resTagOnly = checkTranslations({ localesDir, baseLang: "en", lintParams: true });
      expect(resTagOnly.success).toBe(false);
      expect(resTagOnly.locales.de.paramMismatches?.length).toBe(0);
      expect(resTagOnly.locales.de.tagMismatches?.length).toBe(1);

      // No mismatches with lintParams: true
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ greeting: "Hello {name}", terms: "Read <link>terms</link>" }),
        "utf8"
      );
      const resClean = checkTranslations({ localesDir, baseLang: "en", lintParams: true });
      expect(resClean.success).toBe(true);
      expect(resClean.locales.de.paramMismatches?.length).toBe(0);
      expect(resClean.locales.de.tagMismatches?.length).toBe(0);
    });
  });

  describe("locl status", () => {
    it("should calculate language coverage matrix and stats", () => {
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ key1: "One", key2: "Two", key3: "Three", key4: "Four" }),
        "utf8"
      );
      fs.writeFileSync(
        path.join(localesDir, "de.json"),
        JSON.stringify({ key1: "Eins", key2: "Zwei", key3: "" }),
        "utf8"
      );
      // Compiled and hidden files should be filtered out
      fs.writeFileSync(path.join(localesDir, "locales.compiled.json"), "{}");
      fs.writeFileSync(path.join(localesDir, ".hidden.json"), "{}");
      fs.writeFileSync(path.join(localesDir, "ignore.txt"), "text");

      const stats = getTranslationStatus({ localesDir, baseLang: "en" });
      expect(stats.baseLang).toBe("en");
      expect(stats.totalKeys).toBe(4);
      expect(stats.locales.en.percentage).toBe(100);
      expect(stats.locales.de.total).toBe(4);
      expect(stats.locales.de.translated).toBe(2);
      expect(stats.locales.de.missing).toBe(2);
      expect(stats.locales.de.percentage).toBe(50);
    });

    it("should throw an error when base language file is missing in status", () => {
      expect(() => getTranslationStatus({ localesDir: path.join(tempDir, "missing-locales") })).toThrow(
        /Base language file not found/
      );
    });

    it("should run with default arguments when options are omitted in status", () => {
      const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const readSpy = jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({ a: "b" }));
      const readdirSpy = jest.spyOn(fs, "readdirSync").mockReturnValue([]);

      const defaultStatus = getTranslationStatus();
      expect(defaultStatus.totalKeys).toBe(1);

      existsSpy.mockRestore();
      readSpy.mockRestore();
      readdirSpy.mockRestore();
    });

    it("should handle empty base language dictionary with 100% percentage in status", () => {
      fs.writeFileSync(path.join(localesDir, "en.json"), "{}");
      fs.writeFileSync(path.join(localesDir, "de.json"), "{}");
      const statsEmpty = getTranslationStatus({ localesDir, baseLang: "en" });
      expect(statsEmpty.totalKeys).toBe(0);
      expect(statsEmpty.locales.de.percentage).toBe(100);
    });
  });

  describe("locl translate", () => {
    it("should accurately mask and unmask variables, tags, and ICU expressions", () => {
      const raw = "Welcome, {name}! Visit <link href=\"/terms\">here</link> or call {phone | number}.";
      const { masked, tokens } = maskTokens(raw);

      expect(masked).toContain("__LOCL_TOK_0__");
      expect(masked).toContain("__LOCL_TOK_1__");
      expect(masked).toContain("__LOCL_TOK_2__");
      expect(tokens).toEqual(["{name}", '<link href="/terms">', "</link>", "{phone | number}"]);

      const mockTranslated = "¡Bienvenido, __LOCL_TOK_0__! Visite __LOCL_TOK_1__aquí__LOCL_TOK_2__ o llame a __LOCL_TOK_3__.";
      const restored = unmaskTokens(mockTranslated, tokens);

      expect(restored).toBe("¡Bienvenido, {name}! Visite <link href=\"/terms\">aquí</link> o llame a {phone | number}.");
    });

    it("should translate missing keys with custom translator function", async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "locl-trans-"));
      const localesDir = path.join(tempDir, "locales");
      fs.mkdirSync(localesDir, { recursive: true });

      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ greeting: "Hello {name}", farewell: "Goodbye" }, null, 2),
        "utf8"
      );

      const result = await translateTranslations({
        target: "es",
        localesDir,
        baseLang: "en",
        customTranslator: async (texts) => texts.map((t) => t.replace("Hello", "Hola").replace("Goodbye", "Adiós"))
      });

      expect(result.success).toBe(true);
      expect(result.locales.es.translated).toBe(2);

      const esJson = JSON.parse(fs.readFileSync(path.join(localesDir, "es.json"), "utf8"));
      expect(esJson.greeting).toBe("Hola {name}");
      expect(esJson.farewell).toBe("Adiós");

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe("locl compile", () => {
    it("should compile JSON files to TypeScript and ESM bundle", () => {
      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify({ hello: "Hello" }), "utf8");
      fs.writeFileSync(path.join(localesDir, "de.json"), JSON.stringify({ hello: "Hallo" }), "utf8");

      const tsOut = path.join(tempDir, "locales.compiled.ts");
      const compileTs = compileTranslations({ localesDir, output: tsOut, format: "ts" });
      expect(fs.existsSync(tsOut)).toBe(true);
      expect(fs.readFileSync(tsOut, "utf8")).toContain("export const resources =");

      const esmOut = path.join(tempDir, "locales.compiled.js");
      compileTranslations({ localesDir, output: esmOut, format: "esm" });
      expect(fs.existsSync(esmOut)).toBe(true);
      expect(fs.readFileSync(esmOut, "utf8")).toContain("export const resources =");
    });

    it("should throw an error when locales directory does not exist", () => {
      expect(() => compileTranslations({ localesDir: path.join(tempDir, "missing-locales") })).toThrow(
        /Locales directory not found/
      );
    });

    it("should compile to CJS and JSON formats with and without output path", () => {
      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify({ hello: "Hello" }), "utf8");

      const cjsOut = path.join(tempDir, "locales.compiled.cjs");
      const cjsRes = compileTranslations({ localesDir, output: cjsOut, format: "cjs" });
      expect(fs.existsSync(cjsOut)).toBe(true);
      expect(fs.readFileSync(cjsOut, "utf8")).toContain("module.exports =");
      expect(cjsRes.localesCount).toBe(1);

      const jsonOut = path.join(tempDir, "locales.compiled.json");
      compileTranslations({ localesDir, output: jsonOut, format: "json" });
      expect(fs.existsSync(jsonOut)).toBe(true);

      const jsonDef = compileTranslations({ localesDir, format: "json" });
      expect(jsonDef.outputFile).toContain(".json");

      const cjsDef = compileTranslations({ localesDir, format: "cjs" });
      expect(cjsDef.outputFile).toContain(".js");

      const cExistsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      // @ts-expect-error
      const cReaddirSpy = jest.spyOn(fs, "readdirSync").mockReturnValue(["en.json"]);
      const cReadSpy = jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({ hello: "Hello" }));
      const cMkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation();
      const cWriteSpy = jest.spyOn(fs, "writeFileSync").mockImplementation();

      const defaultCompile = compileTranslations();
      expect(defaultCompile.localesCount).toBe(1);

      cExistsSpy.mockRestore();
      cReaddirSpy.mockRestore();
      cReadSpy.mockRestore();
      cMkdirSpy.mockRestore();
      cWriteSpy.mockRestore();
    });
  });

  describe("runCli Execution", () => {
    it("should handle --help, --version, status and valid commands", async () => {
      expect(await runCli(["--help"])).toBe(0);
      expect(await runCli(["--version"])).toBe(0);

      fs.writeFileSync(path.join(srcDir, "App.tsx"), `t("title", "Hello");`, "utf8");
      expect(await runCli(["extract", "--src", srcDir, "--locales", localesDir])).toBe(0);

      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify({ ok: "OK" }), "utf8");
      fs.writeFileSync(path.join(localesDir, "de.json"), JSON.stringify({ ok: "OK" }), "utf8");
      expect(await runCli(["check", "--locales", localesDir])).toBe(0);

      expect(await runCli(["status", "--locales", localesDir, "--base", "en"])).toBe(0);
      expect(await runCli(["compile", "--locales", localesDir, "--output", path.join(tempDir, "out.ts"), "-f", "ts"])).toBe(0);
      expect(await runCli(["unknownCommand"])).toBe(1);
    });

    it("should handle parity check failure reporting, short flags, default argv, and errors in runCli", async () => {
      // Test missing keys <= 5
      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify({ a: "1", b: "2" }), "utf8");
      fs.writeFileSync(path.join(localesDir, "de.json"), JSON.stringify({}, null, 2), "utf8");
      const errSpy = jest.spyOn(console, "error").mockImplementation();
      expect(await runCli(["check", "--locales", localesDir])).toBe(1);

      // Test missing keys > 5
      const bigEn: Record<string, string> = {};
      for (let i = 0; i < 7; i++) {
        bigEn[`key_${i}`] = `Value ${i}`;
      }
      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify(bigEn, null, 2), "utf8");
      fs.writeFileSync(path.join(localesDir, "de.json"), JSON.stringify({}, null, 2), "utf8");

      const checkCode = await runCli(["check", "--locales", localesDir]);
      expect(checkCode).toBe(1);

      // Catch block when command throws
      const throwCode = await runCli(["check", "--locales", path.join(tempDir, "nonexistent-locales")]);
      expect(throwCode).toBe(1);

      errSpy.mockRestore();

      // Short flags -s, -l, -b, -o, --flat, --ext with and without leading dot
      fs.writeFileSync(path.join(srcDir, "Short.tsx"), 't("short.title", "Short Title");', "utf8");
      const shortCode = await runCli([
        "extract",
        "-s", srcDir,
        "-l", localesDir,
        "-b", "en",
        "-o", path.join(localesDir, "short.json"),
        "--flat",
        "--ext", "tsx, .ts",
        "--default", "FALLBACK_VAL"
      ]);
      expect(shortCode).toBe(0);

      // Default argv (process.argv.slice(2))
      const origArgv = process.argv;
      process.argv = ["node", "locl", "--version"];
      expect(await runCli()).toBe(0);
      process.argv = origArgv;
    });
  });


  describe("translateBatchWithProvider & Providers", () => {
    it("should return empty array when texts is empty", async () => {
      // @ts-expect-error
      expect(await translateBatchWithProvider([], "en", "es", {})).toEqual([]);
    });

    it("should support DeepL provider with free and paid endpoints, errors, and env vars", async () => {
      const origEnv = process.env.DEEPL_API_KEY;
      delete process.env.DEEPL_API_KEY;

      // Missing API key error
      // @ts-expect-error
      await expect(translateBatchWithProvider(["Hello"], "en", "es", { provider: "deepl" })).rejects.toThrow(
        "Missing DeepL API key"
      );

      // DeepL Free endpoint (:fx)
      const origFetch = global.fetch;
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ translations: [{ text: "Hola" }] })
      });
      global.fetch = fetchMock;

      // @ts-expect-error
      const resFree = await translateBatchWithProvider(["Hello"], "en", "es", {
        provider: "deepl",
        apiKey: "test-key:fx"
      });
      expect(resFree).toEqual(["Hola"]);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api-free.deepl.com/v2/translate",
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "DeepL-Auth-Key test-key:fx" })
        })
      );

      // DeepL Pro endpoint (without :fx) and DEEPL_API_KEY from environment
      process.env.DEEPL_API_KEY = "env-pro-key";
      // @ts-expect-error
      const resPro = await translateBatchWithProvider(["Hello"], "en", "es", { provider: "deepl" });
      expect(resPro).toEqual(["Hola"]);
      expect(fetchMock).toHaveBeenCalledWith("https://api.deepl.com/v2/translate", expect.anything());

      // DeepL API error (res.ok is false)
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden"
      });
      // @ts-expect-error
      await expect(translateBatchWithProvider(["Hello"], "en", "es", { provider: "deepl" })).rejects.toThrow(
        "DeepL API error: 403 Forbidden"
      );

      global.fetch = origFetch;
      process.env.DEEPL_API_KEY = origEnv;
    });

    it("should support OpenAI provider with custom model, default model, response formats, and errors", async () => {
      const origEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      // Missing API key error
      // @ts-expect-error
      await expect(translateBatchWithProvider(["Hello"], "en", "es", { provider: "openai" })).rejects.toThrow(
        "Missing OpenAI API key"
      );

      const origFetch = global.fetch;

      // Success with content.strings
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ strings: ["Hola"] }) } }]
        })
      });

      // @ts-expect-error
      const resStrings = await translateBatchWithProvider(["Hello"], "en", "es", {
        provider: "openai",
        apiKey: "sk-test",
        model: "gpt-4o"
      });
      expect(resStrings).toEqual(["Hola"]);

      // Success with content.translations and env var
      process.env.OPENAI_API_KEY = "sk-env";
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ translations: ["Hola Translations"] }) } }]
        })
      });
      // @ts-expect-error
      const resTranslations = await translateBatchWithProvider(["Hello"], "en", "es", { provider: "openai" });
      expect(resTranslations).toEqual(["Hola Translations"]);

      // Success with object fallback (Object.values(content)[0])
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ customKey: ["Hola Object"] }) } }]
        })
      });
      // @ts-expect-error
      const resObject = await translateBatchWithProvider(["Hello"], "en", "es", { provider: "openai" });
      expect(resObject).toEqual(["Hola Object"]);

      // HTTP Error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error"
      });
      // @ts-expect-error
      await expect(translateBatchWithProvider(["Hello"], "en", "es", { provider: "openai" })).rejects.toThrow(
        "OpenAI API error: 500 Internal Server Error"
      );

      global.fetch = origFetch;
      process.env.OPENAI_API_KEY = origEnv;
    });

    it("should support Google Translate provider with success, error, and missing key", async () => {
      const origEnv = process.env.GOOGLE_TRANSLATE_API_KEY;
      delete process.env.GOOGLE_TRANSLATE_API_KEY;

      // Missing API key error
      // @ts-expect-error
      await expect(translateBatchWithProvider(["Hello"], "en", "es", { provider: "google" })).rejects.toThrow(
        "Missing Google Translate API key"
      );

      const origFetch = global.fetch;

      // Success with apiKey option
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { translations: [{ translatedText: "Hola Google" }] }
        })
      });
      // @ts-expect-error
      const res = await translateBatchWithProvider(["Hello"], "en", "es", {
        provider: "google",
        apiKey: "g-key"
      });
      expect(res).toEqual(["Hola Google"]);

      // Success with env var
      process.env.GOOGLE_TRANSLATE_API_KEY = "g-env-key";
      // @ts-expect-error
      const resEnv = await translateBatchWithProvider(["Hello"], "en", "es", { provider: "google" });
      expect(resEnv).toEqual(["Hola Google"]);

      // HTTP Error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request"
      });
      // @ts-expect-error
      await expect(translateBatchWithProvider(["Hello"], "en", "es", { provider: "google" })).rejects.toThrow(
        "Google API error: 400 Bad Request"
      );

      global.fetch = origFetch;
      process.env.GOOGLE_TRANSLATE_API_KEY = origEnv;
    });

    it("should support Ollama provider with default host/model, custom options, array/object formats, and error", async () => {
      const origHost = process.env.OLLAMA_HOST;
      delete process.env.OLLAMA_HOST;

      const origFetch = global.fetch;

      // Default host and model
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: JSON.stringify(["Hola Ollama Def"]) })
      });

      // @ts-expect-error
      const resDefault = await translateBatchWithProvider(["Hello"], "en", "es", {
        provider: "ollama"
      });
      expect(resDefault).toEqual(["Hola Ollama Def"]);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:11434/api/generate",
        expect.objectContaining({
          body: expect.stringContaining('"model":"llama3"')
        })
      );

      // Custom host & model with array response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: JSON.stringify(["Hola Ollama Custom"]) })
      });

      // @ts-expect-error
      const resArray = await translateBatchWithProvider(["Hello"], "en", "es", {
        provider: "ollama",
        ollamaHost: "http://my-ollama:11434",
        model: "llama3.1"
      });
      expect(resArray).toEqual(["Hola Ollama Custom"]);

      // OLLAMA_HOST env var with object response
      process.env.OLLAMA_HOST = "http://env-ollama:11434";
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: JSON.stringify({ result: ["Hola Object"] }) })
      });

      // @ts-expect-error
      const resObj = await translateBatchWithProvider(["Hello"], "en", "es", { provider: "ollama" });
      expect(resObj).toEqual(["Hola Object"]);

      // HTTP Error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: "Bad Gateway"
      });
      // @ts-expect-error
      await expect(translateBatchWithProvider(["Hello"], "en", "es", { provider: "ollama" })).rejects.toThrow(
        "Ollama error: 502 Bad Gateway"
      );

      global.fetch = origFetch;
      process.env.OLLAMA_HOST = origHost;
    });

    it("should throw error for unsupported provider", async () => {
      // @ts-expect-error
      await expect(translateBatchWithProvider(["Hello"], "en", "es", { provider: "unsupported" })).rejects.toThrow(
        'Unsupported provider "unsupported".'
      );
    });
  });

  describe("translateTranslations Pipeline & Edge Cases", () => {
    it("should cover translateTranslations validation, skipping, file parsing, and batching", async () => {
      // Missing base file with default options
      await expect(
        translateTranslations({
          target: "es"
        })
      ).rejects.toThrow("Base language file not found");

      // Empty target
      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify({ a: "Hello" }), "utf8");
      await expect(
        translateTranslations({
          target: "",
          localesDir,
          baseLang: "en"
        })
      ).rejects.toThrow("At least one target language must be specified");

      // Target includes baseLang (targetLang === baseLang is skipped)
      const resSkipBase = await translateTranslations({
        target: ["en", "es"],
        localesDir,
        baseLang: "en",
        customTranslator: async (texts) => texts.map(() => "Hola")
      });
      expect(resSkipBase.locales.en).toBeUndefined();
      expect(resSkipBase.locales.es).toBeDefined();

      // Target file exists with all keys translated (keysToTranslate.length === 0)
      fs.writeFileSync(path.join(localesDir, "es.json"), JSON.stringify({ a: "Hola" }), "utf8");
      const resAllTranslated = await translateTranslations({
        target: "es",
        localesDir,
        baseLang: "en",
        customTranslator: async (texts) => texts
      });
      expect(resAllTranslated.locales.es.translated).toBe(0);
      expect(resAllTranslated.locales.es.skipped).toBe(1);

      // Target file has corrupted/invalid JSON (triggers catch {} parsing error branch)
      fs.writeFileSync(path.join(localesDir, "de.json"), "invalid-json-content", "utf8");
      const resCorrupted = await translateTranslations({
        target: "de",
        localesDir,
        baseLang: "en",
        customTranslator: async (texts) => texts.map(() => "Hallo")
      });
      expect(resCorrupted.locales.de.translated).toBe(1);

      // Target file originally flat with null, array, and string values
      fs.writeFileSync(
        path.join(localesDir, "fr.json"),
        JSON.stringify({ "user.name": "Nom", nullable: null, list: [1, 2] }),
        "utf8"
      );
      fs.writeFileSync(
        path.join(localesDir, "en.json"),
        JSON.stringify({ "user.name": "Name", "user.age": "Age" }),
        "utf8"
      );
      const resFlat = await translateTranslations({
        target: "fr",
        localesDir,
        baseLang: "en",
        force: true,
        batchSize: 1, // tests batch loop running multiple iterations
        customTranslator: async (texts) => texts.map((t) => `FR_${t}`)
      });
      expect(resFlat.locales.fr.translated).toBe(2);
      const frJson = JSON.parse(fs.readFileSync(path.join(localesDir, "fr.json"), "utf8"));
      expect(frJson["user.name"]).toBe("FR_Name");
      expect(frJson["user.age"]).toBe("FR_Age");

      // dryRun: true does not write changes to disk
      const resDry = await translateTranslations({
        target: "it",
        localesDir,
        baseLang: "en",
        dryRun: true,
        customTranslator: async (texts) => texts.map(() => "Ciao")
      });
      expect(resDry.locales.it.translated).toBe(2);
      expect(fs.existsSync(path.join(localesDir, "it.json"))).toBe(false);
    });

    it("should handle 'translate' command in runCli with validation and execution", async () => {
      const errSpy = jest.spyOn(console, "error").mockImplementation();
      const logSpy = jest.spyOn(console, "log").mockImplementation();

      // Missing --target argument
      expect(await runCli(["translate"])).toBe(1);
      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required argument: --target")
      );

      // Valid translate execution via runCli using DeepL mock
      fs.writeFileSync(path.join(localesDir, "en.json"), JSON.stringify({ hello: "Hello" }), "utf8");

      const origFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ translations: [{ text: "Hola" }] })
      });

      const exitCode = await runCli([
        "translate",
        "--target", "es",
        "--locales", localesDir,
        "--base", "en",
        "--api-key", "test-key:fx"
      ]);
      expect(exitCode).toBe(0);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Auto-translation complete."));

      const esJson = JSON.parse(fs.readFileSync(path.join(localesDir, "es.json"), "utf8"));
      expect(esJson.hello).toBe("Hola");

      global.fetch = origFetch;
      errSpy.mockRestore();
      logSpy.mockRestore();
    });
  });

  it("should handle Vite HMR plugin and setupLocLHmr", () => {
    const plugin = loclVitePlugin({ localesDir: "locales" });
    const wsSend = jest.fn();
    const fakeServer = { ws: { send: wsSend } };

    const filePath = path.join(localesDir, "en.json");
    fs.writeFileSync(filePath, JSON.stringify({ hmr: "ok" }), "utf8");

    plugin.handleHotUpdate({ file: filePath, server: fakeServer });
    expect(wsSend).toHaveBeenCalledWith(
      expect.objectContaining({ event: "locl:update", data: { lang: "en", data: { hmr: "ok" } } })
    );

    // non-matching file and JSON parse error
    expect(plugin.handleHotUpdate({ file: "src/App.tsx", server: fakeServer })).toBeUndefined();
    fs.writeFileSync(filePath, "bad-json", "utf8");
    plugin.handleHotUpdate({ file: filePath, server: fakeServer });

    // setupLocLHmr
    const translator = initLocL({ resources: { en: {} }, fallbackLanguage: "en" });
    const listeners: Record<string, any> = {};
    const fakeHot = {
      on: (evt: string, cb: any) => { listeners[evt] = cb; },
      off: jest.fn()
    };

    const cleanup = setupLocLHmr(translator, fakeHot);
    listeners["locl:update"]({ lang: "en", data: { dynamic: "Dynamic" } });
    expect(translator.tt("dynamic")).toBe("Dynamic");
    cleanup();
    expect(fakeHot.off).toHaveBeenCalled();
    expect(setupLocLHmr(translator, undefined)()).toBeUndefined();

    // Default options
    const defaultPlugin = loclVitePlugin();
    expect(defaultPlugin.name).toBe("locl-vite-plugin");

    // setupLocLHmr edge cases
    expect(setupLocLHmr(null, null)()).toBeUndefined();
    expect(setupLocLHmr(null, {} as any)()).toBeUndefined();

    // HMR update when translator is null or lacks addResources
    const hotNoTrans = { on: (evt: string, cb: any) => cb({ lang: "en", data: {} }), off: jest.fn() };
    setupLocLHmr(null, hotNoTrans);
    setupLocLHmr({} as any, hotNoTrans);

    // Cleanup when hot.off is undefined
    const hotNoOff = { on: jest.fn(), off: undefined };
    const cleanupNoOff = setupLocLHmr({ addResources: jest.fn() }, hotNoOff);
    expect(cleanupNoOff()).toBeUndefined();
  });
});