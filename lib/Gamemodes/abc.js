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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxShapeManager = void 0;

const Arena_1 = __importDefault(require("../Native/Arena"));
const Manager_1 = __importDefault(require("../Entity/Shape/Manager"));
const TeamEntity_1 = require("../Entity/Misc/TeamEntity");
const Cantwalk_1 = __importDefault(require("../Entity/Misc/Cantwalk"));
const Entity_1 = require("../Native/Entity");

const ARENA_SIZE = 2000;
const TEAM_COLOR = 3;

class SandboxShapeManager extends Manager_1.default {
    get wantedShapes() {
        let i = 0;
        for (const client of this.game.clients) {
            if (client.camera) i += 0; // クライアントごとにカウント
        }
        return Math.floor(i * 0);
    }
}
exports.SandboxShapeManager = SandboxShapeManager;

class SandboxArena extends Arena_1.default {
    constructor(game) {
        super(game);

        // 形状マネージャーの初期化
        this.shapes = new SandboxShapeManager(this);

        // 単一チームの生成とエラーチェック
        try {
            this.team = new TeamEntity_1.TeamEntity(this.game, TEAM_COLOR);
            if (!this.team.teamData || typeof this.team.teamData.values.teamColor === "undefined") {
                console.error("TeamEntity initialization failed: teamData or teamColor is missing.");
                this.team.teamData = { values: { teamColor: TEAM_COLOR } }; // フォールバック
            }
        } catch (e) {
            console.error("Failed to create TeamEntity:", e);
            this.team = { teamData: { values: { teamColor: TEAM_COLOR } } }; // フォールバック
        }

        this.aiPlayers = [];
        for (let i = 0; i < 23; i++) {
            const aiPlayer = new Cantwalk_1.default(this.game);
            aiPlayer.relationsData.values.team = this.team;
            aiPlayer.styleData.values.color = this.team.teamData.values.teamColor || TEAM_COLOR; // フォールバック
            aiPlayer.positionData.values.x = 10000;
            aiPlayer.positionData.values.y = 10000;
            this.aiPlayers.push(aiPlayer);
        }

        this.updateBounds(ARENA_SIZE, ARENA_SIZE);
        this.arenaData.values.flags |= 16; // SandboxArenaのフラグを継承
    }

    // プレイヤーのスポーン処理
    spawnPlayer(tank, client) {
        tank.relationsData.values.team = this.team;
        tank.styleData.values.color = this.team.teamData.values.teamColor || TEAM_COLOR; // フォールバック

        // ランダムなスポーン位置を使用
        const { x, y } = this.findSpawnLocation();
        tank.positionData.values.x = x;
        tank.positionData.values.y = y;

        if (client.camera) {
            client.camera.relationsData.team = this.team;
        }
    }

    // スコアボードの更新（必要に応じてカスタマイズ可能）
    updateScoreboard(scoreboardPlayers) {
        this.arenaData.scoreboardAmount = 0; // スコアボードは空
    }

    // ゲームの更新
    tick(tick) {
        // アリーナサイズの動的調整
        const arenaSize = Math.floor(25 * Math.sqrt(Math.max(this.game.clients.size, 1))) * 100;
        if (this.width !== arenaSize || this.height !== arenaSize) {
            this.updateBounds(arenaSize, arenaSize);
        }

        // AIプレイヤーのフィルタリングと補充
        this.aiPlayers = this.aiPlayers.filter(ai => Entity_1.Entity.exists(ai));
        const aliveCount = this.aiPlayers.filter(ai => ai.relationsData.values.team === this.team).length;
        const missing = 23 - aliveCount;
        if (this.state === 0) {
        for (let i = 0; i < missing; i++) {
            const aiPlayer = new Cantwalk_1.default(this.game);
            aiPlayer.relationsData.values.team = this.team;
            aiPlayer.styleData.values.color = this.team.teamData.values.teamColor || TEAM_COLOR; // フォールバック
            aiPlayer.positionData.values.x = 10000; // 中央にスポーン
            aiPlayer.positionData.values.y = 10000;
            this.aiPlayers.push(aiPlayer);
        }
    }
        super.tick(tick);
    }
}

exports.default = SandboxArena;