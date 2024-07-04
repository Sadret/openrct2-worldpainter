/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { button, checkbox, compute, dropdown, groupbox, horizontal, label, spinner, store, twoway, window } from "openrct2-flexui";
import { BrushMode, DragMode, ProfileFun } from './types';
import { crater, createImage, flat, gauss, inverted, sine, sine2, sineCap, sphere, volcano } from "./profiles";

export const isActive = store(false);
const selectedDragMode = store(1);
export const dragMode = compute<number, DragMode>(selectedDragMode, i => (["none", "apply", "move"] satisfies DragMode[])[i]);
export const sensitivity = store(3);
export const brushWidth = store(40);
const brushLengthInput = store(8);
const squareAspectRatio = store(true);
export const brushLength = compute(brushWidth, brushLengthInput, squareAspectRatio, (w, l, s) => s ? w : l);
const selectedBrushMode = store(1);
export const brushMode = compute<number, BrushMode>(selectedBrushMode, i => (["absolute", "relative"] satisfies BrushMode[])[i]);
export const profileFun = store<ProfileFun>(flat);

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
        horizontal({
            content: [flat, gauss, volcano, sine, sineCap, sphere, sine2, crater].map(
                profile => button({
                    width: 40,
                    height: 40,
                    image: createImage(profile),
                    onClick: () => profileFun.set(profile),
                }),
            ),
        }),
        horizontal({
            content: [flat, gauss, volcano, sine, sineCap, sphere, sine2, crater].map(profile => inverted(profile)).map(
                profile => button({
                    width: 40,
                    height: 40,
                    image: createImage(profile),
                    onClick: () => profileFun.set(profile),
                    disabled: compute(dragMode, mode => mode === "apply"),
                }),
            ),
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