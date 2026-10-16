interface LocLVitePluginOptions {
    localesDir?: string;
}
declare function loclVitePlugin(options?: LocLVitePluginOptions): {
    name: string;
    handleHotUpdate({ file, server }: {
        file: string;
        server: any;
    }): never[] | undefined;
};
declare function setupLocLHmr(translator: any, hot: any): () => void;

export { type LocLVitePluginOptions, loclVitePlugin, setupLocLHmr };
