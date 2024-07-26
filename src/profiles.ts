/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { Fun1Num, Fun2Num } from './types';

export const constant: Fun1Num = () => 1;
export const linear: Fun1Num = r => 1 - r;
export const gauss: Fun1Num = r => 256 ** -(r ** 2);
export const circle: Fun1Num = r => Math.sqrt(1 - r ** 2);

const createCubic = (n: number, m: number) => (r: number) => 1 - n * r + (-3 + 2 * n + m) * r ** 2 + (2 - n - m) * r ** 3;
export const cubic1: Fun1Num = createCubic(0, 2);
export const cubic2: Fun1Num = createCubic(0, 1);
export const cubic3: Fun1Num = createCubic(0, 0);
export const cubic4: Fun1Num = createCubic(1, 0);
export const cubic5: Fun1Num = createCubic(2, 0);

export const toFun2D = (f: Fun1Num, norm: (x: number, y: number) => number) => (x: number, y: number) => f(Math.min(norm(x, y), 1));

export const supremum: Fun2Num = (x, y) => Math.max(Math.abs(x), Math.abs(y));
export const euclidean: Fun2Num = (x, y) => Math.sqrt(x ** 2 + y ** 2);
export const manhattan: Fun2Num = (x, y) => Math.abs(x) + Math.abs(y);

export const inverted = (f: Fun1Num) => (r: number) => -f(r);

export function createProfileImage(profile: Fun1Num): number {
    const range = ui.imageManager.allocate(1);
    if (!range) return context.getIcon("empty");
    const id = range.start;

    const imgH = 20, imgW = imgH * 2, b = 4, shpH = imgH - b, shpW = shpH * 2;
    const offset = (profile(1) + profile(0.5) >= 0) ? 0 : shpH;

    const data = new Uint8Array(imgW * imgH);
    for (let x = 0; x < imgW; x++) {
        let z = (x < b || x >= imgW - b) ? 0 : profile(Math.abs((shpW - 1) / shpW + (b - x) / (shpW / 2)));
        let y;
        for (y = 0; 1 / shpH / 2 + (y - offset - b) / shpH <= z; y++)
            data[x + imgW * (imgH - 1 - y)] = 90; // inner filling

    }
    for (let y = 0; y < b + offset; y++) {
        data[0 + imgW * (imgH - 1 - y)] = 92; // left
        data[imgW - 1 + imgW * (imgH - 1 - y)] = 88; // right
    }
    for (let x = 0; x < imgW; x++)
        data[x + imgW * (imgH - 1)] = 88; // bottom
    for (let x = 1; x < imgW - 1; x++) {
        let y = 0;
        while (data[x + imgW * y] === 0) y++;
        for (; data[x + imgW * (y - 1)] * data[(x - 1) + imgW * y] * data[(x + 1) + imgW * y] === 0; y++)
            data[x + imgW * y] = 92; // top outline
    }
    data[0 + imgW * (imgH - b - offset)] = 21; // top left
    data[0 + imgW * (imgH - 1)] = 89; // bottom left
    data[(imgW - 1) + imgW * (imgH - 1)] = 87; // bottom right
    data[(imgW - 1) + imgW * (imgH - b - offset)] = 89; // top right

    const p = 2, data2 = new Uint8Array((imgW + 2 * p) * (imgH + 2 * p));
    for (let x = 0; x < imgW; x++)
        for (let y = 0; y < imgH; y++)
            data2[x + p + (imgW + 2 * p) * (y + p)] = data[x + imgW * y];

    ui.imageManager.setPixelData(id, {
        type: "raw",
        width: imgW + 2 * p,
        height: imgH + 2 * p,
        data: data2,
    });

    return id;
}

// msb to lsb: down, left, up, right
const colMap = [
    90, // 0b0000
    92, // 0b0001
    88, // 0b0010
    88, // 0b0011
    88, // 0b0100
    90, // 0b0101
    88, // 0b0110
    88, // 0b0111
    92, // 0b1000
    92, // 0b1001
    90, // 0b1010
    92, // 0b1011
    92, // 0b1100
    92, // 0b1101
    88, // 0b1110
    90, // 0b1111
];

export function createShapeImage(norm: typeof euclidean): number {
    const range = ui.imageManager.allocate(1);
    if (!range) return context.getIcon("empty");
    const id = range.start;

    const data = new Uint8Array(40 * 40);
    for (let x = 4; x < 36; x++)
        for (let y = 4; y < 36; y++)
            if (norm(1 / 32 + (x - 20) / 16, 1 / 32 + (y - 20) / 16) <= 1)
                data[x + 40 * y] = 90;

    for (let x = 4; x < 36; x++)
        for (let y = 4; y < 36; y++)
            if (data[x + 40 * y] > 0)
                data[x + 40 * y] = colMap[[[0, 1], [-1, 0], [0, -1], [1, 0]].map(
                    ([dx, dy]) => data[(x + dx) + 40 * (y + dy)] > 0
                ).reduce(
                    (acc, val) => (acc << 1) + Number(val), 0
                )];

    ui.imageManager.setPixelData(id, {
        type: "raw",
        width: 40,
        height: 40,
        data: data,
    });

    return id;
}
