"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const Camera_1 = require("../../Native/Camera");
const AI_1 = require("../AI");
const TankBody_1 = require("../Tank/TankBody");

class AiTank extends TankBody_1.default {
    constructor(game, owner) {
        const inputs = new AI_1.Inputs();
        const camera = new Camera_1.CameraEntity(game);
        camera.setLevel(45);
        super(game, camera, inputs);
        this.inputs = inputs;
        this.camera = camera;
        this.relationsData = this.relationsData || { values: {} };
        this.hasRandomized = false;
        this.styleData = this.styleData || { values: {} };
        this.styleData.values.color = 4;
        this.viewRange = 2100;
        this.ai = new AI_1.AI(this, true);
        this.ai.inputs = inputs;
        this.ai.doAimPrediction = true;
        this.positionData = this.positionData || { values: { x: 0, y: 0, angle: 0 } };
        this.positionData.values.x = 0;
        this.positionData.values.y = 0;
        this.nameData = this.nameData || { values: {} };
        this.nameData.values.name = "🤖AIPlayer🤖";
        camera.cameraData.values.player = this;
        this.lastTarget = null;
        this.targetLockStartTick = -1;
        this.chargeState = false;
        this.fleeState = false;
        this.actionStartTick = -1;
        this.actionDuration = 5 * config_1.tps;
        this.randomMoveStartTick = -1;
        this.randomMoveDuration = config_1.tps;
        this.rotationChangeInterval = config_1.tps * 5;
        this.nextRotationChangeTick = -1;
        this.straightMoveUntilTick = null;
        this.viewRangeCheckInterval = 10;
        this.nextViewRangeCheckTick = -1;
    }

    getDistanceSquared(target) {
        const dx = this.positionData.values.x - target.positionData.values.x;
        const dy = this.positionData.values.y - target.positionData.values.y;
        return dx * dx + dy * dy;
    }

findClosestTarget(tick) {
    const entities = this.game.entities.collisionManager.retrieve(
        this.positionData.values.x,
        this.positionData.values.y,
        this.ai.viewRange,
        this.ai.viewRange
    ) || [];

    let closestTarget = null;
    let minDistanceSquared = this.ai.viewRange * this.ai.viewRange;

    const Live_1 = require("../../Entity/Live").default;

    for (const entity of entities) {
        if (entity === this ||
            entity.deleted ||
            (entity.healthData && entity.healthData.values.health <= 0) ||
            (entity.relationsData?.values?.team === this.relationsData?.values?.team)) {
            continue;
        }

        if (entity instanceof Live_1 && (entity.physicsData?.values?.flags & 256)) {
            continue;
        }

        const distSquared = this.getDistanceSquared(entity);
        if (distSquared <= minDistanceSquared) {
            minDistanceSquared = distSquared;
            closestTarget = entity;
        }
    }

    return closestTarget;
}

    tick(tick) {
        if (!this.hasRandomized) {
            this.randomizeTank();
            this.hasRandomized = true;
        }

        if (!this.barrels?.length) return super.tick(tick);

        const FLEE_DURATION = config_1.tps * 10;

        if (this.fleeUntilTick) {
            if (tick < this.fleeUntilTick) {
                this.inputs.movement.set({ x: this.fleeDirection.x, y: this.fleeDirection.y });
                this.inputs.movement.magnitude = 0.7;
                if (this.lastTarget && this.lastTarget.positionData) {
                    this.inputs.mouse.set({
                        x: this.lastTarget.positionData.values.x,
                        y: this.lastTarget.positionData.values.y
                    });
                }
                super.tick(tick);
                return;
            } else {
                this.fleeUntilTick = null;
                this.fleeDirection = null;
            }
        } else if (this.healthData && this.healthData.values.health <= 20) {
            if (!this.fleeUntilTick) {
                if (this.lastTarget && this.lastTarget.positionData) {
                    const dx = this.positionData.values.x - this.lastTarget.positionData.values.x;
                    const dy = this.positionData.values.y - this.lastTarget.positionData.values.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    this.fleeDirection = { x: dx / len, y: dy / len };
                } else {
                    const angle = this.positionData.values.angle + Math.PI;
                    this.fleeDirection = { x: Math.cos(angle), y: Math.sin(angle) };
                }
                this.fleeUntilTick = tick + FLEE_DURATION;
                this.inputs.movement.set({ x: this.fleeDirection.x, y: this.fleeDirection.y });
                this.inputs.movement.magnitude = 0.7;
                if (this.lastTarget && this.lastTarget.positionData) {
                    this.inputs.mouse.set({
                        x: this.lastTarget.positionData.values.x,
                        y: this.lastTarget.positionData.values.y
                    });
                }
                super.tick(tick);
                return;
            }
        }

        if (this.lastTarget &&
            (this.lastTarget.deleted ||
             (this.lastTarget.healthData && this.lastTarget.healthData.values.health <= 0))) {
            this.lastTarget = null;
            this.targetLockStartTick = -1;
            this.nextViewRangeCheckTick = -1;
        }

        if (this.lastTarget) {
            if (this.nextViewRangeCheckTick === -1) {
                this.nextViewRangeCheckTick = tick + this.viewRangeCheckInterval;
            }
            if (tick >= this.nextViewRangeCheckTick) {
                const distSquared = this.getDistanceSquared(this.lastTarget);
                if (distSquared > (this.ai.viewRange * this.ai.viewRange)) {
                    this.lastTarget = null;
                    this.targetLockStartTick = -1;
                }
                this.nextViewRangeCheckTick = tick + this.viewRangeCheckInterval;
            }
        }

        if (!this.lastTarget) {
            this.ai.viewRange = 2100;
            this.lastTarget = this.findClosestTarget(tick); // ここで呼び出している
            if (this.lastTarget) {
                this.targetLockStartTick = tick;
                this.nextViewRangeCheckTick = tick + this.viewRangeCheckInterval;
            } else {
                this.targetLockStartTick = -1;
                this.nextViewRangeCheckTick = -1;
            }
        }
        const target = this.lastTarget;

        if (this.ai.state === 0 || this.ai.state === 1) {
            if (!target) {
                if (this.nextRotationChangeTick === -1) {
                    this.nextRotationChangeTick = tick + this.rotationChangeInterval;
                }
                if (tick >= this.nextRotationChangeTick) {
                    this.ai.passiveRotation = (Math.random() - 0.5) * Math.PI / 4;
                    this.nextRotationChangeTick = tick + this.rotationChangeInterval;
                }
                if (Math.random() < 0.05) {
                    this.straightMoveUntilTick = tick + config_1.tps * 2;
                }
                let angle;
                if (this.straightMoveUntilTick && tick < this.straightMoveUntilTick) {
                    angle = this.positionData.values.angle;
                } else {
                    this.straightMoveUntilTick = null;
                    angle = this.positionData.values.angle + this.ai.passiveRotation;
                }
                this.inputs.movement.set({ x: Math.cos(angle), y: Math.sin(angle) });
                this.inputs.movement.magnitude = 0.7;
                this.inputs.mouse.set({
                    x: this.positionData.values.x + Math.cos(angle) * 100,
                    y: this.positionData.values.y + Math.sin(angle) * 100
                });
            } else {
                const targetX = target.positionData.values.x;
                const targetY = target.positionData.values.y;
                const distSQ = (targetX - this.positionData.values.x) ** 2 +
                               (targetY - this.positionData.values.y) ** 2;

                if (Math.random() < 0.01) {
                    const randomAngle = Math.random() * 2 * Math.PI;
                    this.inputs.movement.set({ x: Math.cos(randomAngle), y: Math.sin(randomAngle) });
                    this.inputs.movement.magnitude = 0.7;
                } else if (this.randomMoveStartTick !== -1 && tick - this.randomMoveStartTick < this.randomMoveDuration) {
                    const randomAngle = Math.random() * 2 * Math.PI;
                    this.inputs.movement.set({ x: Math.cos(randomAngle), y: Math.sin(randomAngle) });
                    this.inputs.movement.magnitude = 0.7;
                } else {
                    this.randomMoveStartTick = -1;
                    if (this.chargeState) {
                        if (tick - this.actionStartTick < this.actionDuration) {
                            this.inputs.movement.set({
                                x: targetX - this.positionData.values.x,
                                y: targetY - this.positionData.values.y
                            });
                            this.inputs.movement.magnitude = 0.7;
                        } else {
                            this.chargeState = false;
                            this.randomMoveStartTick = tick;
                        }
                    } else if (this.fleeState) {
                        if (tick - this.actionStartTick < this.actionDuration) {
                            this.inputs.movement.set({
                                x: this.positionData.values.x - targetX,
                                y: this.positionData.values.y - targetY
                            });
                            this.inputs.movement.magnitude = 0.7;
                        } else {
                            this.fleeState = false;
                            this.randomMoveStartTick = tick;
                        }
                    } else {
                        if (this.targetLockStartTick !== -1) {
                            const elapsedTicks = tick - this.targetLockStartTick;
                            if (elapsedTicks >= 30 * config_1.tps) {
                                const action = Math.random() < 0.5 ? 'charge' : 'flee';
                                if (action === 'charge') this.chargeState = true;
                                else this.fleeState = true;
                                this.actionStartTick = tick;
                                this.targetLockStartTick = -1;
                            } else {
                                if (distSQ < AiTank.FOCUS_RADIUS / 2) {
                                    this.inputs.movement.set({
                                        x: this.positionData.values.x - targetX,
                                        y: this.positionData.values.y - targetY
                                    });
                                    this.inputs.movement.magnitude = 0.7;
                                } else if (distSQ < AiTank.FOCUS_RADIUS) {
                                    const angle = Math.atan2(targetY - this.positionData.values.y, targetX - this.positionData.values.x) + Math.PI / 2;
                                    this.inputs.movement.set({ x: Math.cos(angle), y: Math.sin(angle) });
                                    this.inputs.movement.magnitude = 0.7;
                                } else {
                                    this.inputs.movement.set({
                                        x: targetX - this.positionData.values.x,
                                        y: targetY - this.positionData.values.y
                                    });
                                    this.inputs.movement.magnitude = 0.7;
                                }
                            }
                        } else {
                            if (distSQ < AiTank.FOCUS_RADIUS / 2) {
                                this.inputs.movement.set({
                                    x: this.positionData.values.x - targetX,
                                    y: this.positionData.values.y - targetY
                                });
                                this.inputs.movement.magnitude = 0.7;
                            } else if (distSQ < AiTank.FOCUS_RADIUS) {
                                const angle = Math.atan2(targetY - this.positionData.values.y, targetX - this.positionData.values.x) + Math.PI / 2;
                                this.inputs.movement.set({ x: Math.cos(angle), y: Math.sin(angle) });
                                this.inputs.movement.magnitude = 0.7;
                            } else {
                                this.inputs.movement.set({
                                    x: targetX - this.positionData.values.x,
                                    y: targetY - this.positionData.values.y
                                });
                                this.inputs.movement.magnitude = 0.7;
                            }
                        }
                        this.inputs.mouse.set({ x: targetX, y: targetY });
                        this.inputs.flags |= 1;
                    }
                }
            }
        }

        super.tick(tick);
    }

    updateStats(levels) {
        levels.forEach((lvl, i) => {
            this.camera.cameraData.values.statLevels.values[i] = lvl;
        });
    }

    randomizeTank() {
        const configs = [
            { tank: 1, stats: [4, 5, 7, 6, 2] },
            { tank: 22, stats: [0, 5, 5, 6, 3] },
            { tank: 6, stats: [3, 5, 6, 5, 1] },
            { tank: 8, stats: [0, 1, 0, 4, 7, 7, 5, 2], viewRange: 2300 },
            { tank: 18, stats: [1, 6, 7, 5, 7, 1] },
            { tank: 31, stats: [3, 6, 5, 6, 2] },
            { tank: 13, stats: [4, 5, 7, 7, 4], viewRange: 2300 },
            { tank: 9, stats: [1, 6, 5, 6, 5] },
            { tank: 10, stats: [6, 7, 5, 7, 0] },
            { tank: 25, stats: [6, 6, 7, 6, 2] },
            { tank: 20, stats: [0, 3, 0, 5, 5, 5, 6, 0] },
            { tank: 2, stats: [0, 0, 0, 5, 7, 7, 6, 1] },
            { tank: 29, stats: [0, 0, 0, 5, 7, 7, 7, 1] },
            { tank: 0, stats: [7, 6, 7, 6, 0] }
        ];

        const randomIndex = Math.floor(Math.random() * configs.length);
        const cfg = configs[randomIndex];
        this.setTank(cfg.tank);
        this.updateStats(cfg.stats);
        if (cfg.viewRange) this.ai.viewRange = cfg.viewRange;
    }
}

exports.default = AiTank;
AiTank.FOCUS_RADIUS = 600 ** 2;