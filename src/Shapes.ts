/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import type { Fun2Num } from "./types";

export const square: Fun2Num = (x, y) => Math.max(Math.abs(x), Math.abs(y));
export const circle: Fun2Num = (x, y) => Math.sqrt(x ** 2 + y ** 2);
export const diamond: Fun2Num = (x, y) => Math.abs(x) + Math.abs(y);
