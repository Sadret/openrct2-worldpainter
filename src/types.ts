/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

/** input and output in [-1,1] */
export type ProfileFun1D = (r: number) => number;

/** input and output in [-1,1] */
export type ProfileFun2D = (x: number, y: number) => number;

export type ProfileModifier = (f: ProfileFun1D, p: number) => ProfileFun1D;

export type DragMode = "none" | "apply" | "move";