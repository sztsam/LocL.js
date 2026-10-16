// src/vue/index.ts
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
export {
  createLocLVue
};
