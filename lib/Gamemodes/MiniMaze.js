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
const GRID_SIZE = 18;
const ARENA_SIZE = CELL_SIZE * GRID_SIZE;
const SEED_AMOUNT = Math.floor(Math.random() * 30) + 30;
const TURN_CHANCE = 0.15;
const BRANCH_CHANCE = 0.1;
const TERMINATION_CHANCE = 0.15;

class MMazeShapeManager extends Manager_1.default {
    get wantedShapes() {
        let i = 1;
        for (const client of this.game.clients) {
            if (client.camera)
                i += 1;
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

        // 5体のAIプレイヤーをランダムに配置
        for (let i = 0; i < 5; i++) {
            const aiPlayer = new AIPlayer_1.default(this.game);
            const x = (Math.random() - 0.5) * ARENA_SIZE;
            const y = (Math.random() - 0.5) * ARENA_SIZE;
            aiPlayer.positionData.values.x = x;
            aiPlayer.positionData.values.y = y;
            this.aiPlayers.push(aiPlayer);
        }
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
        const missing = 5 - aliveCount;
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
        // シード配置
        for (let i = 0; i < 10000; i++) {
            if (this.SEEDS.length >= SEED_AMOUNT)
                break;
            let seed = {
                x: Math.floor((Math.random() * GRID_SIZE) - 1),
                y: Math.floor((Math.random() * GRID_SIZE) - 1),
            };
            if (this.SEEDS.some(a => (Math.abs(seed.x - a.x) <= 3 && Math.abs(seed.y - a.y) <= 3)))
                continue;
            if (seed.x <= 0 || seed.y <= 0 || seed.x >= GRID_SIZE - 1 || seed.y >= GRID_SIZE - 1)
                continue;
            this.SEEDS.push(seed);
            this._set(seed.x, seed.y, 1);
        }
        const direction = [
            [-1, 0], [1, 0],
            [0, -1], [0, 1],
        ];
        // シードから迷路の経路を生成
        for (let seed of this.SEEDS) {
            let dir = direction[Math.floor(Math.random() * 4)];
            let termination = 1;
            while (termination >= TERMINATION_CHANCE) {
                termination = Math.random();
                let [x, y] = dir;
                seed.x += x;
                seed.y += y;
                if (seed.x <= 0 || seed.y <= 0 || seed.x >= GRID_SIZE - 1 || seed.y >= GRID_SIZE - 1)
                    break;
                this._set(seed.x, seed.y, 1);
                if (Math.random() <= BRANCH_CHANCE) {
                    if (this.SEEDS.length > 75)
                        continue;
                    let [xx, yy] = direction.filter(a => a.every((b, c) => b !== dir[c]))[Math.floor(Math.random() * 2)];
                    let newSeed = {
                        x: seed.x + xx,
                        y: seed.y + yy,
                    };
                    this.SEEDS.push(newSeed);
                    this._set(seed.x, seed.y, 1);
                }
                else if (Math.random() <= TURN_CHANCE) {
                    dir = direction.filter(a => a.every((b, c) => b !== dir[c]))[Math.floor(Math.random() * 2)];
                }
            }
        }
        // 追加シード配置
        for (let i = 0; i < 10; i++) {
            let seed = {
                x: Math.floor((Math.random() * GRID_SIZE) - 1),
                y: Math.floor((Math.random() * GRID_SIZE) - 1),
            };
            if (this._mapValues().some(([x, y, r]) => r === 1 && (Math.abs(seed.x - x) <= 3 && Math.abs(seed.y - y) <= 3)))
                continue;
            if (seed.x <= 0 || seed.y <= 0 || seed.x >= GRID_SIZE - 1 || seed.y >= GRID_SIZE - 1)
                continue;
            this._set(seed.x, seed.y, 1);
        }
        // 経路探索でエリアを区分
        let queue = [[0, 0]];
        this._set(0, 0, 2);
        let checkedIndices = new Set([0]);
        for (let i = 0; i < 3000 && queue.length > 0; i++) {
            let next = queue.shift();
            if (next == null)
                break;
            let [x, y] = next;
            for (let [nx, ny] of [
                [x - 1, y],
                [x + 1, y],
                [x, y - 1],
                [x, y + 1],
            ]) {
                if (this._get(nx, ny) !== 0)
                    continue;
                let i = ny * GRID_SIZE + nx;
                if (checkedIndices.has(i))
                    continue;
                checkedIndices.add(i);
                queue.push([nx, ny]);
                this._set(nx, ny, 2);
            }
        }
        // 迷路の壁チャンク生成
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (this._get(x, y) === 2)
                    continue;
                let chunk = { x, y, width: 0, height: 1 };
                while (this._get(x + chunk.width, y) !== 2) {
                    this._set(x + chunk.width, y, 2);
                    chunk.width++;
                }
                outer: while (true) {
                    for (let i = 0; i < chunk.width; i++) {
                        if (this._get(x + i, y + chunk.height) === 2)
                            break outer;
                    }
                    for (let i = 0; i < chunk.width; i++) {
                        this._set(x + i, y + chunk.height, 2);
                    }
                    chunk.height++;
                }
                this.WALLS.push(chunk);
            }
        }
        // 壁オブジェクトの生成
        for (let { x, y, width, height } of this.WALLS) {
            this._buildWallFromGridCoord(x, y, width, height);
        }
        // ※ここでは補充処理を削除（tickメソッドで処理するため）
    }
}
exports.default = MMazeArena;