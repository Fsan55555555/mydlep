"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Barrel_1 = __importDefault(require("../Tank/Barrel"));
const AutoTurret_1 = __importDefault(require("../Tank/AutoTurret"));
const AbstractBoss_1 = __importDefault(require("./AbstractBoss"));
const util_1 = require("../../util");
const MountedTurretDefinition = {
    ...AutoTurret_1.AutoTurretDefinition,
    size: 100,
    width: 100,
    bullet: {
        ...AutoTurret_1.AutoTurretDefinition.bullet,
        speed: 2.3,
        damage: 0.75,
        health: 5.75,
        color: 11
    }
};
const HeavyTurretDefinition = {
    ...AutoTurret_1.AutoTurretDefinition,
    size: 60,
    width: 60,
    bullet: {
        ...AutoTurret_1.AutoTurretDefinition.bullet,
        speed: 2,
        damage: 0.50,
        health: 3,
        reload: 2,
        color: 11
    }
};
const GuardianSpawnerDefinition = {
    angle: Math.PI,
    offset: 0,
    size: 80,
    width: 81.4,
    delay: 0,
    reload: 0.8,
    recoil: 1,
    isTrapezoid: true,
    trapezoidDirection: 0,
    addon: null,
    droneCount: 15,
    canControlDrones: true,
    bullet: {
        type: "drone",
        sizeRatio: 21 / (71.4 / 2),
        health: 7,
        damage: 0.2,
        speed: 1.4,
        scatterRate: 1,
        lifeLength: 1.5,
        absorbtionFactor: 1
    }
};
const GUARDIAN_SIZE = 110;
class Guardian extends AbstractBoss_1.default {
    constructor(game) {
        super(game);
        this.drones = [];
        this.nameData.values.name = 'GuardianBaby';
        this.altName = 'GuardianBaby';
        this.styleData.values.color = 11;
        this.damagePerTick = 20;
        this.relationsData.values.team = this.game.arena;
        this.physicsData.values.size = GUARDIAN_SIZE * Math.SQRT1_2;
        this.physicsData.values.sides = 3;
        this.barrels.push(new Barrel_1.default(this, GuardianSpawnerDefinition));
        const base = new AutoTurret_1.default(this, HeavyTurretDefinition, 30);
        for (let i = 0; i < 0; ++i) {
            this.drones.push(new Barrel_1.default(this, {
                ...GuardianSpawnerDefinition,
                angle: util_1.PI2 * ((i / 1) - 2 / 4)
            }));
            const base = new AutoTurret_1.default(this, MountedTurretDefinition);
            base.influencedByOwnerInputs = true;
            const angle = base.ai.inputs.mouse.angle = util_1.PI2 * (i / 1);
            base.positionData.values.y = this.physicsData.values.size * Math.sin(angle) * 0;
            base.positionData.values.x = this.physicsData.values.size * Math.cos(angle) * 0;
            base.physicsData.values.flags |= 1;
            const tickBase = base.tick;
            base.tick = (tick) => {
                base.positionData.y = this.physicsData.values.size * Math.sin(angle) * 0;
                base.positionData.x = this.physicsData.values.size * Math.cos(angle) * 0;
                tickBase.call(base, tick);
            };
        }
    }
    get sizeFactor() {
        return (this.physicsData.values.size / Math.SQRT1_2) / GUARDIAN_SIZE;
    }
    moveAroundMap() {
        super.moveAroundMap();
        this.positionData.angle = Math.atan2(this.inputs.movement.y, this.inputs.movement.x);
    }
    tick(tick) {
        super.tick(tick);
    }
}
exports.default = Guardian;
