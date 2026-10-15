#!/usr/bin/env node
import { runCli } from "./index.js";

runCli().then((code) => {
  if (typeof code === "number") { process.exit(code); }
}).catch((err) => {
  console.error(err);
  process.exit(1);
});