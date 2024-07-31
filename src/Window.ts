/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { button, compute, FlexiblePosition, graphics, groupbox, horizontal, spinner, store, twoway, WidgetCreator, window, WritableStore } from "openrct2-flexui";
import * as Images from "./Images";
import * as Profiles from "./Profiles";
import type { BrushDirection, Fun1Num, ImageData, SpecialMode, ToolMode, ToolShape, ToolType } from "./types";

/*
 * TYPES
 */

type Image = keyof typeof Images;
type ToolProfile = keyof typeof Profiles;

/*
 * UI HELPER FUNCTIONS
 */

function imageOf(profile: Fun1Num): ImageData {
    const range = ui.imageManager.allocate(1);
    if (!range) throw new Error("[WP] Cannot allocate image from image manager.");

    const id = range.start;

    const imgH = 20, imgW = imgH * 2, b = 4, shpH = imgH - b, shpW = shpH * 2;
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

    const p = 2, data2 = new Uint8Array((imgW + 2 * p) * (imgH + 2 * p));
    for (let x = 0; x < imgW; x++)
        for (let y = 0; y < imgH; y++)
            data2[x + p + (imgW + 2 * p) * (y + p)] = data[x + imgW * y];

    ui.imageManager.setPixelData(id, {
        type: "raw",
        width: imgW + 2 * p,
        height: imgH + 2 * p,
        data: data2,
    });

    return {
        image: id,
        width: imgW + 2 * p,
        height: imgH + 2 * p,
    };
}

function tooltipOf(str: string): string {
    const temp = str.replace(/_/g, " ");
    return temp.charAt(0).toUpperCase() + temp.slice(1);
}

function graphicsOf(image: ImageData): WidgetCreator<FlexiblePosition> {
    return graphics({
        ...image,
        onDraw: g => g.image(image.image, 0, 0),
    });
}

function buttonOf<T extends Image | ToolProfile>(value: T, store: WritableStore<T>): WidgetCreator<FlexiblePosition> {
    return button({
        ...Images[value as Image] || imageOf(Profiles[value as ToolProfile]),
        tooltip: tooltipOf(value),
        onClick: () => store.set(value),
        isPressed: compute(store, active => active === value),
    });
}

/*
 * SETTINGS VALUES
 */

const toolShapes: ToolShape[] = ["square", "circle", "diamond"];
const toolTypes: ToolType[] = ["brush", "sculpt", "special"];
const toolModes: ToolMode[] = ["relative", "absolute", "plateau"];
const brushDirections: BrushDirection[] = ["up", "down"];
const specialModes: SpecialMode[] = ["smooth", "flatten", "rough"];
const standardProfiles: ToolProfile[] = ["flat", "cone", "bell", "sphere"];
const cubicProfiles: ToolProfile[] = ["cubic_1", "cubic_2", "cubic_3", "cubic_4", "cubic_5"];

/*
 * SETTINGS STORES
 */

export const isActive = store(false);

export const toolShape = store<ToolShape>("circle");

export const toolWidth = store(40);
const toolLengthInput = store(8);
const squareAspectRatio = store(true);
export const toolLength = compute(toolWidth, toolLengthInput, squareAspectRatio, (w, l, s) => s ? w : l);
export const toolRotation = store(0);

export const toolType = store<ToolType>("brush");

export const toolMode = store<ToolMode>("relative");
export const brushSensitivity = store(3);
export const brushDirection = store<BrushDirection>("up");
export const specialMode = store<SpecialMode>("smooth");

export const toolProfile = store<ToolProfile>("cubic_3");

/*
 * WINDOW
 */

const win = window({
    title: "WorldPainter",
    width: 258,
    height: "auto",
    content: [
        groupbox({
            text: "Tool shape",
            content: [
                horizontal({
                    width: "100%",
                    spacing: "1w",
                    content: toolShapes.map(shape => buttonOf(shape, toolShape)),
                }),
            ],
        }),
        groupbox({
            text: "Tool size and rotation",
            content: [
                horizontal({
                    content: [
                        graphicsOf(Images.size),
                        spinner({
                            minimum: 2,
                            value: twoway(toolWidth),
                        }),
                        button({
                            image: 29440,
                            onClick: () => squareAspectRatio.set(!squareAspectRatio.get()),
                            isPressed: squareAspectRatio,
                            height: 14,
                            width: 20,
                        }),
                        spinner({
                            minimum: 2,
                            value: twoway(toolLengthInput),
                            disabled: squareAspectRatio,
                        }),
                        graphicsOf(Images.rotation),
                        spinner({
                            value: twoway(toolRotation),
                            step: 5,
                            format: v => `${v}°`,
                        }),
                    ],
                }),
            ],
        }),
        groupbox({
            text: "Tool type",
            width: "100%",
            content: [
                horizontal({
                    content: toolTypes.map(type => buttonOf(type, toolType)),
                }),
            ],
        }),
        groupbox({
            text: "Tool settings: TODO",
            content: [
                horizontal({
                    content: toolModes.map(mode => buttonOf(mode, toolMode)),
                }),
                horizontal({
                    content: [
                        graphicsOf(Images.sensitivity),
                        spinner({
                            minimum: 0,
                            maximum: 10,
                            value: twoway(brushSensitivity),
                        }),
                        ...brushDirections.map(direction => buttonOf(direction, brushDirection)),
                    ],
                }),
                horizontal({
                    content: specialModes.map(mode => buttonOf(mode, specialMode)),
                }),
            ],
        }),
        groupbox({
            text: "Mountain shape",
            content: [standardProfiles, cubicProfiles].map(profileList =>
                horizontal({
                    content: profileList.map(profile => buttonOf(profile, toolProfile)),
                }),
            ),
        }),
    ],
    onOpen: () => isActive.set(true),
    onClose: () => isActive.set(false),
});

/*
 * INITIALISATION
 */

export function init(): void {
    isActive.subscribe(value => value ? win.open() : win.close());
}
