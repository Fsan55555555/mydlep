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
exports.ClientInputs = void 0;
const config = __importStar(require("./config"));
const util = __importStar(require("./util"));
const crypto_1 = require("crypto");
const Reader_1 = __importDefault(require("./Coder/Reader"));
const Writer_1 = __importDefault(require("./Coder/Writer"));
const Game_1 = __importDefault(require("./Game"));
const Camera_1 = __importDefault(require("./Native/Camera"));
const Object_1 = __importDefault(require("./Entity/Object"));
const TankDefinitions_1 = __importStar(require("./Const/TankDefinitions"));
const DevTankDefinitions_1 = __importDefault(require("./Const/DevTankDefinitions"));
const TankBody_1 = __importDefault(require("./Entity/Tank/TankBody"));
const Vector_1 = __importDefault(require("./Physics/Vector"));
const Entity_1 = require("./Native/Entity");
const Enums_1 = require("./Const/Enums");
const AI_1 = require("./Entity/AI");
const AbstractBoss_1 = __importDefault(require("./Entity/Boss/AbstractBoss"));
const Commands_1 = require("./Const/Commands");
const _1 = require(".");
const TANK_XOR = config.magicNum % TankDefinitions_1.TankCount;
const STAT_XOR = config.magicNum % Enums_1.StatCount;
const PING_PACKET = new Uint8Array([5]);
class WSWriterStream extends Writer_1.default {
    constructor(client) {
        super();
        this.client = client;
    }
    send() {
        this.client.send(this.write());
    }
}
class ClientInputs extends AI_1.Inputs {
    constructor(client) {
        super();
        this.cachedFlags = 0;
        this.isPossessing = false;
        this.client = client;
    }
}
exports.ClientInputs = ClientInputs;
class Client {
    write() {
        return new WSWriterStream(this);
    }
    constructor(ws, game) {
        this.terminated = false;
        this.accessLevel = -1;
        this.incomingCache = [];
        this.inputs = new ClientInputs(this);
        this.camera = null;
        this.devCheatsUsed = false;
        this.isInvulnerable = false;
        this.game = game;
        this.game.clients.add(this);
        this.ws = ws;
        this.lastPingTick = this.connectTick = game.tick;
    }
    acceptClient() {
        this.write().u8(4).stringNT(this.game.gamemode).stringNT(config.host).send();
        this.write().u8(10).vu(Game_1.default.globalPlayerCount).send();
        this.write().u8(7).vi(this.accessLevel).send();
        this.camera = new Camera_1.default(this.game, this);
    }
    send(data) {
        const ws = this.ws;
        if (!ws)
            throw new Error("Can't write to a closed websocket - shouldn't be referencing a closed client");
        ws.send(data, true, true);
    }
    onClose(code, message) {
        this.ws = null;
        this.terminate();
    }
    terminate() {
        if (this.terminated)
            return;
        if (this.ws)
            return this.ws.close();
        this.terminated = true;
        this.game.clients.delete(this);
        this.inputs.deleted = true;
        this.inputs.movement.magnitude = 0;
        if (Entity_1.Entity.exists(this.camera))
            this.camera.delete();
    }
    onMessage(buffer, isBinary) {
        if (!isBinary)
            return this.terminate();
        const data = new Uint8Array(buffer).slice();
        if (data[0] === 0x00 && data.byteLength === 1)
            return this.terminate();
        const header = data[0];
        if (header === 5) {
            this.lastPingTick = this.game.tick;
            this.send(PING_PACKET);
        }
        else {
            if (!this.incomingCache[header])
                this.incomingCache[header] = [];
            if (this.incomingCache[header].length) {
                if (header === 1) {
                    const r = new Reader_1.default(data);
                    r.at = 1;
                    const flags = r.vu();
                    this.inputs.cachedFlags |= flags & 0b110111100001;
                }
                else if (header === 3) {
                    this.incomingCache[header].push(data);
                }
                return;
            }
            this.incomingCache[header][0] = data;
        }
    }
    handleIncoming(header, data) {
        if (this.terminated)
            return;
        const r = new Reader_1.default(data);
        r.at = 1;
        const camera = this.camera;
        if (header === 0) {
            if (camera)
                return this.terminate();
            const buildHash = r.stringNT();
            const pw = r.stringNT();
            if (buildHash !== config.buildHash) {
                util.log("Kicking client. Invalid build hash " + JSON.stringify(buildHash));
                util.saveToVLog(this.toString() + " being kicked, wrong version hash " + JSON.stringify(buildHash));
                this.write().u8(1).stringNT(config.buildHash).send();
                setTimeout(() => this.terminate(), 100);
                return;
            }
            if (config.devPasswordHash && (0, crypto_1.createHash)("sha256").update(pw).digest("hex") === config.devPasswordHash) {
                this.accessLevel = 3;
                util.saveToLog("Developer Connected", "A client connected to the server (`" + this.game.gamemode + "`) with `full` access.", 0x5A65EA);
            }
            else {
                this.accessLevel = config.defaultAccessLevel;
            }
            if (this.accessLevel === -1) {
                util.saveToVLog("Possibly unknown, client terminated due to lack of authentication:: " + this.toString());
                return this.terminate();
            }
            this.acceptClient();
            return;
        }
        if (!Entity_1.Entity.exists(camera))
            return;
        switch (header) {
            case 1: {
                const previousFlags = this.inputs.flags;
                const flags = this.inputs.flags = r.vu() | this.inputs.cachedFlags;
                this.inputs.cachedFlags = 0;
                this.inputs.mouse.x = r.vf();
                this.inputs.mouse.y = r.vf();
                if (!Vector_1.default.isFinite(this.inputs.mouse))
                    break;
                const movement = {
                    x: 0,
                    y: 0
                };
                if (flags & 2)
                    movement.y -= 1;
                if (flags & 8)
                    movement.y += 1;
                if (flags & 16)
                    movement.x += 1;
                if (flags & 4)
                    movement.x -= 1;
                if (movement.x || movement.y) {
                    const angle = Math.atan2(movement.y, movement.x);
                    const magnitude = util.constrain(Math.sqrt(movement.x ** 2 + movement.y ** 2), -1, 1);
                    this.inputs.movement.magnitude = magnitude;
                    this.inputs.movement.angle = angle;
                }
                const player = camera.cameraData.values.player;
                if (!Entity_1.Entity.exists(player) || !(player instanceof TankBody_1.default))
                    return;
                if (this.inputs.isPossessing && this.accessLevel !== 3)
                    return;
                if ((flags & 32)) {
                    if (this.accessLevel >= 2) {
                        this.setHasCheated(true);
                        player.setTank(player.currentTank < 0 ? 0 : -1);
                    }
                    else if (this.game.arena.arenaData.values.flags & 16) {
                        if (this.game.clients.size === 1 && this.game.arena.state === 0) {
                            this.setHasCheated(true);
                            player.setInvulnerability(!player.isInvulnerable);
                            this.notify(`God mode: ${player.isInvulnerable ? "ON" : "OFF"}`, 0x000000, 1000, 'godmode');
                        }
                    }
                }
                if ((flags & 128) && !(previousFlags & 128) && (player.currentTank === -1 || player.currentTank === -12)) {
                    player.positionData.x = this.inputs.mouse.x;
                    player.positionData.y = this.inputs.mouse.y;
                    player.setVelocity(0, 0);
                    player.entityState |= 2 | 4;
                }
                if ((flags & 1024) && !(previousFlags & 1024)) {
                    if (this.accessLevel >= 2 || (this.game.arena.arenaData.values.flags & 16)) {
                        this.setHasCheated(true);
                        let tank = player.currentTank;
                        if (tank >= 0) {
                            tank = (tank + TankDefinitions_1.default.length - 1) % TankDefinitions_1.default.length;
                            while (!TankDefinitions_1.default[tank] || (TankDefinitions_1.default[tank]?.flags.devOnly && this.accessLevel < 3)) {
                                tank = (tank + TankDefinitions_1.default.length - 1) % TankDefinitions_1.default.length;
                            }
                        }
                        else {
                            const isDeveloper = this.accessLevel === 3;
                            tank = ~tank;
                            tank = (tank + 1) % DevTankDefinitions_1.default.length;
                            while (!DevTankDefinitions_1.default[tank] || DevTankDefinitions_1.default[tank].flags.devOnly === true && !isDeveloper) {
                                tank = (tank + 1) % DevTankDefinitions_1.default.length;
                            }
                            tank = ~tank;
                        }
                        player.setTank(tank);
                    }
                }
                if (flags & 256) {
                    if ((this.accessLevel === 3) || (camera.cameraData.values.level < config.maxPlayerLevel && ((this.game.arena.arenaData.values.flags & 16) || (this.accessLevel === 2)))) {
                        this.setHasCheated(true);
                        camera.setLevel(camera.cameraData.values.level + 1);
                    }
                }
                if ((flags & 64) && (!player.deletionAnimation || !player.deletionAnimation) && !this.inputs.isPossessing) {
                    if (this.accessLevel >= 2 || (this.game.arena.arenaData.values.flags & 16)) {
                        this.setHasCheated(true);
                        this.notify("You've killed " + (player.nameData.values.name === "" ? "an unnamed tank" : player.nameData.values.name));
                        camera.cameraData.killedBy = player.nameData.values.name;
                        player.destroy();
                    }
                }
                return;
            }
            case 2: {
                util.log("Client wants to spawn");
                if ((this.game.arena.state >= 2))
                    return;
                if (Entity_1.Entity.exists(camera.cameraData.values.player))
                    return this.terminate();
                camera.cameraData.values.statsAvailable = 0;
                camera.cameraData.values.level = 1;
                for (let i = 0; i < Enums_1.StatCount; ++i) {
                    camera.cameraData.values.statLevels.values[i] = 0;
                }
                const name = r.stringNT().slice(0, 16);
                const tank = camera.cameraData.player = camera.relationsData.owner = camera.relationsData.parent = new TankBody_1.default(this.game, camera, this.inputs);
                tank.setTank(0);
                this.game.arena.spawnPlayer(tank, this);
                camera.setLevel(camera.cameraData.values.respawnLevel);
                tank.nameData.values.name = name;
                if (this.hasCheated())
                    this.setHasCheated(true);
                camera.entityState = 2 | 4;
                camera.spectatee = null;
                this.inputs.isPossessing = false;
                this.inputs.movement.magnitude = 0;
                return;
            }
            case 3: {
                if (camera.cameraData.statsAvailable <= 0)
                    return;
                const player = camera.cameraData.values.player;
                if (!Entity_1.Entity.exists(player) || !(player instanceof TankBody_1.default))
                    return;
                if (this.inputs.isPossessing)
                    return;
                const definition = (0, TankDefinitions_1.getTankById)(player.currentTank);
                if (!definition || !definition.stats.length)
                    return;
                const statId = r.vi() ^ STAT_XOR;
                if (statId < 0 || statId >= Enums_1.StatCount)
                    return;
                const statLimit = camera.cameraData.values.statLimits.values[statId];
                if (camera.cameraData.values.statLevels.values[statId] >= statLimit)
                    return;
                camera.cameraData.statLevels[statId] += 1;
                camera.cameraData.statsAvailable -= 1;
                return;
            }
            case 4: {
                const player = camera.cameraData.values.player;
                if (this.inputs.isPossessing)
                    return;
                if (!Entity_1.Entity.exists(player) || !(player instanceof TankBody_1.default))
                    return;
                const definition = (0, TankDefinitions_1.getTankById)(player.currentTank);
                const tankId = r.vi() ^ TANK_XOR;
                const tankDefinition = (0, TankDefinitions_1.getTankById)(tankId);
                if (!definition || !definition.upgrades.includes(tankId) || !tankDefinition || tankDefinition.levelRequirement > camera.cameraData.values.level)
                    return;
                player.setTank(tankId);
                return;
            }
            case 7: {
                util.log("Someone is cheating");
                this.ban();
                return;
            }
            case 8: {
                camera.cameraData.flags &= ~2;
                return;
            }
            case 9: {
                if (!Entity_1.Entity.exists(camera.cameraData.player))
                    return;
                if (!this.game.entities.AIs.length)
                    return this.notify("Someone has already taken that tank", 0x000000, 5000, "cant_claim_info");
                if (!this.inputs.isPossessing) {
                    const x = camera.cameraData.player.positionData?.values.x || 0;
                    const y = camera.cameraData.player.positionData?.values.y || 0;
                    const AIs = Array.from(this.game.entities.AIs);
                    AIs.sort((a, b) => {
                        const { x: x1, y: y1 } = a.owner.getWorldPosition();
                        const { x: x2, y: y2 } = b.owner.getWorldPosition();
                        return ((x1 - x) ** 2 + (y1 - y) ** 2) - ((x2 - x) ** 2 + (y2 - y) ** 2);
                    });
                    for (let i = 0; i < AIs.length; ++i) {
                        if ((AIs[i].state !== 3) && ((AIs[i].owner.relationsData.values.team === camera.relationsData.values.team && AIs[i].isClaimable) || this.accessLevel === 3)) {
                            if (!this.possess(AIs[i]))
                                continue;
                            this.notify("Press H to surrender control of your tank", 0x000000, 5000);
                            return;
                        }
                    }
                    this.notify("Someone has already taken that tank", 0x000000, 5000, "cant_claim_info");
                }
                else {
                    this.inputs.deleted = true;
                }
                return;
            }
            case 6:
                if (!config.enableCommands)
                    return;
                const cmd = r.stringNT();
                const argsLength = r.u8();
                const args = [];
                for (let i = 0; i < argsLength; ++i) {
                    args.push(r.stringNT());
                }
                (0, Commands_1.executeCommand)(this, cmd, args);
                return;
            default:
                util.log("Suspicious activies have been evaded");
                return this.ban();
        }
    }
    setHasCheated(value) {
        const player = this.camera?.cameraData.values.player;
        if (player && player.nameData) {
            if (value)
                player.nameData.flags |= 2;
            else
                player.nameData.flags &= ~2;
        }
        this.devCheatsUsed = value;
    }
    hasCheated() {
        return this.devCheatsUsed;
    }
    possess(ai) {
        if (!this.camera?.cameraData || ai.state === 3)
            return false;
        this.inputs.deleted = true;
        ai.inputs = this.inputs = new ClientInputs(this);
        this.inputs.isPossessing = true;
        ai.state = 3;
        if (this.camera?.cameraData.values.player instanceof Object_1.default) {
            const color = this.camera.cameraData.values.player.styleData.values.color;
            this.camera.cameraData.values.player.styleData.values.color = -1;
            this.camera.cameraData.values.player.styleData.color = color;
        }
        this.camera.cameraData.tankOverride = ai.owner.nameData?.values.name || "";
        this.camera.cameraData.tank = 53;
        for (let i = 0; i < Enums_1.StatCount; ++i)
            this.camera.cameraData.statLevels[i] = 0;
        for (let i = 0; i < Enums_1.StatCount; ++i)
            this.camera.cameraData.statLimits[i] = 7;
        for (let i = 0; i < Enums_1.StatCount; ++i)
            this.camera.cameraData.statNames[i] = "";
        this.camera.cameraData.killedBy = "";
        this.camera.cameraData.player = ai.owner;
        this.camera.cameraData.movementSpeed = ai.movementSpeed;
        if (ai.owner instanceof TankBody_1.default) {
            this.camera.cameraData.tank = ai.owner.cameraEntity.cameraData.values.tank;
            this.camera.setLevel(ai.owner.cameraEntity.cameraData.values.level);
            for (let i = 0; i < Enums_1.StatCount; ++i)
                this.camera.cameraData.statLevels[i] = ai.owner.cameraEntity.cameraData.statLevels.values[i];
            for (let i = 0; i < Enums_1.StatCount; ++i)
                this.camera.cameraData.statLimits[i] = ai.owner.cameraEntity.cameraData.statLimits.values[i];
            for (let i = 0; i < Enums_1.StatCount; ++i)
                this.camera.cameraData.statNames[i] = ai.owner.cameraEntity.cameraData.statNames.values[i];
            this.camera.cameraData.FOV = ai.owner.cameraEntity.cameraData.FOV;
        }
        else if (ai.owner instanceof AbstractBoss_1.default) {
            this.camera.setLevel(75);
            this.camera.cameraData.FOV = 0.35;
        }
        else {
            this.camera.setLevel(30);
        }
        this.camera.cameraData.statsAvailable = 0;
        this.camera.cameraData.score = 0;
        return true;
    }
    notify(text, color = 0x000000, time = 4000, id = "") {
        this.write().u8(3).stringNT(text).u32(color).float(time).stringNT(id).send();
    }
    ban() {
        if (!this.ws)
            return;
        util.saveToLog("IP Banned", "Banned " + this.ws.getUserData().ipAddress + this.toString(true), 0xEE326A);
        if (this.accessLevel >= config.unbannableLevelMinimum) {
            util.saveToLog("IP Ban Cancelled", "Cancelled ban on " + this.ws.getUserData().ipAddress + this.toString(true), 0x6A32EE);
            return;
        }
        _1.bannedClients.add(this.ws.getUserData().ipAddress);
        for (const client of this.game.clients) {
            if (client.ws?.getUserData().ipAddress === this.ws.getUserData().ipAddress)
                client.terminate();
        }
    }
    tick(tick) {
        for (let header = 0; header <= this.incomingCache.length; ++header) {
            if (header === 5)
                continue;
            if (this.incomingCache[header]?.length === 1)
                this.handleIncoming(header, this.incomingCache[header][0]);
            else if (this.incomingCache[header]?.length > 1) {
                for (let i = 0, len = this.incomingCache[header].length; i < len; ++i)
                    this.handleIncoming(header, this.incomingCache[header][i]);
            }
            else
                continue;
            this.incomingCache[header] = [];
        }
        if (!this.camera) {
            if (tick === this.connectTick + 300) {
                return this.terminate();
            }
        }
        else if (this.inputs.deleted) {
            this.inputs = new ClientInputs(this);
            this.camera.cameraData.player = null;
            this.camera.cameraData.respawnLevel = 0;
            this.camera.cameraData.cameraX = this.camera.cameraData.cameraY = 0;
            this.camera.cameraData.flags &= ~2;
        }
        if (tick >= this.lastPingTick + 60 * config.tps) {
            return this.terminate();
        }
    }
    toString(verbose = false) {
        const tokens = [];
        if (this.camera?.cameraData?.player?.nameData?.name)
            tokens.push("name=" + JSON.stringify(this.camera?.cameraData?.player?.nameData?.name));
        if (verbose) {
            if (this.ws)
                tokens.push("ip=" + this.ws.getUserData().ipAddress);
            if (this.game.gamemode)
                tokens.push("game.gamemode=" + this.game.gamemode);
        }
        if (this.terminated)
            tokens.push("(terminated)");
        if (!tokens.length)
            return `Client(${this.accessLevel}) {}`;
        return `Client(${this.accessLevel}) { ${tokens.join(', ')} }`;
    }
}
exports.default = Client;
