"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentToVue = exports.blockToVue = void 0;
var dedent_1 = __importDefault(require("dedent"));
var standalone_1 = require("prettier/standalone");
var collect_styles_1 = require("../helpers/collect-styles");
var fast_clone_1 = require("../helpers/fast-clone");
var get_state_object_string_1 = require("../helpers/get-state-object-string");
var map_refs_1 = require("../helpers/map-refs");
var render_imports_1 = require("../helpers/render-imports");
var strip_state_and_props_refs_1 = require("../helpers/strip-state-and-props-refs");
var get_props_1 = require("../helpers/get-props");
var jsx_1 = require("../parsers/jsx");
var plugins_1 = require("../modules/plugins");
var is_children_1 = __importDefault(require("../helpers/is-children"));
var strip_meta_properties_1 = require("../helpers/strip-meta-properties");
var remove_surrounding_block_1 = require("../helpers/remove-surrounding-block");
var is_mitosis_node_1 = require("../helpers/is-mitosis-node");
var traverse_1 = __importDefault(require("traverse"));
var get_components_used_1 = require("../helpers/get-components-used");
var lodash_1 = require("lodash");
var replace_idenifiers_1 = require("../helpers/replace-idenifiers");
var filter_empty_text_nodes_1 = require("../helpers/filter-empty-text-nodes");
var json5_1 = __importDefault(require("json5"));
var process_http_requests_1 = require("../helpers/process-http-requests");
var patterns_1 = require("../helpers/patterns");
function getContextNames(json) {
    return Object.keys(json.context.get);
}
// TODO: migrate all stripStateAndPropsRefs to use this here
// to properly replace context refs
function processBinding(code, _options, json) {
    return (0, replace_idenifiers_1.replaceIdentifiers)((0, strip_state_and_props_refs_1.stripStateAndPropsRefs)(code, {
        includeState: true,
        includeProps: true,
        replaceWith: 'this.',
    }), getContextNames(json), function (name) { return "this.".concat(name); });
}
var NODE_MAPPERS = {
    Fragment: function (json, options) {
        return json.children.map(function (item) { return (0, exports.blockToVue)(item, options); }).join('\n');
    },
    For: function (json, options) {
        var keyValue = json.bindings.key || 'index';
        var forValue = "(".concat(json.properties._forName, ", index) in ").concat((0, strip_state_and_props_refs_1.stripStateAndPropsRefs)(json.bindings.each));
        if (options.vueVersion >= 3) {
            // TODO: tmk key goes on different element (parent vs child) based on Vue 2 vs Vue 3
            return "<template :key=\"".concat(keyValue, "\" v-for=\"").concat(forValue, "\">\n        ").concat(json.children.map(function (item) { return (0, exports.blockToVue)(item, options); }).join('\n'), "\n      </template>");
        }
        // Vue 2 can only handle one root element
        var firstChild = json.children.filter(filter_empty_text_nodes_1.filterEmptyTextNodes)[0];
        if (!firstChild) {
            return '';
        }
        firstChild.bindings.key = keyValue;
        firstChild.properties['v-for'] = forValue;
        return (0, exports.blockToVue)(firstChild, options);
    },
    Show: function (json, options) {
        var ifValue = (0, strip_state_and_props_refs_1.stripStateAndPropsRefs)(json.bindings.when);
        if (options.vueVersion >= 3) {
            return "\n      <template v-if=\"".concat(ifValue, "\">\n        ").concat(json.children.map(function (item) { return (0, exports.blockToVue)(item, options); }).join('\n'), "\n      </template>\n      ").concat(!json.meta.else
                ? ''
                : "\n        <template v-else>\n          ".concat((0, exports.blockToVue)(json.meta.else, options), "\n        </template>\n      "), "\n      ");
        }
        var ifString = '';
        // Vue 2 can only handle one root element
        var firstChild = json.children.filter(filter_empty_text_nodes_1.filterEmptyTextNodes)[0];
        if (firstChild) {
            firstChild.properties['v-if'] = ifValue;
            ifString = (0, exports.blockToVue)(firstChild, options);
        }
        var elseString = '';
        var elseBlock = json.meta.else;
        if ((0, is_mitosis_node_1.isMitosisNode)(elseBlock)) {
            elseBlock.properties['v-else'] = '';
            elseString = (0, exports.blockToVue)(elseBlock, options);
        }
        return "\n    ".concat(ifString, "\n    ").concat(elseString, "\n    ");
    },
};
// TODO: Maybe in the future allow defining `string | function` as values
var BINDING_MAPPERS = {
    innerHTML: 'v-html',
};
// Transform <foo.bar key="value" /> to <component :is="foo.bar" key="value" />
function processDynamicComponents(json, _options) {
    (0, traverse_1.default)(json).forEach(function (node) {
        if ((0, is_mitosis_node_1.isMitosisNode)(node)) {
            if (node.name.includes('.')) {
                node.bindings.is = node.name;
                node.name = 'component';
            }
        }
    });
}
function processForKeys(json, _options) {
    (0, traverse_1.default)(json).forEach(function (node) {
        if ((0, is_mitosis_node_1.isMitosisNode)(node)) {
            if (node.name === 'For') {
                var firstChild = node.children[0];
                if (firstChild && firstChild.bindings.key) {
                    node.bindings.key = firstChild.bindings.key;
                    delete firstChild.bindings.key;
                }
            }
        }
    });
}
var stringifyBinding = function (node) { return function (_a) {
    var key = _a[0], value = _a[1];
    if (key === '_spread') {
        return '';
    }
    else if (key === 'class') {
        return " :class=\"_classStringToObject(".concat((0, strip_state_and_props_refs_1.stripStateAndPropsRefs)(value, {
            replaceWith: 'this.',
        }), ")\" ");
        // TODO: support dynamic classes as objects somehow like Vue requires
        // https://vuejs.org/v2/guide/class-and-style.html
    }
    else {
        // TODO: proper babel transform to replace. Util for this
        var useValue = (0, strip_state_and_props_refs_1.stripStateAndPropsRefs)(value);
        if (key.startsWith('on')) {
            var event_1 = key.replace('on', '').toLowerCase();
            if (event_1 === 'change' && node.name === 'input') {
                event_1 = 'input';
            }
            // TODO: proper babel transform to replace. Util for this
            return " @".concat(event_1, "=\"").concat((0, remove_surrounding_block_1.removeSurroundingBlock)(useValue
                // TODO: proper reference parse and replacing
                .replace(/event\./g, '$event.')), "\" ");
        }
        else if (key === 'ref') {
            return " ref=\"".concat(useValue, "\" ");
        }
        else if (BINDING_MAPPERS[key]) {
            return " ".concat(BINDING_MAPPERS[key], "=\"").concat(useValue, "\" ");
        }
        else {
            return " :".concat(key, "=\"").concat(useValue, "\" ");
        }
    }
}; };
var blockToVue = function (node, options) {
    var nodeMapper = NODE_MAPPERS[node.name];
    if (nodeMapper) {
        return nodeMapper(node, options);
    }
    if ((0, is_children_1.default)(node)) {
        return "<slot></slot>";
    }
    if (node.name === 'style') {
        // Vue doesn't allow <style>...</style> in templates, but does support the synonymous
        // <component is="style">...</component>
        node.name = 'component';
        node.bindings.is = 'style';
    }
    if (node.properties._text) {
        return "".concat(node.properties._text);
    }
    if (node.bindings._text) {
        return "{{".concat((0, strip_state_and_props_refs_1.stripStateAndPropsRefs)(node.bindings._text), "}}");
    }
    var str = '';
    str += "<".concat(node.name, " ");
    if (node.bindings._spread) {
        str += "v-bind=\"".concat((0, strip_state_and_props_refs_1.stripStateAndPropsRefs)(node.bindings._spread), "\"");
    }
    for (var key in node.properties) {
        var value = node.properties[key];
        str += " ".concat(key, "=\"").concat(value, "\" ");
    }
    var stringifiedBindings = Object.entries(node.bindings)
        .map(stringifyBinding(node))
        .join('');
    str += stringifiedBindings;
    if (jsx_1.selfClosingTags.has(node.name)) {
        return str + ' />';
    }
    str += '>';
    if (node.children) {
        str += node.children.map(function (item) { return (0, exports.blockToVue)(item, options); }).join('');
    }
    return str + "</".concat(node.name, ">");
};
exports.blockToVue = blockToVue;
function getContextInjectString(component, options) {
    var str = '{';
    for (var key in component.context.get) {
        str += "\n      ".concat(key, ": \"").concat(component.context.get[key].name, "\",\n    ");
    }
    str += '}';
    return str;
}
function getContextProvideString(component, options) {
    var str = '{';
    for (var key in component.context.set) {
        var _a = component.context.set[key], value = _a.value, name_1 = _a.name;
        str += "\n      ".concat(name_1, ": ").concat(value
            ? (0, get_state_object_string_1.getMemberObjectString)(value, {
                valueMapper: function (code) {
                    return (0, strip_state_and_props_refs_1.stripStateAndPropsRefs)(code, { replaceWith: '_this.' });
                },
            })
            : null, ",\n    ");
    }
    str += '}';
    return str;
}
var componentToVue = function (options) {
    if (options === void 0) { options = {}; }
    // hack while we migrate all other transpilers to receive/handle path
    // TO-DO: use `Transpiler` once possible
    return function (_a) {
        var _b, _c, _d, _e, _f, _g;
        var component = _a.component, path = _a.path;
        // Make a copy we can safely mutate, similar to babel's toolchain can be used
        component = (0, fast_clone_1.fastClone)(component);
        (0, process_http_requests_1.processHttpRequests)(component);
        processDynamicComponents(component, options);
        processForKeys(component, options);
        if (options.plugins) {
            component = (0, plugins_1.runPreJsonPlugins)(component, options.plugins);
        }
        (0, map_refs_1.mapRefs)(component, function (refName) { return "this.$refs.".concat(refName); });
        if (options.plugins) {
            component = (0, plugins_1.runPostJsonPlugins)(component, options.plugins);
        }
        var css = (0, collect_styles_1.collectCss)(component, {
            prefix: (_c = (_b = options.cssNamespace) === null || _b === void 0 ? void 0 : _b.call(options)) !== null && _c !== void 0 ? _c : undefined,
        });
        var dataString = (0, get_state_object_string_1.getStateObjectStringFromComponent)(component, {
            data: true,
            functions: false,
            getters: false,
        });
        var getterString = (0, get_state_object_string_1.getStateObjectStringFromComponent)(component, {
            data: false,
            getters: true,
            functions: false,
            valueMapper: function (code) {
                return processBinding(code.replace(patterns_1.GETTER, ''), options, component);
            },
        });
        var functionsString = (0, get_state_object_string_1.getStateObjectStringFromComponent)(component, {
            data: false,
            getters: false,
            functions: true,
            valueMapper: function (code) { return processBinding(code, options, component); },
        });
        var blocksString = JSON.stringify(component.children);
        // Component references to include in `component: { YourComponent, ... }
        var componentsUsed = Array.from((0, get_components_used_1.getComponentsUsed)(component))
            .filter(function (name) {
            return name.length &&
                !name.includes('.') &&
                name[0].toUpperCase() === name[0];
        })
            // Strip out components that compile away
            .filter(function (name) { return !['For', 'Show', 'Fragment', component.name].includes(name); });
        // Append refs to data as { foo, bar, etc }
        dataString = dataString.replace(/}$/, "".concat(component.imports
            .map(function (thisImport) { return Object.keys(thisImport.imports).join(','); })
            // Make sure actually used in template
            .filter(function (key) { return Boolean(key && blocksString.includes(key)); })
            // Don't include component imports
            .filter(function (key) { return !componentsUsed.includes(key); })
            .join(','), "}"));
        var elementProps = (0, get_props_1.getProps)(component);
        (0, strip_meta_properties_1.stripMetaProperties)(component);
        var template = component.children
            .map(function (item) { return (0, exports.blockToVue)(item, options); })
            .join('\n');
        var includeClassMapHelper = template.includes('_classStringToObject');
        if (includeClassMapHelper) {
            functionsString = functionsString.replace(/}\s*$/, "_classStringToObject(str) {\n        const obj = {};\n        if (typeof str !== 'string') { return obj }\n        const classNames = str.trim().split(/\\s+/); \n        for (const name of classNames) {\n          obj[name] = true;\n        } \n        return obj;\n      }  }");
        }
        var builderRegister = Boolean(options.builderRegister && component.meta.registerComponent);
        var str = (0, dedent_1.default)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    <template>\n      ", "\n    </template>\n    <script>\n      ", "\n      ", "\n\n      export default ", "{\n        ", "\n        ", "\n        ", "\n        ", "\n\n        ", "\n        ", "\n\n        ", "\n        ", "\n        ", "\n\n        ", "\n        ", "\n      }", "\n    </script>\n    ", "\n  "], ["\n    <template>\n      ", "\n    </template>\n    <script>\n      ", "\n      ", "\n\n      export default ", "{\n        ", "\n        ", "\n        ", "\n        ", "\n\n        ", "\n        ", "\n\n        ", "\n        ", "\n        ", "\n\n        ", "\n        ", "\n      }", "\n    </script>\n    ", "\n  "])), template, (0, render_imports_1.renderPreComponent)(component), component.meta.registerComponent
            ? (_d = options.registerComponentPrepend) !== null && _d !== void 0 ? _d : ''
            : '', !builderRegister ? '' : 'registerComponent(', !component.name
            ? ''
            : "name: '".concat(((_e = options.namePrefix) === null || _e === void 0 ? void 0 : _e.call(options, path))
                ? ((_f = options.namePrefix) === null || _f === void 0 ? void 0 : _f.call(options, path)) + '-'
                : '').concat((0, lodash_1.kebabCase)(component.name), "',"), !componentsUsed.length
            ? ''
            : "components: { ".concat(componentsUsed
                .map(function (componentName) {
                return "'".concat((0, lodash_1.kebabCase)(componentName), "': async () => ").concat(componentName);
            })
                .join(','), " },"), elementProps.size
            ? "props: ".concat(JSON.stringify(Array.from(elementProps).filter(function (prop) { return prop !== 'children' && prop !== 'class'; })), ",")
            : '', dataString.length < 4
            ? ''
            : "\n        data: () => (".concat(dataString, "),\n        "), (0, lodash_1.size)(component.context.set)
            ? "provide() {\n                const _this = this;\n                return ".concat(getContextProvideString(component, options), "\n              },")
            : '', (0, lodash_1.size)(component.context.get)
            ? "inject: ".concat(getContextInjectString(component, options), ",")
            : '', ((_g = component.hooks.onMount) === null || _g === void 0 ? void 0 : _g.code)
            ? "mounted() {\n                ".concat(processBinding(component.hooks.onMount.code, options, component), "\n              },")
            : '', component.hooks.onUpdate
            ? "updated() {\n                ".concat(processBinding(component.hooks.onUpdate.code, options, component), "\n              },")
            : '', component.hooks.onUnMount
            ? "unmounted() {\n                ".concat(processBinding(component.hooks.onUnMount.code, options, component), "\n              },")
            : '', getterString.length < 4
            ? ''
            : "\n          computed: ".concat(getterString, ",\n        "), functionsString.length < 4
            ? ''
            : "\n          methods: ".concat(functionsString, ",\n        "), !builderRegister
            ? ''
            : ", ".concat(json5_1.default.stringify(component.meta.registerComponent || {}), ")"), !css.trim().length
            ? ''
            : "<style scoped>\n      ".concat(css, "\n    </style>"));
        if (options.plugins) {
            str = (0, plugins_1.runPreCodePlugins)(str, options.plugins);
        }
        if (true || options.prettier !== false) {
            try {
                str = (0, standalone_1.format)(str, {
                    parser: 'vue',
                    plugins: [
                        // To support running in browsers
                        require('prettier/parser-html'),
                        require('prettier/parser-postcss'),
                        require('prettier/parser-babel'),
                    ],
                });
            }
            catch (err) {
                console.warn('Could not prettify', { string: str }, err);
            }
        }
        if (options.plugins) {
            str = (0, plugins_1.runPostCodePlugins)(str, options.plugins);
        }
        for (var _i = 0, removePatterns_1 = removePatterns; _i < removePatterns_1.length; _i++) {
            var pattern = removePatterns_1[_i];
            str = str.replace(pattern, '');
        }
        // Transform <FooBar> to <foo-bar> as Vue2 needs
        return str.replace(/<\/?\w+/g, function (match) {
            return match.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        });
    };
};
exports.componentToVue = componentToVue;
// Remove unused artifacts like empty script or style tags
var removePatterns = [
    "<script>\nexport default {};\n</script>",
    "<style>\n</style>",
];
var templateObject_1;
