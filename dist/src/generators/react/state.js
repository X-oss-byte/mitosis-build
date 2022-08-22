"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStateSettersInCode = exports.updateStateSetters = exports.getUseStateCode = exports.processHookCode = void 0;
var core_1 = require("@babel/core");
var json5_1 = __importDefault(require("json5"));
var traverse_1 = __importDefault(require("traverse"));
var function_literal_prefix_1 = require("../../constants/function-literal-prefix");
var method_literal_prefix_1 = require("../../constants/method-literal-prefix");
var babel_transform_1 = require("../../helpers/babel-transform");
var capitalize_1 = require("../../helpers/capitalize");
var is_mitosis_node_1 = require("../../helpers/is-mitosis-node");
var function_1 = require("fp-ts/lib/function");
var helpers_1 = require("./helpers");
/**
 * Removes all `this.` references.
 */
var stripThisRefs = function (str, options) {
    if (options.stateType !== 'useState') {
        return str;
    }
    return str.replace(/this\.([a-zA-Z_\$0-9]+)/g, '$1');
};
var processHookCode = function (_a) {
    var str = _a.str, options = _a.options;
    return (0, helpers_1.processBinding)((0, exports.updateStateSettersInCode)(str, options), options);
};
exports.processHookCode = processHookCode;
var valueMapper = function (options) { return function (val) {
    var x = (0, exports.processHookCode)({ str: val, options: options });
    return stripThisRefs(x, options);
}; };
var getSetStateFnName = function (stateName) { return "set".concat((0, capitalize_1.capitalize)(stateName)); };
var processStateValue = function (options) {
    var mapValue = valueMapper(options);
    return function (_a) {
        var key = _a[0], stateVal = _a[1];
        var value = stateVal === null || stateVal === void 0 ? void 0 : stateVal.code;
        if (typeof value === 'string') {
            if (value.startsWith(function_literal_prefix_1.functionLiteralPrefix)) {
                // functions
                var useValue = value.replace(function_literal_prefix_1.functionLiteralPrefix, '');
                var mappedVal = mapValue(useValue);
                return mappedVal;
            }
            else if (value.startsWith(method_literal_prefix_1.methodLiteralPrefix)) {
                // methods
                var methodValue = value.replace(method_literal_prefix_1.methodLiteralPrefix, '');
                var useValue = methodValue.replace(/^(get )?/, 'function ');
                return mapValue(useValue);
            }
        }
        // Other (data)
        var transformedValue = (0, function_1.pipe)(value, json5_1.default.stringify, mapValue);
        var defaultCase = "const [".concat(key, ", ").concat(getSetStateFnName(key), "] = useState(() => (").concat(transformedValue, "))");
        return defaultCase;
    };
};
var getUseStateCode = function (json, options) {
    var lineItemDelimiter = '\n\n\n';
    var stringifiedState = Object.entries(json.state).map(processStateValue(options));
    return stringifiedState.join(lineItemDelimiter);
};
exports.getUseStateCode = getUseStateCode;
var updateStateSetters = function (json, options) {
    if (options.stateType !== 'useState') {
        return;
    }
    (0, traverse_1.default)(json).forEach(function (item) {
        if ((0, is_mitosis_node_1.isMitosisNode)(item)) {
            for (var key in item.bindings) {
                var values = item.bindings[key];
                var newValue = (0, exports.updateStateSettersInCode)(values === null || values === void 0 ? void 0 : values.code, options);
                if (newValue !== (values === null || values === void 0 ? void 0 : values.code)) {
                    item.bindings[key] = {
                        code: newValue,
                        arguments: values === null || values === void 0 ? void 0 : values.arguments,
                    };
                }
            }
        }
    });
};
exports.updateStateSetters = updateStateSetters;
var updateStateSettersInCode = function (value, options) {
    if (options.stateType !== 'useState') {
        return value;
    }
    return (0, babel_transform_1.babelTransformExpression)(value, {
        AssignmentExpression: function (path) {
            var node = path.node;
            if (core_1.types.isMemberExpression(node.left)) {
                if (core_1.types.isIdentifier(node.left.object)) {
                    // TODO: utillity to properly trace this reference to the beginning
                    if (node.left.object.name === 'state') {
                        // TODO: ultimately support other property access like strings
                        var propertyName = node.left.property.name;
                        path.replaceWith(core_1.types.callExpression(core_1.types.identifier("".concat(getSetStateFnName(propertyName))), [
                            node.right,
                        ]));
                    }
                }
            }
        },
    });
};
exports.updateStateSettersInCode = updateStateSettersInCode;
