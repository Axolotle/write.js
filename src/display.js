import { getGlyphDimensions, getWindowDimensions, has } from './utils.js';
import { longestWord } from './format.js'

/**
 * Displays content on screen.
 */
class Display {
    /**
     * Creates an instance of Display.
     * @param {string} [nodeName='displayer'] - The DOM node's id in which the display will be append.
     * @param {Object} [opts] - if given, automatically initializes the display with these options, see {@link Displayer#init} for properties.
     */
    constructor(nodeName='display', opts) {
        this.nodeName = nodeName;
        this.lines = [];

        this.margin = {x: 0, y: 0};
        this.padding = {x: 0, y: 0};

        if (opts) this.init(opts);
    }

    /**
     * initialize the display.
     * @param {Object} [opts] - Options to initialize the display
     * @param {Object} [opts.size] - Fixed size or options to define display size on screen
     * @param {Object} [opts.margin] - The number of glyphs between the screen's edges and the display
     * @param {Object} [opts.padding] - The number of glyphs between the display's edges and the content
     */
    init({size, margin = this.margin, padding = this.padding} = {}) {
        this.margin = margin;
        this.padding = padding;


        this.glyph = getGlyphDimensions(this.nodeName);
        this.screen = getWindowDimensions(this.glyph, this.margin);

        if (has(size, "width") && has(size, "height")) {
            this.size = size;
        } else {
            try {
                this.size = this.defineSize(size, this.margin, this.padding);
            } catch (error) {
                throw error;
            }

        }

        // Allows chaining
        return this;
    }

    defineSize(
        {
            maxWidth = this.screen.width,
            maxHeight = this.screen.height,
            minWidth = this.padding.x * 2,
            minHeight = this.padding.y * 2,
            longestText
        } = {}
    ) {

        function fromText(txt, width) {
            var height = paddY;
            var actualWidth = paddX;

            for (const words of txt) {
                actualWidth = paddX;
                height++;
                for (const word of words) {
                    if (height > max.height) {
                        if (width <= max.width) return fromText(words, width + 1);
                        else throw error;
                    }

                    let wordLen = word.length;
                    let nextWidth = actualWidth === paddX ? wordLen : actualWidth + 1 + wordLen;

                    if (nextWidth <= max.width) {
                        actualWidth = nextWidth;
                    } else {
                        actualWidth = wordLen;
                        height++;
                    }
                }
            }

            return {width: width, height: height};
        }
        const paddX = this.padding.x * 2;
        const paddY = this.padding.y * 2;

        const max = {
            width: maxWidth < this.screen.width ? maxWidth : this.screen.width,
            height: maxHeight < this.screen.height ? maxHeight : this.screen.height,
        };
        const min = {
            width: minWidth < this.padding.x * 2 ? this.padding.x * 2 : minWidth,
            height: minHeight < this.padding.y * 2 ? this.padding.y * 2 : minHeight,
        };

        const error = new Error("Screen too small");
        if (max.width < min.width || max.height < min.height) throw error;

        if (longestText) {
            let txt = Array.isArray(longestText) ? longestText : longestText.split("\n");
            txt = txt.map(line => line.split(" "));
            let longestLen = longestWord(txt.map(words => longestWord(words))).length;

            if (longestLen > maxWidth) throw error;
            if (longestLen > minWidth) return fromText(txt, longestLen);
            else return fromText(txt, minWidth);
        }

    }

}

export default Display;
