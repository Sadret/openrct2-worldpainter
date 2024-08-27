# OpenRCT2 WorldPainter plugin

An OpenRCT2 plugin to easily modify the terrain and create appealing landscapes.

## Features
- Create hills and valleys with a single mouse click
- Choose between several different mountain shapes
- Make the surface smooth, flat or rough
- Change the shape, size and rotation of the landscaping tool you are using

## Installation

1. Make sure that your OpenRCT2 version is not too old. You need at least version `0.4.6` (released Sep 3, 2023) or a recent development version.
2. Go to the [releases](https://github.com/Sadret/openrct2-worldpainter/releases) page and download the `openrct2-worldpainter-?.?.?.js` file from the latest release, where `?.?.?` is the version number. Save it in the `plugin` subfolder of your OpenRCT2 user directory.\
On Windows, this is usually at `C:Users\{User}\Documents\OpenRCT2\plugin`.
3. Start OpenRCT2 and open a scenario.

Make sure to always only have one worldpainter version in your plugin folder at all times.

## Usage

To open the plugin, click on the map icon in the top left toolbar and select "WorldPainter", which opens the plugin's window. Now, if you click into the game world and hold the mouse button down, a mountain will appear in the highlighted area around the mouse cursor.

Restrictions to modify terrain apply as usual. That is, the target area must be unobstructed by scenery, paths, rides and so on and you must have enough money available to perform the landscaping action. You can disable clearance checks and money through cheats if you want to circumvent this.

The plugin is fully functional to use on multiplayer servers, but make sure to have landscaping permissions.

## The plugin window

#### Tool shape
You can select between square, circle and diamond tool shapes.

#### Tool size and rotation
You can change the size of the area affected by the tool. By default, the width and the length are the same, which can be disabled by clicking the link button between the width and length spinners. Additionally, you can rotate the area.

#### Tool types
You can select between three different tool types.
- Brush: Click and hold down the mouse button. A mountain will appear in the highlighted area around the mouse cursor. You can drag the mouse cursor around to change the affected area.
- Sculpt: Click and hold down the mouse button. Move the cursor up or down to create a mountain or valley of the desired height.
- Special: A collection of special tools. They are applied similar to the brush.

#### Tool settings
The brush and special tools share these settings:
- Sensitivity: Increase the sensitivity to apply the brush more often per second.
- Direction: Choose if the terrain should be raised or lowered when the tool is applied.

The brush and sculpt tools can work in one of these three modes:
- Relative: Adds a mountain shape to the existing terrain.
- Absolute: Creates a mountain shape, ignoring already existing terrain. (disabled for brush).
- Plateau: Raises or lowers surrounding terrain to the surface height at the position of the cursor.

The special tool can work in one of these three modes:
- Smooth: Raises or lowers the terrain to remove vertical faces.
- Flat: Raises or lowers the terrain to flatten the surface.
- Rough: Raises random corners of the surface.

#### Mountain shape
The brush and sculpt tools can create mountains and valleys of various shapes.

## Planned Features

Subscribe to my YouTube channel to learn about upcoming features:
[Sadret Gaming / @sadret](https://www.youtube.com/@sadret)

## Support Me

If you find any bugs or if you have any ideas for improvements, you can open an issue on GitHub or contact me on Discord: Sadret#2502.

If you like this plugin, please leave a star on GitHub.

If you really want to support me, you can buy me a coffee:
- [Paypal](https://paypal.me/SadretGaming): no fees if send to "Friends and Family"
- [ko-fi](https://ko-fi.com/sadret): with credit card or via PayPal, no fee
- [buymeacoffee](https://www.BuyMeACoffee.com/SadretGaming): with credit card or via Link, 5% fee

## Copyright and License

Copyright (c) 2024 Sadret\
The OpenRCT2 plugin "WorldPainter" is licensed under the GNU General Public License version 3.\
This plugin uses OpenRCT2-FlexUI by Basssiiie which is licensed under the MIT License.