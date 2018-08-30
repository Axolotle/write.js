/**
 * Displayer module.
 * @module writejs/display
 * @author Nicolas Chesnais
 * @license GPL-3.0
 * @version 1.0
 */

import { getGlyphDimensions, getWindowDimensions } from "./utils.js";


/**
 * Displays content on screen.
 * @constructor
 * @param {Object} opts - display options
 */
export default function Display(opts) {
    // Define base information
    this.glyph = { x: undefined, y: undefined };
    this.screen = { x: undefined, y: undefined };
    this.size = { x: undefined, y: undefined };

    this.margin = { x: 0, y: 0 };
    this.padding = { x: 0, y: 0 };

    this.divName = undefined;
    this.lines = [];
}
