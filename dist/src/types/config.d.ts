import type { ParseMitosisOptions } from '../parsers/jsx/types';
import type { MitosisComponent } from './mitosis-component';
export declare type Format = 'esm' | 'cjs';
export declare type Language = 'js' | 'ts';
interface TranspilerOptions {
    format?: Format;
}
declare type Targets = typeof import('../targets').targets;
export declare type Target = keyof Targets;
export declare type GeneratorOptions = {
    [K in Target]: NonNullable<Parameters<Targets[K]>[0]> & {
        transpiler?: TranspilerOptions;
    };
};
export declare type MitosisConfig = {
    commonOptions?: {
        typescript?: boolean;
    };
    /**
     * List of targets to compile to.
     */
    targets: Target[];
    /**
     * The output directory. Defaults to `output`.
     */
    dest?: string;
    /**
     * globs of files to transpile. Defaults to `src/*`.
     */
    files?: string | string[];
    /**
     * Optional list of globs to exclude from transpilation.
     */
    exclude?: string[];
    /**
     * The directory where overrides are stored. The structure of the override directory must match that of the source code,
     * with each target having its own sub-directory: `${overridesDir}/${target}/*`
     * Defaults to `overrides`.
     */
    overridesDir?: string;
    /**
     * Dictionary of per-target configuration. For each target, the available options can be inspected by going to
     * `packages/core/src/targets.ts` and looking at the first argument of the desired generator.
     *
     * Example:
     *
     * ```js
     * options: {
     *   vue: {
     *     prettier: false,
     *     namePrefix: (path) => path + '-my-vue-code',
     *   },
     *   react: {
     *     stateType: 'builder';
     *     stylesType: 'styled-jsx'
     *   }
     * }
     * ```
     */
    options: Partial<GeneratorOptions>;
    /**
     * Configure a custom parser function which takes a string and returns MitosisJSON
     * Defaults to the JSXParser of this project (src/parsers/jsx)
     */
    parser?: (code: string, path?: string) => MitosisComponent | Promise<MitosisComponent>;
    /**
     * Configure a custom function that provides the output path for each target.
     * If you provide this function, you must provide a value for every target yourself.
     */
    getTargetPath: ({ target }: {
        target: Target;
    }) => string;
    /**
     * Provide options to the parser.
     */
    parserOptions?: {
        jsx: Partial<ParseMitosisOptions> & {
            /**
             * Path to your project's `tsconfig.json` file. Needed for advanced types parsing (e.g. signals).
             */
            tsConfigFilePath?: string;
        };
    };
};
export {};
