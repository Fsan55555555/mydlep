"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const TankBody = __importDefault(require("../Tank/TankBody"));
const { CameraEntity } = require("../../Native/Camera");
const { Inputs, AI } = require("../AI");
const Barrel = __importDefault(require("../Tank/Barrel"));
const TankDefinitions = __importDefault(require("../../Const/TankDefinitions"));

class ArenaCloser extends TankBody.default {
  constructor(arena, base, pTankId = null) {
    let tankId;
    if (pTankId === null) {
      const r = Math.random();
      if (r < 0.33) {
        tankId = 16;
      } else if (r < 0.66) {
        tankId = 16;
      } else {
        tankId = 16;
      }
    } else {
      tankId = pTankId;
    }

    const inputs = new Inputs();
    const camera = new CameraEntity(arena);

    camera.setLevel = (level) => {};

    camera.cameraData.values.score = 0;
    camera.cameraData.values.level = 0;
    Object.defineProperty(camera.cameraData, "score", {
      get: () => 0,
      set: () => {},
      configurable: true,
    });
    Object.defineProperty(camera.cameraData.values, "score", {
      get: () => 0,
      set: () => {},
      configurable: true,
    });

    camera.sizeFactor = ArenaCloser.BASE_SIZE / 50;

    super(arena, camera, inputs);

    this.ai = new AI(this);
    this.ai.inputs = inputs;
    this.ai.viewRange = Infinity;
    this.setTank(tankId);

    this.definition = {
      ...this.definition,
      maxHealth: 3,
      speed: 0.76,
    };
    this.doAimPrediction = true;
    this.relationsData.values.team = this.game.arena;
    this.damagePerTick = 20;
    this.nameData.values.name = "Arena Closer";
    this.styleData.values.color = 12;
    this.positionData.values.flags |= 0;
    this.physicsData.values.flags |= 0;

    camera.cameraData.values.player = this;

    for (let i = 0; i < 5; i++) {
      camera.cameraData.values.statLevels.values[i] = 7;
    }

    this.physicsData.values.absorbtionFactor = 1;
    this.setInvulnerability(false);
    this.ai.aimSpeed = 1.4;
    }
  tick(tick) {
    this.ai.movementSpeed = this.cameraEntity.cameraData.values.movementSpeed * 10;
    this.inputs = this.ai.inputs;

    if (this.ai.state === 0) {
      const angle = this.positionData.values.angle + this.ai.passiveRotation;
      const dx = this.inputs.mouse.x - this.positionData.values.x;
      const dy = this.inputs.mouse.y - this.positionData.values.y;
      const mag = Math.sqrt(dx * dx + dy * dy);
      this.inputs.mouse.set({
        x: this.positionData.values.x + Math.cos(angle) * mag,
        y: this.positionData.values.y + Math.sin(angle) * mag,
      });
    }

    super.tick(tick);

    const player = this.cameraEntity.cameraData.values.player;
    if (player && player.scoreData && player instanceof TankBody.default) {
      player.scoreData.score = 0;
      player.scoreReward = 0;
    }
  }
}

ArenaCloser.BASE_SIZE = 85;

exports.default = ArenaCloser;