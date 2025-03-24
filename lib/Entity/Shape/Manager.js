"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Crasher_1 = __importDefault(require("./Crasher"));
const Pentagon_1 = __importDefault(require("./Pentagon"));
const Triangle_1 = __importDefault(require("./Triangle"));
const Square_1 = __importDefault(require("./Square"));
class ShapeManager {
    constructor(arena) {
        this.shapes = [];
        this.arena = arena;
        this.game = arena.game;
    }
    spawnShape() {
        let shape;
        const { x, y } = this.arena.findSpawnLocation();
        const rightX = this.arena.arenaData.values.rightX;
        const leftX = this.arena.arenaData.values.leftX;
        if (Math.max(x, y) < rightX / 10 && Math.min(x, y) > leftX / 10) {
            shape = new Pentagon_1.default(this.game, Math.random() <= 0.05);
            shape.positionData.values.x = x;
            shape.positionData.values.y = y;
            shape.relationsData.values.owner = shape.relationsData.values.team = this.arena;
        }
        else if (Math.max(x, y) < rightX / 5 && Math.min(x, y) > leftX / 5) {
            const isBig = Math.random() < .2;
            shape = new Crasher_1.default(this.game, isBig);
            shape.positionData.values.x = x;
            shape.positionData.values.y = y;
            shape.relationsData.values.owner = shape.relationsData.values.team = this.arena;
        }
        else {
            const rand = Math.random();
            if (rand < .04) {
                shape = new Pentagon_1.default(this.game);
                shape.positionData.values.x = x;
                shape.positionData.values.y = y;
                shape.relationsData.values.owner = shape.relationsData.values.team = this.arena;
            }
            else if (rand < .20) {
                shape = new Triangle_1.default(this.game);
                shape.positionData.values.x = x;
                shape.positionData.values.y = y;
                shape.relationsData.values.owner = shape.relationsData.values.team = this.arena;
            }
            else {
                shape = new Square_1.default(this.game);
                shape.positionData.values.x = x;
                shape.positionData.values.y = y;
                shape.relationsData.values.owner = shape.relationsData.values.team = this.arena;
            }
        }
        shape.scoreReward *= this.arena.shapeScoreRewardMultiplier;
        return shape;
    }
    killAll() {
        for (let i = 0; i < this.shapes.length; ++i) {
            this.shapes[i]?.delete();
        }
    }
    get wantedShapes() {
        return 1000;
    }
    tick() {
        for (let i = this.wantedShapes; i-- > 0;) {
            const shape = this.shapes[i];
            if (!shape || shape.hash === 0)
                this.shapes[i] = this.spawnShape();
        }
    }
}
exports.default = ShapeManager;