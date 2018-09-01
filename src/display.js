import { getGlyphDimensions, getWindowDimensions } from './utils.js';

/**
 * Displays content on screen.
 */
class Displayer {
    /**
     * Creates an instance of Displayer.
     * @param {string} [nodeName='displayer'] - The DOM node's id in which the displayer will be append.
     * @param {Object} [opts] - if given, automatically initializes the display with these options, see {@link Displayer#init} for properties.
     */
    constructor(nodeName='displayer', opts) {
        this.nodeName = nodeName;
        this.lines = [];

        this.margin = {x: 0, y: 0};
        this.padding = {x: 0, y: 0};

        if (opts) this.init(opts);
    }

    /**
     * initialize the displayer.
     * @param {Object} [opts] - Options to initialize the display
     * @param {Object} [opts.margin] - The number of glyphs between the screen's edges and the displayer
     * @param {Object} [opts.padding] - The number of glyphs between the displayer's edges and the content
     * @param {Object} [opts.displayer] - Options to define displayer size on screen
     */
    init({margin = this.margin, padding = this.padding, displayer} = {}) {
        this.margin = margin;
        this.padding = padding;

        this.glyph = getGlyphDimensions(this.nodeName);
        this.screen = getWindowDimensions(this.glyph);
    }

}

export default Displayer;
