import { Dictionary } from '../helpers/typescript';
import { Target } from './config';
import { JSONObject } from './json';
import { ComponentMetadata } from './metadata';
import { MitosisNode } from './mitosis-node';
/**
 * @example
 *  // import core, { useState, someThing as someAlias } from '@builder.io/mitosis'
 *  {
 *    path: '@builder.io/mitosis',
 *    imports: {
 *      useState: 'useState',
 *      someAlias: 'someThing',
 *      core: 'default',
 *    }
 *  }
 *
 * @example
 *  // import * as core from '@builder.io/mitosis'
 *  {
 *    path: '@builder.io/mitosis',
 *    imports: {
 *      core: '*',
 *    }
 *  }
 */
export interface MitosisImport {
    path: string;
    imports: {
        [key: string]: string | undefined;
    };
    importKind?: 'type' | 'typeof' | 'value' | null;
}
export declare type ReactivityType = 'normal' | 'reactive';
export declare type ContextOptions = {
    type?: ReactivityType;
};
export interface ContextGetInfo extends ContextOptions {
    name: string;
    path: string;
}
export interface ContextSetInfo extends ContextOptions {
    name: string;
    value?: MitosisState;
    ref?: string;
}
export declare type extendedHook = {
    code: string;
    deps?: string;
};
export declare type MitosisComponentInput = {
    name: string;
    defaultValue: any;
};
export declare type MitosisExports = {
    [name: string]: MitosisExport;
};
export interface MitosisExport {
    code: string;
    usedInLocal?: boolean;
    isFunction?: boolean;
}
export declare type StateValueType = 'function' | 'getter' | 'method' | 'property';
export declare type StateValue = {
    code: string;
    typeParameter?: string;
    type: StateValueType;
    propertyType?: ReactivityType;
};
export declare type MitosisState = Dictionary<StateValue | undefined>;
export declare type TargetBlock<Return, Targets extends Target = Target> = Partial<{
    [T in Targets | 'default']?: Return;
}>;
export declare type TargetBlockCode = TargetBlock<{
    code: string;
}>;
export declare type TargetBlockDefinition = TargetBlockCode & {
    settings: {
        requiresDefault: boolean;
    };
};
export declare type MitosisComponent = {
    '@type': '@builder.io/mitosis/component';
    name: string;
    imports: MitosisImport[];
    exports?: MitosisExports;
    meta: JSONObject & {
        useMetadata?: ComponentMetadata;
    };
    inputs: MitosisComponentInput[];
    state: MitosisState;
    context: {
        get: Dictionary<ContextGetInfo>;
        set: Dictionary<ContextSetInfo>;
    };
    signals?: {
        signalTypeImportName?: string;
    };
    props?: {
        [name: string]: {
            propertyType: ReactivityType;
            optional: boolean;
        };
    };
    refs: {
        [useRef: string]: {
            typeParameter?: string;
            argument: string;
        };
    };
    hooks: {
        init?: extendedHook;
        onInit?: extendedHook;
        onMount?: extendedHook;
        onUnMount?: extendedHook;
        preComponent?: extendedHook;
        postComponent?: extendedHook;
        onUpdate?: extendedHook[];
    };
    targetBlocks?: Dictionary<TargetBlockDefinition>;
    children: MitosisNode[];
    subComponents: MitosisComponent[];
    types?: string[];
    propsTypeRef?: string;
    defaultProps?: MitosisState;
    style?: string;
};
