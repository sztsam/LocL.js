import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        index: "src/index.ts",
        react: "src/react/index.tsx",
        server: "src/server/index.ts",
        compat: "src/compat/index.ts"
    },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false,
    clean: true,
    splitting: false,
    external: [
    "react",
    "node:async_hooks",
    "async_hooks"
    ]
});
