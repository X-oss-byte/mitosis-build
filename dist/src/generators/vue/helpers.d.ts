import { Nullable } from '../../helpers/nullable';
import { ContextGetInfo, ContextSetInfo, MitosisComponent } from '../../types/mitosis-component';
import { MitosisNode } from '../../types/mitosis-node';
import { ToVueOptions } from './types';
export declare const addPropertiesToJson: (properties: MitosisNode['properties']) => (json: MitosisNode) => MitosisNode;
export declare const addBindingsToJson: (bindings: MitosisNode['bindings']) => (json: MitosisNode) => MitosisNode;
export declare const getOnUpdateHookName: (index: number) => string;
export declare const invertBooleanExpression: (expression: string) => string;
export declare function encodeQuotes(string: string): string;
export declare const renameMitosisComponentsToKebabCase: (str: string) => string;
export declare function getContextNames(json: MitosisComponent): string[];
declare type ProcessBinding = {
    code: string;
    options: ToVueOptions;
    json: MitosisComponent;
    preserveGetter?: boolean;
    thisPrefix?: 'this' | '_this';
};
export declare const processBinding: ({ code, options, json, preserveGetter, thisPrefix, }: ProcessBinding) => string;
export declare const getContextValue: (args: Pick<ProcessBinding, 'options' | 'json' | 'thisPrefix'>) => ({ name, ref, value }: ContextSetInfo) => Nullable<string>;
export declare const checkIfContextHasStrName: (context: ContextGetInfo | ContextSetInfo) => boolean;
export declare const getContextKey: (context: ContextGetInfo | ContextSetInfo) => string;
export {};
