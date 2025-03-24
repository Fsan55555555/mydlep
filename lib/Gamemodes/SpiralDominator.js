"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Manager_1 = __importDefault(require("../Entity/Shape/Manager"));
const Arena_1 = __importDefault(require("../Native/Arena"));
const MazeWall_1 = __importDefault(require("../Entity/Misc/MazeWall2"));
const AIPlayer_1 = require("../Entity/Misc/AIPlayer");
const Dominator2_1 = require("../Entity/Misc/Dominator2");
const TeamBase_1 = require("../Entity/Misc/TeamBase");
const TeamEntity_1 = require("../Entity/Misc/TeamEntity");
const Entity_1 = require("../Native/Entity");

const CELL_SIZE = 280;
const GRID_SIZE = 25;
const ARENA_SIZE = CELL_SIZE * GRID_SIZE;
const SEED_AMOUNT = Math.floor(Math.random() * 30) + 30;
const TURN_CHANCE = 0.15;
const BRANCH_CHANCE = 0.1;
const TERMINATION_CHANCE = 0.15;

class MMazeShapeManager extends Manager_1.default {
    get wantedShapes() {
        let i = 0;
        for (const client of this.game.clients) {
            if (client.camera) i += 0;
        }
        return Math.floor(i * 12.5);
    }
}
exports.MMazeShapeManager = MMazeShapeManager;

class MMazeArena extends Arena_1.default {
    constructor(a, game) {
        super(a, game);
        this.aiPlayers = [];
        this.teams = [
            new TeamEntity_1.TeamEntity(this.game, 3), // チーム0
            new TeamEntity_1.TeamEntity(this.game, 4)  // チーム1
        ];
        this.dominator = null; // 単一のドミネーターを管理
        this.SEEDS = [];
        this.WALLS = [];
        this.MAZE = new Uint8Array(GRID_SIZE * GRID_SIZE);
        this.updateBounds(ARENA_SIZE, ARENA_SIZE);
        this.allowBoss = false;
        this._buildMaze();
        this.shapes = new MMazeShapeManager(this);
        this.startX = 3000; // 迷路の入り口（端）
        this.startY = -3000;

        // ドミネーターを1つだけ配置（初期チーム: チーム0）
        const domBaseSize = 1000;
        const domBase = new TeamBase_1.default(this.game, this.teams[0], 0, 0, domBaseSize, domBaseSize, false);
        this.dominator = new Dominator2_1.default(this, domBase);
        this.dominator.relationsData.values.team = this.teams[0]; // 初期チームをチーム0に設定
        this.dominator.styleData.values.color = this.teams[0].teamData.values.teamColor;
        this.dominator.nameData.name = "Dominator";

        this.gameWon = false;
    }

    spawnPlayer(tank, client) {
        // ランダムにチームを選択
        const teamIndex = Math.floor(Math.random() * 2);
        const team = this.teams[teamIndex];
        tank.relationsData.values.team = team;
        tank.styleData.values.color = team.teamData.values.teamColor;

        // チームに応じたスポーン位置を設定
        if (teamIndex === 0) {
            // チーム0はドミネーターの位置（迷路の中心）にスポーン
            tank.positionData.values.x = 0;
            tank.positionData.values.y = 0;
        } else {
            // チーム1は迷路の入り口（端）にスポーン
            tank.positionData.values.x = this.startX;
            tank.positionData.values.y = this.startY;
        }
    }

    tick(tick) {
        super.tick(tick);
        if (!this.gameWon && this.dominator.relationsData.values.team === this.teams[1]) {
            const message = `${this.teams[1].teamName} HAS WON THE GAME!`;
            this.game.broadcast()
                .u8(3)
                .stringNT(message)
                .u32(0x0000FF)
                .float(Infinity)
                .stringNT("")
                .send();
            this.gameWon = true; // 勝利フラグを立てる
            setTimeout(() => {
                this.close(); // 5秒後に1度だけ閉じる
            }, 5000);
        }
    }

    _buildWallFromGridCoord(gridX, gridY, gridW, gridH) {
        const scaledW = gridW * CELL_SIZE;
        const scaledH = gridH * CELL_SIZE;
        const scaledX = gridX * CELL_SIZE - ARENA_SIZE / 2 + (scaledW / 2);
        const scaledY = gridY * CELL_SIZE - ARENA_SIZE / 2 + (scaledH / 2);
        new MazeWall_1.default(this.game, scaledX, scaledY, scaledH, scaledW);
    }

    _get(x, y) {
        return this.MAZE[y * GRID_SIZE + x];
    }

    _set(x, y, value) {
        return this.MAZE[y * GRID_SIZE + x] = value;
    }

    _mapValues() {
        const values = Array(this.MAZE.length);
        for (let i = 0; i < this.MAZE.length; ++i) {
            values[i] = [i % GRID_SIZE, Math.floor(i / GRID_SIZE), this.MAZE[i]];
        }
        return values;
    }

    _buildMaze() {
        // すべてのセルを壁（1）で初期化
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            this.MAZE[i] = 1;
        }

        // 中心の座標
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);

        // 螺旋状に通路を掘る
        let x = centerX;
        let y = centerY;
        let direction = 0; // 0: 右, 1: 下, 2: 左, 3: 上
        let steps = 1; // 各方向に進むステップ数
        let stepCount = 0; // 現在の方向でのステップ数
        let layer = 0; // 現在の層

        while (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            this._set(x, y, 0);
            if (direction === 0) {
                x++;
            } else if (direction === 1) {
                y++;
            } else if (direction === 2) {
                x--;
            } else if (direction === 3) {
                y--;
            }
            stepCount++;
            if (stepCount === steps) {
                direction = (direction + 1) % 4;
                stepCount = 0;
                if (direction % 2 === 0) {
                    layer++;
                    steps = layer * 2;
                }
            }
        }

        // 開始地点を端に設定
        this._set(0, 0, 0);

        // 壁のチャンクを生成
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (this._get(x, y) === 1) {
                    let chunk = { x, y, width: 0, height: 1 };
                    while (x + chunk.width < GRID_SIZE && this._get(x + chunk.width, y) === 1) {
                        this._set(x + chunk.width, y, 2);
                        chunk.width++;
                    }
                    outer: while (true) {
                        for (let i = 0; i < chunk.width; i++) {
                            if (y + chunk.height >= GRID_SIZE || this._get(x + i, y + chunk.height) !== 1) {
                                break outer;
                            }
                        }
                        for (let i = 0; i < chunk.width; i++) {
                            this._set(x + i, y + chunk.height, 2);
                        }
                        chunk.height++;
                    }
                    this.WALLS.push(chunk);
                }
            }
        }

        // 壁オブジェクトの生成
        for (let { x, y, width, height } of this.WALLS) {
            this._buildWallFromGridCoord(x, y, width, height);
        }
    }
}
exports.default = MMazeArena;