import { JSX } from '@builder.io/mitosis/jsx-runtime';
export * from './flow';
declare function Provider<T>(props: {
    value: T;
    children: JSX.Element;
}): any;
export declare type Context<T> = {
    Provider: typeof Provider<T>;
};
export declare const useStore: <T>(obj: T) => T;
export declare const useState: <T>(obj: T) => [T, (value: T) => void];
export declare const useRef: <T>(obj?: void | T | null | undefined) => T;
export declare const useContext: <T = {
    [key: string]: any;
}>(key: Context<T>) => T;
export declare const createContext: <T = {
    [key: string]: any;
}>(value: T) => Context<T>;
export declare const setContext: <T = {
    [key: string]: any;
}>(key: Context<T>, value: Partial<T>) => void;
export declare const onMount: (fn: () => any) => any;
export declare const onUpdate: (fn: () => any, deps?: any[]) => any;
export declare const onCreate: (fn: () => any) => any;
export declare const onInit: (fn: () => any) => any;
export declare const onUnMount: (fn: () => any) => any;
export declare const useDynamicTag: (fn: () => any) => any;
export declare const onError: (fn: () => any) => any;
export declare const useMetadata: (obj: object) => any;
export declare const useDefaultProps: <T = {
    [key: string]: any;
}>(value: T) => T;
export declare const useStyle: (value: string) => any;
export * from './parsers/jsx';
export * from './parsers/builder';
export * from './parsers/angular';
export * from './parsers/context';
export * from './generators/vue';
export * from './generators/angular';
export * from './generators/context/react';
export * from './generators/context/qwik';
export * from './generators/context/solid';
export * from './generators/context/vue';
export * from './generators/context/svelte';
export * from './generators/react';
export * from './generators/solid';
export * from './generators/liquid';
export * from './generators/builder';
export * from './generators/qwik/index';
export * from './symbols/symbol-processor';
export * from './generators/html';
export * from './generators/svelte';
export * from './generators/stencil';
export * from './generators/marko';
export * from './generators/mitosis';
export * from './generators/template';
export * from './generators/swift-ui';
export * from './generators/lit';
export * from './generators/react-native';
export * from './helpers/is-mitosis-node';
export * from './types/mitosis-node';
export * from './types/mitosis-component';
export * from './types/config';
export * from './types/transpiler';
export * from './types/plugins';
export * from './plugins/compile-away-builder-components';
export * from './plugins/compile-away-components';
export * from './plugins/map-styles';
export * from './targets';
