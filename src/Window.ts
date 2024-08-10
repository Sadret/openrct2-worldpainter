/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plug-in "WorldPainter" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

import { button, compute, FlexiblePosition, graphics, groupbox, horizontal, label, spinner, store, twoway, WidgetCreator, window, WritableStore, type ButtonParams, type GraphicsParams, type Store } from "openrct2-flexui";
import { createImage } from './Images';
import * as Profiles from "./Profiles";
import type { BrushDirection, SpecialMode, ToolMode, ToolShape, ToolType } from "./types";

/*
 * TYPES
 */

type ToolProfile = keyof typeof Profiles;
type ImageName = Parameters<typeof createImage>[0];

/*
 * UI HELPER FUNCTIONS
 */

function tooltipOf(str: string): string {
    switch (str) {
        // tool types
        case "brush": return "Brush (click and hold to apply, drag around to change the affected area)";
        case "sculpt": return "Sculpt (click and hold to activate, drag up and down to change the height)";
        case "special": return "Special (click and hold to apply, drag around to change the affected area)";

        // brush direction
        case "up": return "Create a hill";
        case "down": return "Create a valley";

        // tool mode
        case "relative": return "Relative (add mountain shape to existing terrain)";
        case "absolute": return "Absolute (create mountain shape, ignoring existing terrain)";
        case "plateau": return "Plateau (raise or lower surrounding terrain to cursor height)";

        // special mode
        case "smooth": return "Smooth (raise or lower terrain to remove vertical faces)";
        case "flat": return "Flat (raise or lower terrain to flatten the surface)";
        case "rough": return "Rough (raise random corners of the surface)";
    }
    const temp = str.replace(/_/g, " ");
    return temp.charAt(0).toUpperCase() + temp.slice(1);
}

function graphicsOf(name: ImageName, params: GraphicsParams = {}): WidgetCreator<FlexiblePosition> {
    const image = createImage(name);
    return graphics({
        ...params,
        ...image,
        onDraw: g => g.image(image.image, 0, 0),
    });
}

function buttonOf<T extends ImageName | ToolProfile>(value: T, store: WritableStore<T>, params: ButtonParams = {}): WidgetCreator<FlexiblePosition> {
    return button({
        ...params,
        ...createImage(value),
        tooltip: tooltipOf(value),
        onClick: () => store.set(value),
        isPressed: compute(store, active => active === value),
    });
}

function center(content: WidgetCreator<FlexiblePosition>[]): WidgetCreator<FlexiblePosition> {
    return horizontal({
        width: "100%",
        spacing: "1w",
        content: content,
    });
}

/*
 * SETTINGS VALUES
 */

const toolShapes: ToolShape[] = ["square", "circle", "diamond"];
const toolTypes: ToolType[] = ["brush", "sculpt", "special"];
const toolModes: ToolMode[] = ["relative", "absolute", "plateau"];
const brushDirections: BrushDirection[] = ["up", "down"];
const specialModes: SpecialMode[] = ["smooth", "flat", "rough"];
const standardProfiles: ToolProfile[] = ["block", "cone", "bell", "sphere"];
const cubicProfiles: ToolProfile[] = ["cubic_1", "cubic_2", "cubic_3", "cubic_4", "cubic_5"];

/*
 * SETTINGS STORES
 */

export const isActive = store(false);

export const toolShape = store<ToolShape>("circle");

export const toolWidth = store(12);
const squareAspectRatio = store(true);
export const toolLength = store(toolWidth.get());
export const toolRotation = store(0);

export const toolType = store<ToolType>("brush");

export const toolMode = store<ToolMode>("relative");
export const brushSensitivity = store(3);
export const brushDirection = store<BrushDirection>("up");
export const specialMode = store<SpecialMode>("smooth");

export const toolProfile = store<ToolProfile>("cubic_3");

const not = (store: Store<boolean>) => compute(store, value => !value);
const and = (store1: Store<boolean>, store2: Store<boolean>) => compute(store1, store2, (value1, value2) => value1 && value2);
const or = (store1: Store<boolean>, store2: Store<boolean>) => compute(store1, store2, (value1, value2) => value1 || value2);
const visibilityIf = (store: Store<boolean>) => ({ visibility: compute(store, value => value ? "visible" : "none") });
function equals<T>(store: Store<T>, val: T): WritableStore<boolean> { return compute(store, value => value === val); }

const sensitivityEnabled = or(equals(toolType, "brush"), and(equals(toolType, "special"), equals(specialMode, "smooth")));
const directionDisabled = or(equals(toolType, "sculpt"), and(equals(toolType, "special"), equals(specialMode, "rough")));

compute(toolType, type => type === "brush" && toolMode.get() === "absolute" && toolMode.set("relative"));
compute(toolWidth, squareAspectRatio, (width, square) => square && toolLength.set(width));

/*
 * WINDOW INITIALISATION
 */

export function init(): void {
    const win = window({
        title: "WorldPainter (beta-1)",
        width: 258,
        height: "auto",
        colours: [24, 24],
        content: [
            groupbox({
                text: "Tool shape",
                content: [
                    center(toolShapes.map(shape => buttonOf(shape, toolShape))),
                ],
            }),
            groupbox({
                text: "Tool size and rotation",
                content: [
                    horizontal({
                        content: [
                            graphicsOf("size"),
                            spinner({
                                minimum: 2,
                                value: twoway(toolWidth),
                                tooltip: "Width of the tool",
                            }),
                            button({
                                ...createImage("link"),
                                onClick: () => squareAspectRatio.set(!squareAspectRatio.get()),
                                isPressed: squareAspectRatio,
                                height: 14,
                                tooltip: "Activate to have equal width and length",
                            }),
                            spinner({
                                minimum: 2,
                                value: twoway(toolLength),
                                disabled: squareAspectRatio,
                                tooltip: "Length of the tool",
                            }),
                            graphicsOf("rotation"),
                            spinner({
                                value: twoway(toolRotation),
                                step: 5,
                                format: v => `${v}°`,
                                tooltip: "Rotation of the tool",
                            }),
                        ],
                    }),
                ],
            }),
            groupbox({
                text: "Tool type",
                content: [
                    center(toolTypes.map(type => buttonOf(type, toolType))),
                ],
            }),
            groupbox({
                text: "Tool settings",
                content: [
                    horizontal({
                        content: [
                            graphicsOf("sensitivity", visibilityIf(sensitivityEnabled)),
                            graphicsOf("sensitivity_disabled", visibilityIf(not(sensitivityEnabled))),
                            spinner({
                                disabled: not(sensitivityEnabled),
                                minimum: 0,
                                maximum: 10,
                                value: twoway(brushSensitivity),
                                tooltip: "Sensitivity (increase to apply the brush more often per second)",
                            }),
                            ...brushDirections.map(direction => buttonOf(direction, brushDirection, { disabled: directionDisabled, })),
                        ],
                    }),
                    center(toolModes.map(mode => buttonOf(mode, toolMode, {
                        ...visibilityIf(not(equals(toolType, "special"))),
                        disabled: mode === "absolute" ? equals(toolType, "brush") : false,
                    }))),
                    center(specialModes.map(mode => buttonOf(mode, specialMode, visibilityIf(equals(toolType, "special"))))),
                ],
            }),
            groupbox({
                text: "Mountain shape",
                ...visibilityIf(not(equals(toolType, "special"))),
                content: [standardProfiles, cubicProfiles].map(profileList =>
                    horizontal({
                        content: profileList.map(profile => buttonOf(profile, toolProfile, visibilityIf(not(equals(toolType, "special"))))),
                    }),
                ),
            }),
            label({
                text: "Copyright (c) 2024 Sadret",
                disabled: true,
                alignment: "centred",
            }),
        ],
        onOpen: () => isActive.set(true),
        onClose: () => isActive.set(false),
    });

    isActive.subscribe(value => value ? win.open() : win.close());
}
