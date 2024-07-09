/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { Norm, ProfileFun1D, ProfileModifier } from './types';

export const constant: ProfileFun1D = () => 1;
export const linear: ProfileFun1D = r => 1 - r;
export const quadratic: ProfileFun1D = r => 1 - r ** 2;
export const cubic: ProfileFun1D = r => 1 - 3 * r ** 2 + 2 * r ** 3;
export const gauss: ProfileFun1D = r => 256 ** -(r ** 2);
export const circle: ProfileFun1D = r => Math.sqrt(1 - r ** 2);
export const invQuadratic: ProfileFun1D = r => (r - 1) ** 2;
export const invCircle: ProfileFun1D = r => 1 - Math.sqrt(1 - (1 - r) ** 2); // ugly and does not really top out at 1

export const toFun2D = (f: ProfileFun1D, norm: (x: number, y: number) => number) => (x: number, y: number) => f(Math.min(norm(x, y), 1));

export const supremum: Norm = (x, y) => Math.max(Math.abs(x), Math.abs(y));
export const euclidean: Norm = (x, y) => Math.sqrt(x ** 2 + y ** 2);
export const manhattan: Norm = (x, y) => Math.abs(x) + Math.abs(y);

export const unmodified: ProfileModifier = f => f;
export const crater: ProfileModifier = (f, p) => r => 1 - Math.abs(f(r) / (1 - p / 2) - 1);
export const mesa: ProfileModifier = (f, p) => p < 1 ? r => Math.min(f(r), (1 - p)) / (1 - p) : constant;
export const mesa2: ProfileModifier = (f, p) => r => r < p ? 1 : f((r - p) / (1 - p));
export const capped: ProfileModifier = (f, p) => { const fp = f(1 - p); return fp < 1 ? r => (f(r * (1 - p)) - fp) / (1 - fp) : constant; };

export const inverted = (f: ProfileFun1D) => (r: number) => -f(r);

export function createProfileImage(profile: ProfileFun1D): number {
    const range = ui.imageManager.allocate(1);
    if (!range) return context.getIcon("empty");
    const id = range.start;

    const imgH = 24, b = 4, shpH = imgH - 2 * b, shpW = shpH * 2, imgW = shpW + 2 * b;
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

    ui.imageManager.setPixelData(id, {
        type: "raw",
        width: imgW,
        height: imgH,
        data: data,
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
