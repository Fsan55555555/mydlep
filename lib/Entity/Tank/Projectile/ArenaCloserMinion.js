"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Barrel_1 = __importDefault(require("../Barrel"));
const TankBody_1 = __importDefault(require("../../Tank/TankBody"));
const Drone_1 = __importDefault(require("./Drone"));
const AI_1 = require("../../AI");
const ACMinionBarrelDefinition = {
    angle: 0,
    offset: 0,
    size: 95,
    width: 42,
    delay: 0,
    reload: 2,
    recoil: 1,
    isTrapezoid: false,
    trapezoidDirection: 0,
    addon: null,
    bullet: {
        type: "bullet",
        health: 1.6,
        damage: 1.75,
        speed: 1.4,
        scatterRate: 1,
        lifeLength: 1.2,
        sizeRatio: 1,
        absorbtionFactor: 1.5
    }
};
class ACMinion extends Drone_1.default {
    constructor(barrel, tank, tankDefinition, shootAngle, game) {
        super(barrel, tank, tankDefinition, shootAngle, game);
        this.reloadTime = 1;
        this.inputs = new AI_1.Inputs();
        const bulletDefinition = barrel.definition.bullet;
        this.inputs = this.ai.inputs;
        this.ai.viewRange = Infinity;
        this.usePosAngle = false;
        this.physicsData.values.size *= 1.2;
        this.physicsData.values.flags |= 256;
        this.physicsData.values.sides = 1;
        this.cameraEntity = tank.cameraEntity;
        this.acminionBarrel = new Barrel_1.default(this, ACMinionBarrelDefinition);
        this.ai.movementSpeed = this.ai.aimSpeed = this.baseAccel;
    }
    get sizeFactor() {
        return this.physicsData.values.size / 50;
    }
    tickMixin(tick) {
        this.reloadTime = this.tank.reloadTime;
        const usingAI = !this.canControlDrones || !this.tank.inputs.attemptingShot() && !this.tank.inputs.attemptingRepel();
        const inputs = !usingAI ? this.tank.inputs : this.ai.inputs;
        if (usingAI && this.ai.state === 0) {
            this.movementAngle = this.positionData.values.angle;
        }
        else {
            this.inputs.flags |= 1;
            const dist = inputs.mouse.distanceToSQ(this.positionData.values);
            if (dist < ACMinion.FOCUS_RADIUS / 4) {
                this.movementAngle = this.positionData.values.angle + Math.PI;
            }
            else if (dist < ACMinion.FOCUS_RADIUS) {
                this.movementAngle = this.positionData.values.angle + Math.PI / 2;
            }
            else
                this.movementAngle = this.positionData.values.angle;
        }
        super.tickMixin(tick);
    }
}
exports.default = ACMinion;
ACMinion.FOCUS_RADIUS = 0