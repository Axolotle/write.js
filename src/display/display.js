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
            ({
                width: this.width,
                height: this.height
            } = defineSize(this.screen, this.glyph, options));
            this.totalWidth = this.width + this.padding.x * 2;
            this.totalHeight = this.height + this.padding.y * 2;
        } catch (error) {
            throw error;
        }

        // Allows chaining
        return this;
    }

    /**
     * Append a clean box to the node element.
     */
    display() {
        var box = createBox(this.totalWidth, this.totalHeight);
        var fragment = document.createDocumentFragment();
        var div = document.getElementById(this.nodeName);

        for (const line of box) {
            let elem = document.createElement('p');
            elem.textContent = line;
            this.elems.push(elem);
            fragment.appendChild(elem);
        }
        div.appendChild(fragment);
    }

    /**
     * Erase all display content by printing a new empty box
     */
    reset() {
        var box = createBox(this.totalWidth, this.totalHeight);
        this.elems.forEach((elem, i) => {
            elem.textContent = box[i];
        });
    }

    /**
     * Remove display content from document
     */
    remove() {
        var display = document.getElementById(this.nodeName);
        while (display.lastChild) {
            display.lastChild.remove();
        }
        this.elems = [];
    }

    /**
     * Print some string(s) on the display.
     * @param {(string|string[])} txt - a single string with or without '\n' or an array of strings.
     * @param {number} [startY=0] - Y coordinate at witch the print has to start.
     * @param {number} [startX=0] - X coordinate at witch the print has to start.
     */
    print(txt, startY = 0, startX = 0) {
        if (!Array.isArray(txt)) txt = [txt];
        for (let line of txt) {
            let prevTxt = this.elems[startY + this.padding.y].textContent;
            let newLine = prevTxt.slice(0, startX + this.padding.x) + line + prevTxt.slice(startX + this.padding.x + line.length);
            this.elems[startY + this.padding.y].textContent = newLine;
            if (startX !== 0) startX = 0;
            startY++;
        }
    }
}

function createBox(width, height) {
    var lines = '─'.repeat(width - 2);
    var spaces = `│${' '.repeat(width - 2)}│`;
    var box = [];

    for (let n = 0; n < height; n++) {
        if (n === 0) box.push(`┌${lines}┐`);
        else if (n === height - 1) box.push(`└${lines}┘`);
        else box.push(spaces);
    }
    return box;
}

export default Display;
