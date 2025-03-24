"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Manager_1 = __importDefault(require("../Entity/Shape/Manager"));
const Arena_1 = __importDefault(require("../Native/Arena"));
const MazeWall_1 = __importDefault(require("../Entity/Misc/MazeWall"));
const AIPlayer_1 = require("../Entity/Misc/AIPlayer");
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
        let i = 2;
        for (const client of this.game.clients) {
            if (client.camera)
                i += 2;
        }
        return Math.floor(i * 12.5);
    }
}
exports.MMazeShapeManager = MMazeShapeManager;
class MMazeArena extends Arena_1.default {
    constructor(a, game) {
        super(a, game);
        this.aiPlayers = [];
        this.SEEDS = [];
        this.WALLS = [];
        this.MAZE = new Uint8Array(GRID_SIZE * GRID_SIZE);
        this.updateBounds(ARENA_SIZE, ARENA_SIZE);
        this.allowBoss = false;
        this._buildMaze();
        this.shapes = new MMazeShapeManager(this);
        this.startX = 3000;
        this.startY = -3000;

        // 5体のAIプレイヤーをランダムに配置
        for (let i = 0; i < 0; i++) {
            const aiPlayer = new AIPlayer_1.default(this.game);
            const x = (Math.random() - 0.5) * ARENA_SIZE;
            const y = (Math.random() - 0.5) * ARENA_SIZE;
            aiPlayer.positionData.values.x = x;
            aiPlayer.positionData.values.y = y;
            this.aiPlayers.push(aiPlayer);
        }
    }
    spawnPlayer(tank, client) {
        tank.positionData.values.x = this.startX;
        tank.positionData.values.y = this.startY;
    }
    pushAIPlayer(aiPlayer) {
        this.aiPlayers.push(aiPlayer);
    }

    // 毎フレーム呼ばれるtickメソッドを追加
    tick(tick) {
        super.tick(tick);

        // AIPlayerの補充処理
        this.aiPlayers = this.aiPlayers.filter(ai => Entity_1.Entity.exists(ai));
        const aliveCount = this.aiPlayers.length; // チーム条件を省略（常にチームなしと仮定）
        const missing = 0 - aliveCount;
        if (this.state === 0) {
        for (let i = 0; i < missing; i++) {
            const aiPlayer = new AIPlayer_1.default(this.game);
            const x = (Math.random() - 0.5) * ARENA_SIZE;
            const y = (Math.random() - 0.5) * ARENA_SIZE;
            aiPlayer.positionData.values.x = x;
            aiPlayer.positionData.values.y = y;
            this.aiPlayers.push(aiPlayer);
        }
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
        for (let i = 0; i < this.MAZE.length; ++i)
            values[i] = [i % GRID_SIZE, Math.floor(i / GRID_SIZE), this.MAZE[i]];
        return values;
    }

_buildMaze() {
    // すべてのセルを壁（1）で初期化
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        this.MAZE[i] = 1;
    }

    // 中心の座標
    const centerX = Math.floor(GRID_SIZE / 2); // 9
    const centerY = Math.floor(GRID_SIZE / 2); // 9

    // 螺旋状に通路を掘る
    let x = centerX;
    let y = centerY;
    let direction = 0; // 0: 右, 1: 下, 2: 左, 3: 上
    let steps = 1; // 各方向に進むステップ数
    let stepCount = 0; // 現在の方向でのステップ数
    let layer = 0; // 現在の層

    while (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        // 現在のセルを通路（0）にする
        this._set(x, y, 0);

        // 次のセルを決定
        if (direction === 0) { // 右
            x++;
        } else if (direction === 1) { // 下
            y++;
        } else if (direction === 2) { // 左
            x--;
        } else if (direction === 3) { // 上
            y--;
        }

        stepCount++;
        if (stepCount === steps) {
            direction = (direction + 1) % 4; // 方向を90度回転
            stepCount = 0;
            if (direction % 2 === 0) { // 右または左に進むとき
                layer++; // 層を増やす
                steps = layer * 2; // 各層でステップ数を増加
            }
        }
    }

    // 開始地点を端っこに設定（例: (0, 0)）
    this._set(0, 0, 0);

    // 壁のチャンクを生成
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (this._get(x, y) === 1) { // 壁の場合
                let chunk = { x, y, width: 0, height: 1 };
                // 横に連続する壁をチャンク化
                while (x + chunk.width < GRID_SIZE && this._get(x + chunk.width, y) === 1) {
                    this._set(x + chunk.width, y, 2); // 処理済みマーク
                    chunk.width++;
                }
                // 縦に連続する壁をチャンク化
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