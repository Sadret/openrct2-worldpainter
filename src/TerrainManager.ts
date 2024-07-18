/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { ProfileFun2D } from "./types";

type Num4 = [number, number, number, number];

type ProfileCornerFun = (x: number, y: number) => Num4;

type ProfileCornerData = {
    [key: number]: {
        [key: number]: Num4;
    };
};

function add(a: Num4, b: Num4): Num4 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

export function getSurface(x: number, y: number): SurfaceElement | undefined {
    if (x < 1 || x >= map.size.x - 1 || y < 1 || y >= map.size.y - 1)
        return undefined;

    const tile = map.getTile(x, y);
    for (const element of tile.elements)
        if (element.type === "surface")
            return element;

    return undefined;
}

function getSurfaceZ(x: number, y: number): Num4 {
    const surface = getSurface(x, y);
    if (!surface) return [0, 0, 0, 0];

    const baseHeight = surface.baseHeight;
    const slope = surface.slope;

    return [0, 1, 2, 3].map(corner =>
        baseHeight / 2 // baseHeight in terrain steps
        + (slope >> corner & 1) // add 1 if corner is raised
        + (slope >> 4 & 1) // add 1 if slope is diagonally raised
        * (1 - (slope >> ((corner + 2) & 3) & 1)) // but only if the opposite corner is lowered
    ) as Num4;
}

function setSurfaceZ(x: number, y: number, fractional: Num4): void {
    const surface = getSurface(x, y);
    if (!surface) return;

    let integral = fractional.map(corner => Math.round(corner));

    // raise just below height of adjacent corners
    integral = integral.map((_, corner) => Math.max(
        integral[corner],
        integral[(corner + 1) & 3] - 1,
        integral[(corner + 2) & 3] - 2,
        integral[(corner + 3) & 3] - 1,
    ));

    // subtract new height
    const height = Math.max(Math.min(...integral, 0x7F), 1);
    integral = integral.map(corner => Math.max(Math.min(corner, 0x7f) - height, 0));

    // calculate slope
    const slope = integral.reduce((slope, z, idx) => {
        if (z) slope |= 1 << idx;
        if (z > 1) slope |= (1 << 4);
        return slope;
    }, 0);

    const args: LandSetHeightArgs = {
        x: x << 5,
        y: y << 5,
        height: height << 1,
        style: slope,
    };
    // set new height and slope
    context.queryAction("landsetheight", args,
        result => result.error || context.executeAction("landsetheight", args)
    );
}


class Profile {
    private readonly initialZ: ProfileCornerFun;
    public data: ProfileCornerData = {};

    public constructor(initialZ: ProfileCornerFun) {
        this.initialZ = initialZ;
    }

    public setZ(x: number, y: number, z: Num4): void {
        if (!this.data[x])
            this.data[x] = {};
        this.data[x][y] = z;
        // setSurfaceZ(x, y, z);
    }

    public getZ(x: number, y: number): Num4 {
        if (this.data[x] && this.data[x][y])
            return this.data[x][y];
        const z = this.initialZ(x, y);
        this.setZ(x, y, z);
        return z;
    }

    public addZ(x: number, y: number, z: Num4): void {
        this.setZ(x, y, add(this.getZ(x, y), z));
    }
}

const surfaceProfile = new Profile((x, y) => getSurfaceZ(x, y));
const deltaProfile = new Profile(() => [0, 0, 0, 0]);

export function apply(tiles: CoordsXY[], profile: ProfileFun2D, profileStrategy: ProfileFun2D): void {
    tiles.forEach(({ x, y }) => {
        deltaProfile.addZ(x, y, [[1, 1], [1, 0], [0, 0], [0, 1]].map(([dx, dy]) => profile(x + dx, y + dy)) as Num4);
        const surface = surfaceProfile.getZ(x, y);
        const delta = deltaProfile.getZ(x, y);
        const newProfile = surface.map((corner, idx) => profileStrategy(corner, delta[idx])) as Num4;
        setSurfaceZ(x, y, newProfile);
    });
}

export function finalise(profileStrategy: ProfileFun2D): void {
    for (const x in deltaProfile.data) {
        const xn = Number(x);
        for (const y in deltaProfile.data[x]) {
            const yn = Number(y);
            const surface = surfaceProfile.getZ(xn, yn);
            const delta = deltaProfile.getZ(xn, yn);
            const newProfile = surface.map((corner, idx) => profileStrategy(corner, delta[idx])) as Num4;
            surfaceProfile.setZ(xn, yn, newProfile);
        }
    }
    deltaProfile.data = {};
}
