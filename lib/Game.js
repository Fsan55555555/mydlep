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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config = __importStar(require("./config"));
const util = __importStar(require("./util"));
const Writer_1 = __importDefault(require("./Coder/Writer"));
const Manager_1 = __importDefault(require("./Native/Manager"));
const FFA_1 = __importDefault(require("./Gamemodes/FFA"));
const Team2_1 = __importDefault(require("./Gamemodes/Team2"));
const Sandbox_1 = __importDefault(require("./Gamemodes/Sandbox"));
const Team4_1 = __importDefault(require("./Gamemodes/Team4"));
const Domination_1 = __importDefault(require("./Gamemodes/Domination"));
const Mothership_1 = __importDefault(require("./Gamemodes/Mothership"));
const Testing_1 = __importDefault(require("./Gamemodes/Misc/Testing"));
const Spikebox_1 = __importDefault(require("./Gamemodes/Misc/Spikebox"));
const DomTest_1 = __importDefault(require("./Gamemodes/Misc/DomTest"));
const Jungle_1 = __importDefault(require("./Gamemodes/Misc/Jungle"));
const FactoryTest_1 = __importDefault(require("./Gamemodes/Misc/FactoryTest"));
const Ball_1 = __importDefault(require("./Gamemodes/Misc/Ball"));
const Maze_1 = __importDefault(require("./Gamemodes/Maze"));
const MiniMaze_1 = __importDefault(require("./Gamemodes/MiniMaze"));
const Spiralmaze_1 = __importDefault(require("./Gamemodes/Spiralmaze"));
const SpiralDom_1 = __importDefault(require("./Gamemodes/SpiralDominator"));
class WSSWriterStream extends Writer_1.default {
    constructor(game) {
        super();
        this.game = game;
    }
    send() {
        const bytes = this.write();
        for (let client of this.game.clients) {
            client.send(bytes);
        }
    }
}
const GamemodeToArenaClass = {
    "ffa": FFA_1.default,
    "teams": Team2_1.default,
    "4teams": Team4_1.default,
    "sandbox": Sandbox_1.default,
    "*": Sandbox_1.default,
    "dom": Domination_1.default,
    "survival": null,
    "tag": null,
    "mot": Mothership_1.default,
    "maze": Maze_1.default,
    "mmaze": MiniMaze_1.default,
    "spmaze": Spiralmaze_1.default,
    "spdom": SpiralDom_1.default,
    "testing": Testing_1.default,
    "spike": Spikebox_1.default,
    "domtest": DomTest_1.default,
    "jungle": Jungle_1.default,
    "factest": FactoryTest_1.default,
    "ball": Ball_1.default
};
class GameServer {
    constructor(gamemode, name) {
        this.running = true;
        this.playersOnMap = false;
        this.gamemode = gamemode;
        this.name = name;
        this.clients = new Set();
        const _add = this.clients.add;
        this.clients.add = (client) => {
            GameServer.globalPlayerCount += 1;
            this.broadcastPlayerCount();
            return _add.call(this.clients, client);
        };
        const _delete = this.clients.delete;
        this.clients.delete = (client) => {
            let success = _delete.call(this.clients, client);
            if (success) {
                GameServer.globalPlayerCount -= 1;
                this.broadcastPlayerCount();
            }
            return success;
        };
        const _clear = this.clients.clear;
        this.clients.clear = () => {
            GameServer.globalPlayerCount -= this.clients.size;
            this.broadcastPlayerCount();
            return _clear.call(this.clients);
        };
        this.entities = new Manager_1.default(this);
        this.tick = 0;
        this.arena = new (GamemodeToArenaClass[this.gamemode] || GamemodeToArenaClass["*"])(this);
        this._tickInterval = setInterval(() => {
            if (this.clients.size)
                this.tickLoop();
        }, config.mspt);
    }
    broadcast() {
        return new WSSWriterStream(this);
    }
    broadcastPlayerCount() {
        this.broadcast().vu(10).vu(GameServer.globalPlayerCount).send();
    }
    end() {
        util.saveToLog("Game Instance Ending", "Game running " + this.gamemode + " at `" + this.gamemode + "` is now closing.", 0xEE4132);
        util.log("Ending Game instance");
        clearInterval(this._tickInterval);
        for (const client of this.clients) {
            client.terminate();
        }
        this.tick = 0;
        this.clients.clear();
        this.entities.clear();
        this.running = false;
        this.onEnd();
    }
    onEnd() {
        util.log("Game instance is now over");
        this.start();
    }
    start() {
        if (this.running)
            return;
        util.log("New game instance booting up");
        this.clients.clear();
        this.entities = new Manager_1.default(this);
        this.tick = 0;
        this.arena = new (GamemodeToArenaClass[this.gamemode] || GamemodeToArenaClass["*"])(this);
        this._tickInterval = setInterval(() => {
            if (this.clients.size)
                this.tickLoop();
        }, config.mspt);
    }
    tickLoop() {
        this.tick += 1;
        this.entities.tick(this.tick);
        for (const client of this.clients)
            client.tick(this.tick);
    }
}
GameServer.globalPlayerCount = 0;
exports.default = GameServer;
