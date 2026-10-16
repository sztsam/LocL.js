// src/svelte/index.ts
function createLocLSvelte(translator) {
  return {
    subscribe(run) {
      run(translator.t.bind(translator));
      return translator.subscribe(() => {
        run(translator.t.bind(translator));
      });
    },
    translator
  };
}
export {
  createLocLSvelte
};
