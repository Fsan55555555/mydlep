"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveToVLog = exports.saveToLog = exports.normalizeAngle = exports.PI2 = exports.constrain = exports.removeFast = exports.inspectLog = exports.warn = exports.log = void 0;
const chalk = __importStar(require("chalk"));
const util_1 = require("util");
const config_1 = require("./config");
const log = (...args) => {
    console.log(`[${Date().split(" ")[4]}]`, ...args);
};
exports.log = log;
const warn = (...args) => {
    args = args.map(s => typeof s === "string" ? chalk.yellow(s) : s);
    console.log(chalk.yellow(`[${Date().split(" ")[4]}] WARNING: `), ...args);
};
exports.warn = warn;
const inspectLog = (object, c = 14) => {
    console.log((0, util_1.inspect)(object, false, c, true));
};
exports.inspectLog = inspectLog;
const removeFast = (array, index) => {
    if (index < 0 || index >= array.length)
        throw new RangeError("Index out of range. In `removeFast`");
    if (index === array.length - 1)
        array.pop();
    else
        array[index] = array.pop();
};
exports.removeFast = removeFast;
const constrain = (value, min, max) => {
    return Math.max(min, Math.min(max, value));
};
exports.constrain = constrain;
exports.PI2 = Math.PI * 2;
const normalizeAngle = (angle) => {
    return ((angle % exports.PI2) + exports.PI2) % exports.PI2;
};
exports.normalizeAngle = normalizeAngle;
const saveToLog = (title, description, color) => {
    console.log("[!] " + title + " (#" + color.toString(16).padStart(6, "0") + ")\n :: " + description);
};
exports.saveToLog = saveToLog;
const saveToVLog = (text) => {
    if (config_1.doVerboseLogs)
        console.log("[v] " + text);
};
exports.saveToVLog = saveToVLog;
