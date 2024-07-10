/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

export type ProfileData = {
    [key: number]: {
        [key: number]: number;
    };
};

type Num4 = [number, number, number, number];

type ProfileCornerData = {
    [key: number]: {
        [key: number]: Num4;
    };
};

function add(a: Num4, b: Num4): Num4 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

function getSurface(x: number, y: number): SurfaceElement | undefined {
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

let profile: ProfileCornerData = {};

function setZ(x: number, y: number, z: Num4): void {
    if (!profile[x])
        profile[x] = {};
    profile[x][y] = z;
    setSurfaceZ(x, y, z);
}

function getZ(x: number, y: number): Num4 {
    if (profile[x] && profile[x][y])
        return profile[x][y];
    const z = getSurfaceZ(x, y);
    setZ(x, y, z);
    return z;
}

export function apply(tiles: CoordsXY[], data: ProfileData): void {
    tiles.forEach(({ x, y }) => setZ(x, y, add(
        getZ(x, y),
        [[1, 1], [1, 0], [0, 0], [0, 1]].map(([dx, dy]) => data[x + dx][y + dy]) as Num4),
    ));
}