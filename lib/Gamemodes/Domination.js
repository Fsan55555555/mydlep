"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const Enums_1 = require("../Const/Enums");
const Dominator_1 = require("../Entity/Misc/Dominator");
const Padding = require("../Entity/Misc/Padding2").default;
const AIPlayer_1 = require("../Entity/Misc/AIPlayer");
const TeamBase_1 = require("../Entity/Misc/TeamBase");
const TeamEntity_1 = require("../Entity/Misc/TeamEntity");
const Arena_1 = require("../Native/Arena");
const util_1 = require("../util");
const Entity_1 = require("../Native/Entity");

const spawnSize = 11150;
const ArenaSize = 11850; //11150
const baseSize = 3345;
const domBaseSize = baseSize / 2;

class DominationArena extends Arena_1.default {
    constructor(game) {
        super(game);
        this.dominators = [];
        this.aiPlayers = [];
        this.playerTeamMap = new Map();
        this.teams = [
            new TeamEntity_1.TeamEntity(this.game, 3),
            new TeamEntity_1.TeamEntity(this.game, 4)
        ];
        this.shapeScoreRewardMultiplier = 2.0;
        this.updateBounds(ArenaSize * 2, ArenaSize * 2);
        this.arenaData.values.flags |= 4;
        this.blueTeamBase = new TeamBase_1.default(game, this.teams[0], -spawnSize + baseSize / 2, Math.random() > .5 ? (spawnSize - baseSize / 2) : -spawnSize + baseSize / 2, baseSize, baseSize);
        this.redTeamBase = new TeamBase_1.default(game, this.teams[1], spawnSize - baseSize / 2, Math.random() > .5 ? (spawnSize - baseSize / 2) : -spawnSize + baseSize / 2, baseSize, baseSize);

        const dom1 = new Dominator_1.default(this, new TeamBase_1.default(game, this, spawnSize / 2.5, spawnSize / 2.5, domBaseSize, domBaseSize, false));
        dom1.nameData.name = "Dominator";
        const dom2 = new Dominator_1.default(this, new TeamBase_1.default(game, this, spawnSize / -2.5, spawnSize / 2.5, domBaseSize, domBaseSize, false));
        dom2.nameData.name = "Dominator";
        const dom3 = new Dominator_1.default(this, new TeamBase_1.default(game, this, spawnSize / -2.5, spawnSize / -2.5, domBaseSize, domBaseSize, false));
        dom3.nameData.name = "Dominator";
        const dom4 = new Dominator_1.default(this, new TeamBase_1.default(game, this, spawnSize / 2.5, spawnSize / -2.5, domBaseSize, domBaseSize, false));
        dom4.nameData.name = "Dominator";

        this.dominators.push(dom1, dom2, dom3, dom4);
// MazeWallをゲームフィールドの中央に1つだけ追加
const PaddingInsta = new Padding(this.game, -23700 / 2, -23700 / 2, 23700, 23700, 22300, 22300);

        for (const team of this.teams) {
            for (let i = 0; i < 23; i++) {
                const aiPlayer = new AIPlayer_1.default(this.game);
                aiPlayer.relationsData.values.team = team;
                aiPlayer.styleData.values.color = team.teamData.values.teamColor;
                const base = team === this.teams[0] ? this.blueTeamBase : this.redTeamBase;
                const xOffset = (Math.random() - 0.5) * baseSize;
                const yOffset = (Math.random() - 0.5) * baseSize;
                aiPlayer.positionData.values.x = base.positionData.values.x + xOffset;
                aiPlayer.positionData.values.y = base.positionData.values.y + yOffset;
                this.pushAIPlayer(aiPlayer);
            }
        }
    }

    pushAIPlayer(aiPlayer) {
        this.aiPlayers.push(aiPlayer);
    }

    spawnPlayer(tank, client) {
        tank.positionData.values.y = spawnSize * Math.random() - spawnSize;
        const xOffset = (Math.random() - 0.5) * baseSize, yOffset = (Math.random() - 0.5) * baseSize;
        const base = this.playerTeamMap.get(client) || [this.blueTeamBase, this.redTeamBase][0 | Math.random() * 2];
        tank.relationsData.values.team = base.relationsData.values.team;
        tank.styleData.values.color = base.styleData.values.color;
        if (base.relationsData.values.team.teamData) {
            base.relationsData.values.team.teamData.flags |= 1;
        }
        tank.positionData.values.x = base.positionData.values.x + xOffset;
        tank.positionData.values.y = base.positionData.values.y + yOffset;
        this.playerTeamMap.set(client, base);
        if (client.camera) {
            client.camera.relationsData.team = tank.relationsData.values.team;
        }
    }

    tick(tick) {
        const length = Math.min(10, this.dominators.length);
        for (let i = 0; i < length; ++i) {
            const dominator = this.dominators[i];
            if (this.dominators[0].relationsData.values.team === this.dominators[1].relationsData.values.team &&
                this.dominators[1].relationsData.values.team === this.dominators[2].relationsData.values.team &&
                this.dominators[2].relationsData.values.team === this.dominators[3].relationsData.values.team &&
                this.dominators[3].relationsData.values.team === this.dominators[0].relationsData.values.team &&
                this.dominators[0].relationsData.values.team !== this.game.arena &&
                this.dominators[1].relationsData.values.team !== this.game.arena &&
                this.dominators[2].relationsData.values.team !== this.game.arena &&
                this.dominators[3].relationsData.values.team !== this.game.arena) {
                
                if (this.state === 0) {
                    const team = this.dominators[1].relationsData.values.team;
                    const isateam = team instanceof TeamEntity_1.TeamEntity;
                    if (team && team.teamData) {
                        const message = `${isateam ? team.teamName : (this.dominators[1].nameData?.values.name || "an unnamed tank")} HAS WON THE GAME!`;
                        this.game.broadcast()
                            .u8(3)
                            .stringNT(message)
                            .u32(Enums_1.ColorsHexCode[this.dominators[1].styleData.color])
                            .float(Infinity)
                            .stringNT("")
                            .send();
                    }
                    this.state = 1;
                    setTimeout(() => {
                        this.close();
                    }, 5000);
                }
            }
        }

        this.aiPlayers = this.aiPlayers.filter(ai => Entity_1.Entity.exists(ai));
        if (this.state === 0) {
            for (const team of this.teams) {
                const aliveCount = this.aiPlayers.filter(ai => ai.relationsData.values.team === team).length;
                const missing = 20 - aliveCount;
                for (let i = 0; i < missing; i++) {
                    const aiPlayer = new AIPlayer_1.default(this.game);
                    aiPlayer.relationsData.values.team = team;
                    aiPlayer.styleData.values.color = team.teamData.values.teamColor;
                    const base = team === this.teams[0] ? this.blueTeamBase : this.redTeamBase;
                    const xOffset = (Math.random() - 0.5) * baseSize;
                    const yOffset = (Math.random() - 0.5) * baseSize;
                    aiPlayer.positionData.values.x = base.positionData.values.x + xOffset;
                    aiPlayer.positionData.values.y = base.positionData.values.y + yOffset;
                    this.pushAIPlayer(aiPlayer);
                }
            }
        }
        super.tick(tick);
    }
}

exports.default = DominationArena;