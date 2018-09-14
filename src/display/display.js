import { getGlyphDimensions, getWindowDimensions, defineSize } from './size.js';
import { has } from '../utils.js';

/**
 * Displays content on screen.
 */
class Display {
    /**
     * Creates an instance of Display.
     * @param {string} [nodeName='displayer'] - The DOM node's id in which the display will be append.
     * @param {Object} [options] - if given, automatically initializes the display with these options, see {@link Displayer#init} for properties.
     */
    constructor(nodeName='display', options) {
        this.nodeName = nodeName;
        this.elems = [];

        this.margin = {x: 0, y: 0};
        this.padding = {x: 0, y: 0};
        this.size = {width: 0, height: 0};

        if (options) this.init(options);
    }

    /**
     * initialize the display.
     * @param {Object} [options] - Options to initialize the display
     */
    init(options) {
        if (has(options, 'margin')) this.margin = options.margin;
        if (has(options, 'padding')) this.padding = options.padding;
        this.glyph = getGlyphDimensions(this.nodeName);
        this.screen = getWindowDimensions(this.glyph, this.margin);

        try {
            this.size = defineSize(this.screen,this.glyph, options);
        } catch (error) {
            throw error;
        }

        // Allows chaining
        return this;
    }

}

export default Display;
