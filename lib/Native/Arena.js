"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Manager_1 = __importDefault(require("../Entity/Shape/Manager"));
const TankBody_1 = __importDefault(require("../Entity/Tank/TankBody"));
const SmasherCloser_1 = __importDefault(require("../Entity/Misc/SmasherCloser"));
const ArenaCloser_1 = __importDefault(require("../Entity/Misc/ArenaCloser"));
const NWArenaCloser_1 = __importDefault(require("../Entity/Misc/NewArenaCloser"));
const NowArenaCloser_1 = __importDefault(require("../Entity/Misc/NowArenaCloser"));
const Camera_1 = __importDefault(require("./Camera"));
const FieldGroups_1 = require("./FieldGroups");
const Entity_1 = require("./Entity");
const util_1 = require("../util");
const Guardian_1 = __importDefault(require("../Entity/Boss/Guardian"));
const Summoner_1 = __importDefault(require("../Entity/Boss/Summoner"));
const FallenOverlord_1 = __importDefault(require("../Entity/Boss/FallenOverlord"));
const FallenBooster_1 = __importDefault(require("../Entity/Boss/FallenBooster"));
const Defender_1 = __importDefault(require("../Entity/Boss/Defender"));
const config_1 = require("../config");
class ArenaEntity extends Entity_1.Entity {
    constructor(game) {
        super(game);
        this.arenaData = new FieldGroups_1.ArenaGroup(this);
        this.teamData = new FieldGroups_1.TeamGroup(this);
        this.state = 0;
        this.shapeScoreRewardMultiplier = 1;
        this.allowBoss = true;
        this.boss = null;
        this.leader = null;
        this.shapes = new Manager_1.default(this);
        this.ARENA_PADDING = 200;
        this.updateBounds(this.width = 22300, this.height = 22300);
        this.arenaData.values.topY = -this.height / 10;
        this.arenaData.values.bottomY = this.height / 10;
        this.arenaData.values.leftX = -this.width / 10;
        this.arenaData.values.rightX = this.width / 10;
        this.arenaData.values.flags = 10;
        this.teamData.values.teamColor = 12;
    }
    findSpawnLocation() {
        const pos = {
            x: ~~(Math.random() * this.width - this.width / 2),
            y: ~~(Math.random() * this.height - this.height / 2),
        };
        findSpawn: for (let i = 0; i < 20; ++i) {
            const entities = this.game.entities.collisionManager.retrieve(pos.x, pos.y, 1000, 1000);
            for (let len = entities.length; --len >= 0;) {
                if (entities[len] instanceof TankBody_1.default && (entities[len].positionData.values.x - pos.x) ** 2 + (entities[len].positionData.values.y - pos.y) ** 2 < 1000000) {
                    pos.x = ~~(Math.random() * this.width - this.width / 2);
                    pos.y = ~~(Math.random() * this.height - this.height / 2);
                    continue findSpawn;
                }
            }
            break;
        }
        return pos;
    }
updateScoreboard(scoreboardPlayers) {
    const scoreboardCount = this.arenaData.scoreboardAmount = (this.arenaData.values.flags & 4) ? 0 : Math.min(scoreboardPlayers.length, 10);
    if (scoreboardCount) {
        this.arenaData.flags |= 2;
        let i;
        for (i = 0; i < scoreboardCount; ++i) {
            const player = scoreboardPlayers[i];
            this.arenaData.values.scoreboardNames[i] = player.nameData.values.name;
            this.arenaData.values.scoreboardScores[i] = player.scoreData.values.score;
        }
        }
        else if (this.arenaData.values.flags & 2)
            this.arenaData.flags ^= 2;
    }
    updateBounds(arenaWidth, arenaHeight) {
        this.width = arenaWidth;
        this.height = arenaHeight;
        this.arenaData.topY = -arenaHeight / 2;
        this.arenaData.bottomY = arenaHeight / 2;
        this.arenaData.leftX = -arenaWidth / 2;
        this.arenaData.rightX = arenaWidth / 2;
    }
    spawnPlayer(tank, client) {
        const { x, y } = this.findSpawnLocation();
        tank.positionData.values.x = x;
        tank.positionData.values.y = y;
    };

close() {
    for (const client of this.game.clients) {
        client.notify(
            "Arena closed: No players can join",
            0xff0000,
            -1
        );
    }
    
    this.state = 2;
    this.arenaData.flags |= 1;

    setTimeout(() => {
        const corners = [
            { x: this.arenaData.values.leftX + 4000, y: this.arenaData.values.topY + 4000 },
            { x: this.arenaData.values.rightX - 4100, y: this.arenaData.values.topY + 4000 },
            { x: this.arenaData.values.leftX + 4000, y: this.arenaData.values.bottomY - 4100 },
            { x: this.arenaData.values.rightX - 4100, y: this.arenaData.values.bottomY - 4100 },
        ];

        const center = {
            x: 0, 
            y: 0  
        };

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 2; j++) {
                const ac = new ArenaCloser_1.default(this.game);
                ac.positionData.values.x = corners[i].x;
                ac.positionData.values.y = corners[i].y;
            }
        }
        const centerAc = new ArenaCloser_1.default(this.game);
        centerAc.positionData.values.x = center.x;
        centerAc.positionData.values.y = center.y;

        const spawnInterval = setInterval(() => {
            if (this.state !== 2) {
                clearInterval(spawnInterval);
                return;
            }
            
            const centerAc = new ArenaCloser_1.default(this.game);
            centerAc.positionData.values.x = center.x;
            centerAc.positionData.values.y = center.y;
        }, 30000);

        (0, util_1.saveToLog)(
            "Arena Closing",
            "Arena running at `" +
                this.game.gamemode +
                "` is now closing.",
            0xffe869
        );
    }, );
}
newclose() {
    for (const client of this.game.clients) {
        client.notify(
            "Arena closed: No players can join",
            0xff0000,
            -1
        );
    }
    
    this.state = 2;
    this.arenaData.flags |= 1;

    setTimeout(() => {
        // アリーナの中心座標を計算
        const center = {
            x: (this.arenaData.values.leftX + this.arenaData.values.rightX) / 2,
            y: (this.arenaData.values.topY + this.arenaData.values.bottomY) / 2
        };

        // 配置する範囲の幅と高さ
        const W = 5000; // 幅（例: 10000）
        const H = 5000; // 高さ（例: 10000）

        // 配置範囲の境界を計算（アリーナの境界を超えないように調整）
        const minX = Math.max(this.arenaData.values.leftX, center.x - W / 2);
        const maxX = Math.min(this.arenaData.values.rightX, center.x + W / 2);
        const minY = Math.max(this.arenaData.values.topY, center.y - H / 2);
        const maxY = Math.min(this.arenaData.values.bottomY, center.y + H / 2);

        // 9体のArena Closerをランダムに配置
        for (let i = 0; i < 9; i++) {
            const ac = new NWArenaCloser_1.default(this.game);
            ac.positionData.values.x = minX + Math.random() * (maxX - minX);
            ac.positionData.values.y = minY + Math.random() * (maxY - minY);
        }

        // 状態監視用のインターバル（元のコードを維持）
        const spawnInterval = setInterval(() => {
            if (this.state !== 2) {
                clearInterval(spawnInterval);
                return;
            }
        }, );

        // ログ保存（元のコードを維持）
        (0, util_1.saveToLog)(
            "Arena Closing",
            "Arena running at `" +
                this.game.gamemode +
                "` is now closing.",
            0xffe869
        );
    }, );
}
    nowclose() {
        for (const client of this.game.clients) {
            client.notify("Arena closed: No players can join", 0xFF0000, -1);
        }
        this.state = 2;
        this.arenaData.flags |= 1;
        setTimeout(() => {
            const acCount = Math.floor(Math.sqrt(this.width) / 10);
            const radius = this.width * Math.SQRT1_2 + 500;
            for (let i = 0; i < acCount; ++i) {
                const ac = new NowArenaCloser_1.default(this.game);
                const angle = (i / acCount) * util_1.PI2;
                ac.positionData.values.x = Math.cos(angle) * radius;
                ac.positionData.values.y = Math.sin(angle) * radius;
                ac.positionData.values.angle = angle + Math.PI;
            }
            (0, util_1.saveToLog)("Arena Closing", "Arena running at `" + this.game.gamemode + "` is now closing.", 0xFFE869);
        }, 5000);
    }
bah() {
    for (const client of this.game.clients) {
        client.notify("!Baaah!", 0xff0000, -1);
    }
    
    this.state = 2;
    this.arenaData.flags |= 1;

    setTimeout(() => {
        // アリーナの中心座標を計算
        const center = {
            x: (this.arenaData.values.leftX + this.arenaData.values.rightX) / 2,
            y: (this.arenaData.values.topY + this.arenaData.values.bottomY) / 2
        };

        // 配置する範囲の幅と高さ
        const W = 5000;
        const H = 5000;

        // 配置範囲の境界を計算（アリーナの境界を超えないように調整）
        const minX = Math.max(this.arenaData.values.leftX, center.x - W / 2);
        const maxX = Math.min(this.arenaData.values.rightX, center.x + W / 2);
        const minY = Math.max(this.arenaData.values.topY, center.y - H / 2);
        const maxY = Math.min(this.arenaData.values.bottomY, center.y + H / 2);

        // 初回スポーン
        const ac = new SmasherCloser_1.default(this.game);
        ac.positionData.values.x = minX + Math.random() * (maxX - minX);
        ac.positionData.values.y = minY + Math.random() * (maxY - minY);

        // 30秒ごとに SmasherCloser をスポーン
        const spawnInterval = setInterval(() => {
            if (this.state !== 2) {
                clearInterval(spawnInterval);
                return;
            }
            const ac = new SmasherCloser_1.default(this.game);
            ac.positionData.values.x = minX + Math.random() * (maxX - minX);
            ac.positionData.values.y = minY + Math.random() * (maxY - minY);
        }, 30000);

        (0, util_1.saveToLog)(
            "Arena Closing",
            "Arena running at `" + this.game.gamemode + "` is now closing.",
            0xffe869
        );
    }, 0);
}
acchase() {
    for (const client of this.game.clients) {
        client.notify(
            "ArenaCloser is Coming!",
            0xff0000,
            -1
        );
    }
    
    this.state = 2;
    this.arenaData.flags |= 1;

        const abc = {
            x: 10, 
            y: 10  
        };
        const centerAc = new ArenaCloser_1.default(this.game);
        centerAc.positionData.values.x = abc.x;
        centerAc.positionData.values.y = abc.y;

        const spawnInterval = setInterval(() => {
            if (this.state !== 2) {
                clearInterval(spawnInterval);
                return;
            }
            
            const centerAc = new ArenaCloser_1.default(this.game);
            centerAc.positionData.values.x = abc.x;
            centerAc.positionData.values.y = abc.y;
        }, 30000);
    }
    spawnBoss() {
        const TBoss = [Guardian_1.default, Summoner_1.default, FallenOverlord_1.default, FallenBooster_1.default, Defender_1.default][~~(Math.random() * 5)];
        this.boss = new TBoss(this.game);
    }
tick(tick) {
    this.shapes.tick();
    if (this.allowBoss && this.game.tick >= 1 && (this.game.tick % config_1.bossSpawningInterval) === 0 && !this.boss) {
        this.spawnBoss();
    }
    if (this.state === 3)
        return;
        const players = [];
        for (let id = 0; id <= this.game.entities.lastId; ++id) {
            const entity = this.game.entities.inner[id];
            if (Entity_1.Entity.exists(entity) && entity instanceof TankBody_1.default && entity.cameraEntity instanceof Camera_1.default && entity.cameraEntity.cameraData.values.player === entity)
                players.push(entity);
            players.sort((p1, p2) => p2.scoreData.values.score - p1.scoreData.values.score);
            this.leader = players[0];
            if (this.leader && this.arenaData.values.flags & 2) {
                this.arenaData.leaderX = this.leader.positionData.values.x;
                this.arenaData.leaderY = this.leader.positionData.values.y;
            }
        }
        if ((this.game.tick % config_1.scoreboardUpdateInterval) === 0)
            this.updateScoreboard(players);
        if (players.length === 0 && this.state === 2) {
            this.state = 3;
            setTimeout(() => {
                this.game.end();
            }, 10000);
            return;
        }
    }
}
exports.default = ArenaEntity;