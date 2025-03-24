"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Camera_1 = require("../../Native/Camera");
const AI_1 = require("../AI");
const Bullet_1 = __importDefault(require("../Tank/Projectile/Bullet"));
const TankBody_1 = __importDefault(require("../Tank/TankBody"));
const TeamEntity_1 = require("./TeamEntity");

class Dominator extends TankBody_1.default {
    constructor(arena, base) {
        const inputs = new AI_1.Inputs();
        const camera = new Camera_1.CameraEntity(arena.game);
        camera.setLevel(75);
        camera.sizeFactor = (Dominator.SIZE / 50);
        super(arena.game, camera, inputs);
        this.physicsData.values.size = Dominator.SIZE;
        this.styleData.values.color = 12; // デフォルトの色（後で上書きされる）
        this.ai = new AI_1.AI(this, true);
        this.ai.inputs = inputs;
        this.ai.movementSpeed = 0;
        this.ai.viewRange = 2000;
        this.ai.doAimPrediction = true;
        this.setTank(56);
        const def = (this.definition = Object.assign({}, this.definition));
        def.speed = camera.cameraData.values.movementSpeed = 0;
        this.nameData.values.name = "Dominator";
        this.nameData.values.flags |= 1;
        this.physicsData.values.absorbtionFactor = 0;
        this.positionData.values.x = base.positionData.values.x;
        this.positionData.values.y = base.positionData.values.y;
        this.scoreReward = 0;
        camera.cameraData.values.player = this;
        this.base = base;
        if (this.styleData.values.flags & 4) {
            this.styleData.values.flags ^= 4;
            this.damageReduction = 1.0;
        }
    }

    onDeath(killer) {
        if (killer.relationsData.values.team instanceof TeamEntity_1.TeamEntity) {
            this.relationsData.team = killer.relationsData.values.team;
            this.styleData.color = this.relationsData.team.teamData.values.teamColor;
        } else {
            // キラーがチームに所属していない場合（稀なケース）はアリーナに設定
            this.relationsData.team = this.game.arena;
            this.styleData.color = this.game.arena.teamData.teamColor;
        }
        this.base.styleData.color = this.styleData.values.color;
        this.base.relationsData.team = this.relationsData.values.team;
        this.healthData.health = this.healthData.values.maxHealth;
        for (let i = 1; i <= this.game.entities.lastId; ++i) {
            const entity = this.game.entities.inner[i];
            if (entity instanceof Bullet_1.default && entity.relationsData.values.owner === this)
                entity.destroy();
        }
        if (this.ai.state === 3) {
            this.ai.inputs.deleted = true;
            this.ai.inputs = this.inputs = new AI_1.Inputs();
            this.ai.state = 0;
        }
    }

    tick(tick) {
        if (!this.barrels.length)
            return super.tick(tick);
        this.ai.aimSpeed = this.barrels[0].bulletAccel;
        this.inputs = this.ai.inputs;
        if (this.ai.state === 0) {
            const angle = this.positionData.values.angle + this.ai.passiveRotation;
            const mag = Math.sqrt((this.inputs.mouse.x - this.positionData.values.x) ** 2 + (this.inputs.mouse.y - this.positionData.values.y) ** 2);
            this.inputs.mouse.set({
                x: this.positionData.values.x + Math.cos(angle) * mag,
                y: this.positionData.values.y + Math.sin(angle) * mag
            });
        }
        super.tick(tick);
    }
}
Dominator.SIZE = 160;
exports.default = Dominator;