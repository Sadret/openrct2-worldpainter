/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

/** input and output in [-1,1] */
export type ProfileFun = (x: number, y: number) => number;

export type DragMode = "none" | "apply" | "move";

export type BrushMode = "absolute" | "relative";
