/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { ProfileFun } from './types';

const cos1 = Math.cos(1);
export const flat: ProfileFun = () => 1;
export const gauss: ProfileFun = (x, y) => 256 ** -(x * x + y * y);
export const volcano: ProfileFun = (x, y) => 1 - Math.abs(1 - 1.5 * gauss(x, y));
export const sine: ProfileFun = (x, y) => 0.5 + Math.cos(Math.min(Math.sqrt(x * x + y * y), 1) * Math.PI) / 2;
export const sineCap: ProfileFun = (x, y) => (Math.cos(Math.min(Math.sqrt(x * x + y * y), 1)) - cos1) / (1 - cos1);
export const sphere: ProfileFun = (x, y) => Math.sqrt(1 - x * x - y * y) || 0;
export const test: ProfileFun = (x, y) => Math.abs(x) < 0.25 && Math.abs(y) < 0.25 ? 1 : 0;
export const sine2: ProfileFun = (x, y) => Math.cos(Math.sqrt(x * x + y * y) * Math.PI);
export const crater: ProfileFun = (x, y) => 1 - Math.abs(1 - 3 * sineCap(x, y));

export function inverted(profile: ProfileFun): ProfileFun {
    return (x, y) => -profile(x, y);
}

export function createImage(profile: ProfileFun): number {
    const id = ui.imageManager.allocate(1)?.start || 0; // TODO: catch error
    const data = new Uint8Array(40 * 40);
    for (let x = 0; x < 40; x++) {
        let z = (x < 4 || x >= 36) ? 0 : profile(-31 / 32 + (x - 4) / 16, 0);
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