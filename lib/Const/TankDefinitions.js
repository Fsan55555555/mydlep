"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTankByName = exports.getTankById = exports.TankCount = exports.visibilityRateDamage = void 0;
const DevTankDefinitions_1 = __importDefault(require("./DevTankDefinitions"));
const TankDefinitions_json_1 = __importDefault(require("./TankDefinitions.json"));
exports.visibilityRateDamage = 0.2;
const TankDefinitions = TankDefinitions_json_1.default;
exports.default = TankDefinitions;
exports.TankCount = TankDefinitions.reduce((a, b) => b ? a + 1 : a, 0);
const getTankById = function (id) {
    return (id < 0 ? DevTankDefinitions_1.default[~id] : TankDefinitions[id]) || null;
};
exports.getTankById = getTankById;
const getTankByName = function (tankName) {
    return TankDefinitions.find(tank => tank && tank.name === tankName) || DevTankDefinitions_1.default.find(tank => tank && tank.name === tankName) || null;
};
exports.getTankByName = getTankByName;
