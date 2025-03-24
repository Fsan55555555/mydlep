"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractShape_1 = __importDefault(require("./AbstractShape"));
class Square extends AbstractShape_1.default {
    constructor(game, shiny = Math.random() < 0.000001) {
        super(game);
        this.nameData.values.name = "Square";
        this.healthData.values.health = this.healthData.values.maxHealth = 10;
        this.physicsData.values.size = 55 * Math.SQRT1_2;
        this.physicsData.values.sides = 4;
        this.styleData.values.color = shiny ? 7 : 8;
        this.damagePerTick = 8;
        this.scoreReward = 10;
        this.isShiny = shiny;
        if (shiny) {
            this.scoreReward *= 100;
            this.healthData.values.health = this.healthData.values.maxHealth *= 10;
        }
    }
}
exports.default = Square;
