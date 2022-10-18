"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOptionsApiScript = void 0;
var json5_1 = __importDefault(require("json5"));
var lodash_1 = require("lodash");
var get_components_used_1 = require("../../helpers/get-components-used");
var get_custom_imports_1 = require("../../helpers/get-custom-imports");
var get_state_object_string_1 = require("../../helpers/get-state-object-string");
var nullable_1 = require("../../helpers/nullable");
var patterns_1 = require("../../helpers/patterns");
var render_imports_1 = require("../../helpers/render-imports");
var helpers_1 = require("./helpers");
var strip_state_and_props_refs_1 = require("../../helpers/strip-state-and-props-refs");
function getContextInjectString(component, options) {
    var str = '{';
    for (var key in component.context.get) {
        str += "\n      ".concat(key, ": \"").concat((0, helpers_1.encodeQuotes)(component.context.get[key].name), "\",\n    ");
    }
    str += '}';
    return str;
}
function getContextProvideString(component, options) {
    var str = '{';
    for (var key in component.context.set) {
        var _a = component.context.set[key], ref = _a.ref, value = _a.value, name_1 = _a.name;
        str += "\n      ".concat(name_1, ": ").concat(value
            ? (0, get_state_object_string_1.stringifyContextValue)(value, {
                valueMapper: function (code) { return (0, strip_state_and_props_refs_1.stripStateAndPropsRefs)(code, { replaceWith: '_this.' }); },
            })
            : ref
                ? (0, strip_state_and_props_refs_1.stripStateAndPropsRefs)(ref, { replaceWith: '_this.' })
                : null, ",\n    ");
    }
    str += '}';
    return str;
}
var generateComponentImport = function (options) {
    return function (componentName) {
        if (options.vueVersion >= 3 && options.asyncComponentImports) {
            return "'".concat(componentName, "': defineAsyncComponent(").concat(componentName, ")");
        }
        else {
            return "'".concat(componentName, "': ").concat(componentName);
        }
    };
};
var generateComponents = function (componentsUsed, options) {
    if (componentsUsed.length === 0) {
        return '';
    }
    else {
        return "components: { ".concat(componentsUsed.map(generateComponentImport(options)).join(','), " },");
    }
};
var appendToDataString = function (_a) {
    var dataString = _a.dataString, newContent = _a.newContent;
    return dataString.replace(/}$/, "".concat(newContent, "}"));
};
function generateOptionsApiScript(component, options, path, template, props, onUpdateWithDeps, onUpdateWithoutDeps) {
    var _a, _b, _c, _d;
    var localExports = component.exports;
    var localVarAsData = [];
    var localVarAsFunc = [];
    if (localExports) {
        Object.keys(localExports).forEach(function (key) {
            if (localExports[key].usedInLocal) {
                if (localExports[key].isFunction) {
                    localVarAsFunc.push(key);
                }
                else {
                    localVarAsData.push(key);
                }
            }
        });
    }
    var dataString = (0, get_state_object_string_1.getStateObjectStringFromComponent)(component, {
        data: true,
        functions: false,
        getters: false,
    });
    // Append refs to data as { foo, bar, etc }
    dataString = appendToDataString({
        dataString: dataString,
        newContent: (0, get_custom_imports_1.getCustomImports)(component).join(','),
    });
    if (localVarAsData.length) {
        dataString = appendToDataString({ dataString: dataString, newContent: localVarAsData.join(',') });
    }
    var getterString = (0, get_state_object_string_1.getStateObjectStringFromComponent)(component, {
        data: false,
        getters: true,
        functions: false,
        valueMapper: function (code) {
            return (0, helpers_1.processBinding)({ code: code.replace(patterns_1.GETTER, ''), options: options, json: component });
        },
    });
    var functionsString = (0, get_state_object_string_1.getStateObjectStringFromComponent)(component, {
        data: false,
        getters: false,
        functions: true,
        valueMapper: function (code) { return (0, helpers_1.processBinding)({ code: code, options: options, json: component }); },
    });
    var includeClassMapHelper = template.includes('_classStringToObject');
    if (includeClassMapHelper) {
        functionsString = functionsString.replace(/}\s*$/, "_classStringToObject(str) {\n        const obj = {};\n        if (typeof str !== 'string') { return obj }\n        const classNames = str.trim().split(/\\s+/);\n        for (const name of classNames) {\n          obj[name] = true;\n        }\n        return obj;\n      }  }");
    }
    if (localVarAsFunc.length) {
        functionsString = functionsString.replace(/}\s*$/, "".concat(localVarAsFunc.join(','), "}"));
    }
    // Component references to include in `component: { YourComponent, ... }
    var componentsUsedInTemplate = Array.from((0, get_components_used_1.getComponentsUsed)(component))
        .filter(function (name) { return name.length && !name.includes('.') && name[0].toUpperCase() === name[0]; })
        // Strip out components that compile away
        .filter(function (name) { return !['For', 'Show', 'Fragment', 'Slot', component.name].includes(name); });
    // get default imports from component files
    var importedComponents = component.imports
        .filter(render_imports_1.checkIsComponentImport)
        .map(function (imp) { var _a; return (_a = Object.entries(imp.imports).find(function (_a) {
        var _ = _a[0], value = _a[1];
        return value === 'default';
    })) === null || _a === void 0 ? void 0 : _a[0]; })
        .filter(nullable_1.checkIsDefined);
    var componentsUsed = (0, lodash_1.uniq)(__spreadArray(__spreadArray([], componentsUsedInTemplate, true), importedComponents, true));
    var propsDefinition = Array.from(props).filter(function (prop) { return prop !== 'children' && prop !== 'class'; });
    // add default props (if set)
    if (component.defaultProps) {
        propsDefinition = propsDefinition.reduce(function (propsDefinition, curr) {
            var _a;
            return ((propsDefinition[curr] = ((_a = component.defaultProps) === null || _a === void 0 ? void 0 : _a.hasOwnProperty(curr))
                ? { default: component.defaultProps[curr] }
                : {}),
                propsDefinition);
        }, {});
    }
    return "\n        export default {\n        ".concat(!component.name
        ? ''
        : "name: '".concat(path && ((_a = options.namePrefix) === null || _a === void 0 ? void 0 : _a.call(options, path)) ? ((_b = options.namePrefix) === null || _b === void 0 ? void 0 : _b.call(options, path)) + '-' : '').concat((0, lodash_1.kebabCase)(component.name), "',"), "\n        ").concat(generateComponents(componentsUsed, options), "\n        ").concat(props.length ? "props: ".concat(json5_1.default.stringify(propsDefinition), ",") : '', "\n        ").concat(dataString.length < 4
        ? ''
        : "\n        data: () => (".concat(dataString, "),\n        "), "\n\n        ").concat((0, lodash_1.size)(component.context.set)
        ? "provide() {\n                const _this = this;\n                return ".concat(getContextProvideString(component, options), "\n              },")
        : '', "\n        ").concat((0, lodash_1.size)(component.context.get)
        ? "inject: ".concat(getContextInjectString(component, options), ",")
        : '', "\n        ").concat(((_c = component.hooks.onInit) === null || _c === void 0 ? void 0 : _c.code)
        ? "created() {\n                ".concat(component.hooks.onInit.code, "\n              },")
        : '', "\n        ").concat(((_d = component.hooks.onMount) === null || _d === void 0 ? void 0 : _d.code)
        ? "mounted() {\n                ".concat(component.hooks.onMount.code, "\n              },")
        : '', "\n        ").concat(onUpdateWithoutDeps.length
        ? "updated() {\n            ".concat(onUpdateWithoutDeps.map(function (hook) { return hook.code; }).join('\n'), "\n          },")
        : '', "\n        ").concat(onUpdateWithDeps.length
        ? "watch: {\n            ".concat(onUpdateWithDeps
            .map(function (hook, index) {
            return "".concat((0, helpers_1.getOnUpdateHookName)(index), "() {\n                  ").concat(hook.code, "\n                  }\n                ");
        })
            .join(','), "\n          },")
        : '', "\n        ").concat(component.hooks.onUnMount
        ? "unmounted() {\n                ".concat(component.hooks.onUnMount.code, "\n              },")
        : '', "\n\n        ").concat(getterString.length < 4
        ? ''
        : " \n          computed: ".concat(getterString, ",\n        "), "\n        ").concat(functionsString.length < 4
        ? ''
        : "\n          methods: ".concat(functionsString, ",\n        "), "\n        ").concat(Object.entries(component.meta.vueConfig || {})
        .map(function (_a) {
        var k = _a[0], v = _a[1];
        return "".concat(k, ": ").concat(v);
    })
        .join(','), "\n      }");
}
exports.generateOptionsApiScript = generateOptionsApiScript;
