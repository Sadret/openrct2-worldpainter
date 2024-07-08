import { ProfileFun2D } from './types';
/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

type Num4 = [number, number, number, number];
function add(a: Num4, b: Num4): Num4 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

export type ProfileData = {
    [key: number]: {
        [key: number]: number;
    };
};

type ProfileCornerData = {
    [key: number]: {
        [key: number]: Num4;
    };
};

class Profile {
    private readonly initialZ: (x: number, y: number) => Num4;
    private profile: ProfileCornerData = {};

    public constructor(initialZ: (x: number, y: number) => Num4) {
        this.initialZ = initialZ;
    }

    public reset(): void {
        this.profile = {};
    }

    public getZ(x: number, y: number): Num4 {
        if (this.profile[x] && this.profile[x][y])
            return this.profile[x][y];
        const z = this.initialZ(x, y);
        this.setZ(x, y, z);
        return z;
    }

    public setZ(x: number, y: number, z: Num4): void {
        if (!this.profile[x])
            this.profile[x] = {};
        this.profile[x][y] = z;
    }

    public addCornerZ(x: number, y: number, corner: number, z: number): void {
        if (!this.profile[x])
            this.profile[x] = {};
        if (!this.profile[x][y])
            this.profile[x][y] = [0, 0, 0, 0,];
        this.profile[x][y][corner] += z;
    }

    public addZ(x: number, y: number, z: Num4): void {
        if (!this.profile[x])
            this.profile[x] = {};
        if (!this.profile[x][y])
            this.profile[x][y] = [0, 0, 0, 0,];
        this.profile[x][y] = add(this.profile[x][y], z);
    }

    public forEach(callback: (x: number, y: number, z: Num4) => void): void {
        for (const x in this.profile)
            for (const y in this.profile[x])
                callback(Number(x), Number(y), this.getZ(Number(x), Number(y)));
    }
}

const initial: Profile = new Profile((x, y) => getSurfaceZ(getSurface(x, y)));
const delta: Profile = new Profile(() => [0, 0, 0, 0]);

export function reset(): void {
    initial.reset();
    delta.reset();
}

export function apply(xMin: number, xMax: number, yMin: number, yMax: number, data: ProfileData): void {
    for (let x = xMin; x < xMax; x++)
        for (let y = yMin; y < yMax; y++) {
            delta.addZ(x, y, [[1, 1], [1, 0], [0, 0], [0, 1]].map(([dx, dy]) => data[x + dx][y + dy]) as Num4);
            setSurfaceZ(getSurface(x, y), add(initial.getZ(x, y), delta.getZ(x, y)));
        }
}

function getSurface(x: number, y: number): SurfaceElement {
    const tile = map.getTile(x, y);
    for (const element of tile.elements)
        if (element.type === "surface")
            return element;
    return undefined as never;
}
function getSurfaceZ(surface: SurfaceElement): Num4 {
    const baseHeight = surface.baseHeight;
    const slope = surface.slope;

    return [0, 1, 2, 3].map(corner =>
        baseHeight / 2 // baseHeight in terrain steps
        + (slope >> corner & 1) // add 1 if corner is raised
        + (slope >> 4 & 1) // add 1 if slope is diagonally raised
        * (1 - (slope >> ((corner + 2) & 3) & 1)) // but only if the opposite corner is lowered
    ) as Num4;
}

function setSurfaceZ(surface: SurfaceElement, fractional: Num4): void {
    // TODO: negative base height (lower rest)
    // TODO: positive overflow
    // TODO: don't touch map borders
    // TODO: symmetric behaviour

    let integral = fractional.map(corner => Math.floor(corner));

    // raise just below height of adjacent corners
    integral = integral.map((_, corner) => Math.max(
        integral[corner],
        integral[(corner + 1) & 3] - 1,
        integral[(corner + 2) & 3] - 2,
        integral[(corner + 3) & 3] - 1,
    ));

    // subtract new height
    const height = Math.min(...integral);
    integral = integral.map(corner => corner - height);

    // calculate slope
    const slope = integral.reduce((slope, z, idx) => {
        if (z) slope |= 1 << idx;
        if (z > 1) slope |= (1 << 4);
        return slope;
    }, 0);

    surface.baseHeight = height << 1;
    surface.clearanceHeight = height << 1;
    surface.slope = slope;
}