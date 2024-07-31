/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import type { Fun1Num } from "./types";

export const flat: Fun1Num = () => 1;
export const cone: Fun1Num = r => 1 - r;
export const bell: Fun1Num = r => 256 ** -(r ** 2);
export const sphere: Fun1Num = r => Math.sqrt(1 - r ** 2);

const createCubic = (n: number, m: number) => (r: number) => 1 - n * r + (-3 + 2 * n + m) * r ** 2 + (2 - n - m) * r ** 3;
export const cubic_1: Fun1Num = createCubic(0, 3);
export const cubic_2: Fun1Num = createCubic(0, 1.5);
export const cubic_3: Fun1Num = createCubic(0, 0);
export const cubic_4: Fun1Num = createCubic(1.5, 0);
export const cubic_5: Fun1Num = createCubic(3, 0);
