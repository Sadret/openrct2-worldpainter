/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { Store, button, checkbox, compute, dropdown, groupbox, horizontal, label, spinner, store, twoway, window } from "openrct2-flexui";
import { BrushMode, DragMode, ProfileFun } from './types';

// TODO: UI, valley functions
const cos1 = Math.cos(1);
let flat: ProfileFun = () => 1;
let gauss: ProfileFun = (x, y) => 256 ** -(x * x + y * y);
let volcano: ProfileFun = (x, y) => 1 - Math.abs(1 - 1.5 * gauss(x, y));
let sine: ProfileFun = (x, y) => 0.5 + Math.cos(Math.min(Math.sqrt(x * x + y * y), 1) * Math.PI) / 2;
let sineCap: ProfileFun = (x, y) => (Math.cos(Math.min(Math.sqrt(x * x + y * y), 1)) - cos1) / (1 - cos1);
let sphere: ProfileFun = (x, y) => Math.sqrt(1 - x * x - y * y) || 0;
// let test: ProfileFun = (x, y) => Math.abs(x) < 0.25 && Math.abs(y) < 0.25 ? 1 : 0;

export const isActive = store(false);
const selectedDragMode = store(1);
export const dragMode = compute<number, DragMode>(selectedDragMode, i => (["none", "apply", "move"] satisfies DragMode[])[i]);
export const sensitivity = store(3);
export const brushWidth = store(120);
const brushLengthInput = store(8);
const squareAspectRatio = store(true);
export const brushLength = compute(brushWidth, brushLengthInput, squareAspectRatio, (w, l, s) => s ? w : l);
const selectedBrushMode = store(1);
export const brushMode = compute<number, BrushMode>(selectedBrushMode, i => (["absolute", "relative"] satisfies BrushMode[])[i]);
export const profileFun = store<ProfileFun>(volcano);

const flatId = ui.imageManager.allocate(1)?.start || 0; // TODO: catch error
const data = new Uint8Array(40 * 40);
for (let x = 0; x < 40; x++) {
    let z = (x < 4 || x >= 36) ? 0 : profileFun.get()(-31 / 32 + (x - 4) / 16, 0);
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

ui.imageManager.setPixelData(flatId, {
    type: "raw",
    width: 40,
    height: 40,
    data: data,
});

const win = window({
    title: "WorldPainter",
    width: 384,
    height: "auto",
    content: [
        groupbox({
            text: "General settings",
            content: [
                horizontal({
                    content: [
                        label({
                            text: "Drag mode:",
                        }),
                        dropdown({
                            items: [
                                "click to apply",
                                "click and drag to apply",
                                "click to apply, drag to move",
                            ],
                            selectedIndex: twoway(selectedDragMode),
                            width: "2w",
                        }),
                    ],
                }),
                horizontal({
                    content: [
                        label({
                            text: "Sensitivity:",
                        }),
                        spinner({
                            minimum: 0,
                            maximum: 10,
                            value: twoway(sensitivity),
                            width: "2w",
                        }),
                    ],
                }),
            ],
        }),
        groupbox({
            text: "Brush settings",
            content: [
                horizontal({
                    content: [
                        label({
                            text: "Width:",
                        }),
                        spinner({
                            minimum: 1,
                            value: twoway(brushWidth),
                            width: "1w",
                        }),
                        label({ text: "", width: "0.5w", }),
                        checkbox({
                            text: "1:1 aspect ratio",
                            isChecked: twoway(squareAspectRatio),
                            width: "2w",
                        }),
                    ],
                }),
                horizontal({
                    content: [
                        label({
                            text: "Length:",
                            disabled: squareAspectRatio,
                        }),
                        spinner({
                            minimum: 1,
                            value: twoway(brushLengthInput),
                            width: "1w",
                            disabled: squareAspectRatio,
                        }),
                        label({ text: "", width: "0.5w", }),
                        button({
                            text: "flip",
                            onClick: () => {
                                const width = brushWidth.get();
                                brushWidth.set(brushLengthInput.get());
                                brushLengthInput.set(width);
                            },
                            height: 14,
                            width: "2w",
                            disabled: squareAspectRatio,
                        }),
                    ],
                }),
                horizontal({
                    content: [
                        label({
                            text: "Width:",
                            width: "2w",
                        }),
                        spinner({
                            minimum: 0,
                            value: twoway(brushWidth),
                            width: "2w",
                        }),
                        label({ text: "", width: "0.5w", }),
                        button({
                            text: "<->",
                            onClick: () => {
                                const width = brushWidth.get();
                                brushWidth.set(brushLengthInput.get());
                                brushLengthInput.set(width);
                            },
                            height: 14,
                            width: "1w",
                            disabled: squareAspectRatio,
                        }),
                        label({ text: "", width: "0.5w", }),
                        label({
                            text: "Length:",
                            disabled: squareAspectRatio,
                            width: "2w",
                        }),
                        spinner({
                            minimum: 0,
                            value: twoway(brushLengthInput),
                            width: "2w",
                            disabled: squareAspectRatio,
                        }),
                        label({ text: "", width: "0.5w", }),
                        checkbox({
                            text: "1:1",
                            isChecked: twoway(squareAspectRatio),
                            width: "1w",
                        }),
                    ],
                }),
                horizontal({
                    content: [
                        label({
                            text: "Brush mode:",
                        }),
                        dropdown({
                            items: [
                                "absolute",
                                "relative",
                            ],
                            selectedIndex: twoway(selectedBrushMode),
                            width: "2w",
                        }),
                    ],
                }),
            ],
        }),
        button({
            width: 40,
            height: 40,
            image: flatId,
        }),
    ],
    onOpen: () => isActive.set(true),
    onClose: () => isActive.set(false),
});
isActive.subscribe(value => value ? win.open() : win.close());

export function open(): void {
    win.open();
}

export function close(): void {
    win.close();
}