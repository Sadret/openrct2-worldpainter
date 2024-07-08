/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { ProfileFun1D, ProfileFun2D, ProfileModifier } from './types';

export const constant: ProfileFun1D = () => 1;
export const linear: ProfileFun1D = r => 1 - r;
export const quadratic: ProfileFun1D = r => 1 - r ** 2;
export const cubic: ProfileFun1D = r => 1 - 3 * r ** 2 + 2 * r ** 3;
export const gauss: ProfileFun1D = r => 256 ** -(r ** 2);
export const circle: ProfileFun1D = r => Math.sqrt(1 - r ** 2);
export const invQuadratic: ProfileFun1D = r => (r - 1) ** 2;
export const invCircle: ProfileFun1D = r => 1 - Math.sqrt(1 - (1 - r) ** 2); // ugly and does not really top out at 1

export function toFun2D(f: ProfileFun1D, norm: (x: number, y: number) => number): ProfileFun2D {
    return (x, y) => {
        const r = norm(x, y);
        return r > 1 ? 0 : f(r);
    };
};

export const toSupremum = (f: ProfileFun1D) => toFun2D(f, (x, y) => Math.max(Math.abs(x), Math.abs(y)));
export const toEuclidean = (f: ProfileFun1D) => toFun2D(f, (x, y) => Math.sqrt(x ** 2 + y ** 2));
export const toManhattan = (f: ProfileFun1D) => toFun2D(f, (x, y) => Math.abs(x) + Math.abs(y));

export const unmodified: ProfileModifier = f => f;
export const crater: ProfileModifier = (f, p) => r => 1 - Math.abs(f(r) / (1 - p / 2) - 1);
export const mesa: ProfileModifier = (f, p) => p < 1 ? r => Math.min(f(r), (1 - p)) / (1 - p) : constant;
export const mesa2: ProfileModifier = (f, p) => r => r < p ? 1 : f((r - p) / (1 - p));
export const capped: ProfileModifier = (f, p) => { const fp = f(1 - p); return fp < 1 ? r => (f(r * (1 - p)) - fp) / (1 - fp) : constant; };

// export const inverted: ProfileModifier = f => r => -f(r);

export function createProfileImage(profile: ProfileFun1D): number {
    const id = ui.imageManager.allocate(1)?.start || 0; // TODO: catch error
    const data = new Uint8Array(40 * 40);
    for (let x = 0; x < 40; x++) {
        let z = (x < 4 || x >= 36) ? 0 : profile(Math.abs(31 / 32 + (4 - x) / 16));
        let y;
        for (y = 0; -31 / 32 + (y - 4) / 16 <= z; y++)
            data[x + 40 * (39 - y)] = 90; // inner filling

    }
    for (let y = 20; y < 40; y++) {
        data[0 + 40 * y] = 92; // left
        data[39 + 40 * y] = 88; // right
    }
    for (let x = 0; x < 40; x++)
        data[x + 40 * 39] = 88; // bottom
    for (let x = 1; x < 39; x++) {
        let y = 0;
        while (data[x + 40 * y] === 0) y++;
        for (; data[x + 40 * (y - 1)] * data[(x - 1) + 40 * y] * data[(x + 1) + 40 * y] === 0; y++)
            data[x + 40 * y] = 92; // top outline
    }
    data[0 + 40 * 20] = 21; // top left
    data[0 + 40 * 39] = 89; // bottom left
    data[39 + 40 * 39] = 87; // bottom right
    data[39 + 40 * 20] = 89; // top right

    // for (let x = 0; x < 40; x++)
    //     if ((x & 3) === 1 || (x & 3) === 2)
    //         data[x + 40 * 20] = 82; // ground level line

    ui.imageManager.setPixelData(id, {
        type: "raw",
        width: 40,
        height: 40,
        data: data,
    });

    return id;
}



// TODO: use colMap idea in createImage
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

export function createShapeImage(shapeFun: typeof toEuclidean): number {
    const id = ui.imageManager.allocate(1)?.start || 0; // TODO: catch error
    const data = new Uint8Array(40 * 40);
    for (let x = 4; x < 36; x++)
        for (let y = 4; y < 36; y++)
            if (shapeFun(constant)(1 / 32 + (x - 20) / 16, 1 / 32 + (y - 20) / 16) > 0)
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
