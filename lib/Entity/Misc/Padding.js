"use strict";
const Object_1 = require("../Object2");

class Padding extends Object_1.default {
    constructor(game, x, y, width, height, holeWidth = 40, holeHeight = 30) {
        super(game);

        this.holeWidth = holeWidth;
        this.holeHeight = holeHeight;
        this.holeX = x + (width - holeWidth) / 2; // 穴の水平中央
        this.holeY = y + (height - holeHeight) / 2; // 穴の垂直中央

        if (holeWidth > 0 && holeHeight > 0) {
            // 4つの壁部分を定義
            this.parts = [
                new Object_1.default(game), // 上部
                new Object_1.default(game), // 下部
                new Object_1.default(game), // 左部
                new Object_1.default(game)  // 右部
            ];

            // 各部分の共通設定
            for (const part of this.parts) {
                part.physicsData.values.sides = 2; // 矩形
                part.physicsData.values.flags |= 0;
                part.physicsData.values.pushFactor = 0;
                part.physicsData.values.absorbtionFactor = 0;
                part.styleData.values.borderWidth = 0;
                part.styleData.values.opacity = 0.175;
                part.styleData.values.color = 0;
            }

            // 上部の壁
            this.parts[0].positionData.values.x = x + width / 2;
            this.parts[0].positionData.values.y = y + (this.holeY - y) / 2;
            this.parts[0].physicsData.values.size = width;
            this.parts[0].physicsData.values.width = this.holeY - y;

            // 下部の壁
            this.parts[1].positionData.values.x = x + width / 2;
            this.parts[1].positionData.values.y = y + height - ((y + height) - (this.holeY + this.holeHeight)) / 2;
            this.parts[1].physicsData.values.size = width;
            this.parts[1].physicsData.values.width = (y + height) - (this.holeY + this.holeHeight);

            // 左部の壁
            this.parts[2].positionData.values.x = x + (this.holeX - x) / 2;
            this.parts[2].positionData.values.y = y + (this.holeY - y) + this.holeHeight / 2;
            this.parts[2].physicsData.values.size = this.holeX - x;
            this.parts[2].physicsData.values.width = this.holeHeight;

            // 右部の壁
            this.parts[3].positionData.values.x = x + width - ((x + width) - (this.holeX + this.holeWidth)) / 2;
            this.parts[3].positionData.values.y = y + (this.holeY - y) + this.holeHeight / 2;
            this.parts[3].physicsData.values.size = (x + width) - (this.holeX + this.holeWidth);
            this.parts[3].physicsData.values.width = this.holeHeight;
        }
    }
}

exports.default = Padding;