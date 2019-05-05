/**
 * Moon MVL v1.0.0-beta.2
 * Copyright 2016-2019 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */
'use strict';

/**
 * Slash
 * Fast, efficient hash
 * Copyright 2017-2018 Kabir Shah
 * Released under the MIT License
 */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "xhl|xhh" }] */
var box = [158, 163, 200, 235, 223, 47, 250, 35, 101, 191, 5, 132, 161, 71, 142, 18, 7, 133, 176, 253, 246, 207, 117, 233, 138, 92, 74, 16, 187, 10, 91, 249, 94, 210, 80, 167, 13, 136, 202, 150, 62, 126, 160, 162, 186, 22, 108, 124, 112, 21, 232, 14, 148, 127, 218, 143, 214, 220, 39, 57, 190, 144, 159, 130, 88, 2, 154, 242, 81, 24, 111, 147, 66, 54, 238, 28, 37, 63, 45, 153, 169, 102, 208, 247, 226, 48, 79, 27, 183, 145, 184, 228, 180, 89, 56, 20, 11, 170, 40, 84, 152, 198, 55, 103, 237, 221, 178, 174, 8, 29, 90, 122, 205, 155, 12, 67, 30, 96, 243, 43, 254, 26, 44, 15, 193, 251, 59, 4, 78, 129, 137, 31, 203, 1, 219, 70, 181, 236, 157, 72, 225, 104, 194, 222, 53, 0, 241, 85, 131, 192, 6, 9, 114, 46, 248, 95, 240, 121, 128, 244, 239, 107, 19, 201, 25, 149, 116, 105, 34, 175, 76, 224, 146, 51, 139, 41, 75, 204, 52, 23, 171, 68, 196, 164, 50, 77, 245, 229, 134, 106, 252, 217, 115, 33, 188, 97, 61, 227, 86, 87, 82, 32, 166, 17, 98, 93, 60, 231, 140, 172, 125, 195, 212, 206, 73, 177, 3, 69, 58, 199, 118, 141, 209, 197, 109, 173, 123, 211, 135, 189, 151, 110, 213, 83, 38, 113, 216, 119, 179, 99, 36, 42, 120, 255, 185, 64, 168, 230, 49, 234, 165, 65, 156, 215, 182, 100];

function multiply(x, y) {
	var x1 = x >> 16 & 0xFFFF;
	var x2 = x & 0xFFFF;
	var x3 = y >> 16 & 0xFFFF;
	var x4 = y & 0xFFFF;
	var x2x4 = x2 * x4 & 0xFFFFFFFF;
	var x1x4 = x1 * x4 & 0xFFFFFFFF;
	var x2x3 = x2 * x3 & 0xFFFFFFFF;
	var xll = x2x4 & 0xFFFF;
	var xlh = (x1x4 & 0xFFFF) + (x2x4 >> 16 & 0xFFFF) + (x2x3 & 0xFFFF);
	return xll + ((xlh & 0xFFFF) << 16);
}

function combine(result, current) {
	result = result ^ current;
	return result;
}

function mix(result) {
	result = box[result & 0xFF] | box[result >> 8 & 0xFF] << 8 | box[result >> 16 & 0xFF] << 16 | box[result >> 24 & 0xFF] << 24;
	result = multiply(result, 0xA78E6263);
	result = result ^ result >> 24;
	result = multiply(result, 0xA7D52847);
	return result;
}

var slash = (function (key) {
	var result = 0;
	var length = 0;

	for (; length < key.length; length += 4) {
		result = combine(result, key.charCodeAt(length + 3) << 24 | key.charCodeAt(length + 2) << 16 | key.charCodeAt(length + 1) << 8 | key.charCodeAt(length));
		result = mix(result);
		result = result >>> 0;
	}

	switch (key.length - length) {
		case 3:
			combine(result, key.charCodeAt(length + 2) << 16);

		case 2:
			combine(result, key.charCodeAt(length + 1) << 8);

		case 1:
			combine(result, key.charCodeAt(length));
	}

	result = mix(result);
	result = result >>> 0;
	return result.toString(36);
});

var cssRE = /([^,:{}]+)(,|:[^,:{}+]+|{[^{}]+})/g;
var trailingWhitespaceRE = /\s*$/;
function addClass(element, name) {
	var attributes = element.attributes;
	var children = element.children;
	var className = attributes["class"];

	if (className === undefined) {
		attributes["class"] = "\"" + name + "\"";
	} else if (className[0] === "\"" || className[0] === "'") {
		attributes["class"] = "" + className[0] + name + " " + className.slice(1);
	} else {
		attributes["class"] += " + \" " + name + "\"";
	}

	for (var i = 0; i < children.length; i++) {
		module.exports.addClass(children[i], name);
	}
}
function scopeCSS(scope, css) {
	return css.replace(cssRE, function (match, selector, rule) {
		return selector.replace(trailingWhitespaceRE, "") + "." + scope + rule;
	});
}

var Moon = require("moon");

var scriptRE = /((?:.|\n)*?)<script>((?:.|\n)*)<\/script>((?:.|\n)*)/;
var styleRE = /((?:.|\n)*?)<style>((?:.|\n)*)<\/style>((?:.|\n)*)/;

module.exports = function (name, input, hot) {
	var inputJS = null;
	var inputCSS = null;
	input = input.replace(scriptRE, function (match, prefix, script, suffix) {
		inputJS = script;
		return prefix + suffix;
	});
	input = input.replace(styleRE, function (match, prefix, style, suffix) {
		inputCSS = style;
		return prefix + suffix;
	});
	var tree = Moon.parse(input);
	var outputJS;
	var outputCSS = null;

	if (inputCSS !== null) {
		var scope = "moon-" + slash(name);
		addClass(tree, scope);
		outputCSS = scopeCSS(scope, inputCSS);
	}

	if (inputJS === null) {
		outputJS = "const _moonOptions={};";
	} else {
		outputJS = inputJS.replace("export default", "const _moonOptions=");
	}

	outputJS = "import Moon from \"moon\";" + outputJS + "_moonOptions.name=\"" + name + "\";_moonOptions.view=function(m,data){" + Moon.generate(tree) + "};Moon(_moonOptions);";

	if (hot) {
		outputJS = "\n\t\t\timport { registerCSS } from \"moon-mvl/lib/hot\";\n\n\t\t\tconst _moonRemoveCSS = registerCSS(`" + outputCSS + "`);\n\n\t\t\tif (module.hot) {\n\t\t\t\tmodule.hot.dispose(() => {\n\t\t\t\t\tMoon.set({});\n\n\t\t\t\t\t_moonRemoveCSS();\n\t\t\t\t});\n\t\t\t}\n\t\t";
		outputCSS = null;
	}

	return {
		js: outputJS,
		css: outputCSS
	};
};
