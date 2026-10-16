"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/vue/index.ts
var vue_exports = {};
__export(vue_exports, {
  createLocLVue: () => createLocLVue
});
module.exports = __toCommonJS(vue_exports);
function createLocLVue(translator, shallowRefFn) {
  const makeRef = shallowRefFn ?? ((val) => {
    let _val = val;
    return {
      get value() {
        return _val;
      },
      set value(v) {
        _val = v;
      }
    };
  });
  const langRef = makeRef(translator.getLanguage());
  const tRef = makeRef(translator.t.bind(translator));
  translator.subscribe((newLang) => {
    langRef.value = newLang;
    tRef.value = translator.t.bind(translator);
  });
  return {
    t: translator.t.bind(translator),
    language: langRef,
    translator
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createLocLVue
});
