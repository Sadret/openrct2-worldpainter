import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "./src/main.ts",
	output: {
		format: "iife",
		file: "./build/openrct2-worldpainter-1.0.0.js",
	},
	plugins: [
		resolve(),
		typescript(),
		terser({
			format: {
				preamble: "\
// Copyright (c) 2024 Sadret\n\
// This software is licensed under the GNU General Public License version 3.\n\
// This software uses OpenRCT2-FlexUI by Basssiiie which is licensed under the MIT License.\n\
// The full text of these licenses can be found here: https://github.com/Sadret/openrct2-worldpainter\
				",
			},
		}),
	],
};
