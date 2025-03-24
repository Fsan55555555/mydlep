"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Arena_1 = __importDefault(require("../Native/Arena"));
const arenaSize = 11500;
const Padding = require("../Entity/Misc/Padding").default;
class FFAArena extends Arena_1.default {
    constructor(game) {
        super(game);
        this.updateBounds(arenaSize * 2, arenaSize * 2);
        const PaddingInsta = new Padding(this.game, -23000 / 2, -23000 / 2, 23000, 23000, 21600, 21600);
     }
}
exports.default = FFAArena;
