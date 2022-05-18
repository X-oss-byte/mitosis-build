"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mitosis_1 = require("@builder.io/mitosis");
var basic_raw_1 = __importDefault(require("./basic.raw"));
var basic_onMount_update_raw_1 = __importDefault(require("./basic-onMount-update.raw"));
function MyBasicChildComponent() {
    var state = (0, mitosis_1.useState)({
        name: 'Steve',
    });
    return (<div>
      <basic_raw_1.default />
      <div>
        <basic_onMount_update_raw_1.default />
      </div>
    </div>);
}
exports.default = MyBasicChildComponent;
