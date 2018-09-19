import { getGlyphDimensions, getWindowDimensions, defineSize } from './size.js';
import { has } from '../utils.js';

/**
 * Displays content on screen.
 */
class Display {
    /**
     * Creates an instance of Display.
     * @param {string} [nodeName='displayer'] - The DOM node's id in which the display will be append.
     * @param {Object} [options] - if given, automatically initializes the display with these options, see {@link Display#init} for properties.
     */
    constructor(nodeName='display', options) {
        this.nodeName = nodeName;
        this.elems = [];

        this.margin = {x: 0, y: 0};
        this.padding = {x: 0, y: 0};

        if (options) this.init(options);
    }

    /**
     * initialize the display.<br>
     * Use the {@link Display#draw} or {@link Display#display} method to print the display on the window.
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
        var node = document.getElementById(this.nodeName);

        for (const line of box) {
            let elem = document.createElement('p');
            elem.textContent = line;
            this.elems.push(elem);
            fragment.appendChild(elem);
        }
        node.appendChild(fragment);
    }

    /**
     * Animates the printing of the display on the window.<br>
     * Begins from an existing box or appends a new one.
     * @param {number} [duration] - duration of the animation in milliseconds.
     * @return {Promise} - Promise that resolves when animation is over.
     */
    draw(duration=300) {
        return new Promise ((resolve, reject) => {
            function animate(timeStamp) {
                if (start === null) start = timeStamp;
                var raf = requestAnimationFrame(animate);
                var progress = timeStamp - start;
                // Defines how many glyphs and lines has to be added/removed for this frame.
                var stepW = Math.ceil((progress / frameW) - nowW);
                var stepH = Math.ceil((progress / frameH) - nowH);

                if (stepW !== 0) {
                    // Readjusts the add variable if the progress has gone too far.
                    if ((stepW > 0 && nowW + stepW > totalW) || (stepW < 0 && nowW + stepW < totalW)) {
                        stepW = totalW - nowW;
                    }
                    nowW += stepW;
                    let limit = _this.elems[0].textContent.length - 1;
                    let i = _this.elems.length - 1;

                    if (stepW > 0) {
                        let empty = ' '.repeat(stepW);
                        let stroke = '─'.repeat(stepW);
                        for (let line; line = _this.elems[i]; i--) {
                            let txt = line.textContent;
                            let adder = i === 0 || i === _this.elems.length - 1 ? stroke : empty;
                            line.textContent = txt.slice(0, limit) + adder + txt.slice(limit);
                        }
                    } else if (stepW < 0) {
                        for (let line; line = _this.elems[i]; i--) {
                            let txt = line.textContent;
                            line.textContent = txt.slice(0, limit + stepW) + txt.slice(limit);
                        }
                    }
                }

                if (stepH !== 0) {
                    // Readjusts the add variable if the progress has gone too far.
                    if ((stepH > 0 && nowH + stepH > totalH) || (stepH < 0 && nowH + stepH < totalH)) {
                        stepH = totalH - nowH;
                    }
                    nowH += stepH;

                    if (stepH > 0) {
                        var extra = `│${' '.repeat(_this.elems[0].textContent.length - 2)}│`;
                        for (; stepH > 0; stepH--) {
                            let elem = document.createElement('p');
                            elem.textContent = extra;
                            node.insertBefore(elem, node.lastChild);
                            _this.elems.splice(_this.elems.length - 1, 0, elem);
                        }
                    } else if (stepH < 0) {
                        for (; stepH < 0; stepH++) {
                            node.lastChild.previousElementSibling.remove();
                            _this.elems.splice(_this.elems.length - 2, 1);
                        }
                    }
                }

                if (nowH === totalH && nowW === totalW) {
                    cancelAnimationFrame(raf);
                    resolve();
                }
            }

            const _this = this;
            var node = document.getElementById(this.nodeName);

            if (this.elems.length === 0) {
                var top = document.createElement('p');
                var bottom = document.createElement('p');
                top.textContent = '┌┐';
                bottom.textContent = '└┘';
                node.appendChild(top);
                node.appendChild(bottom);
                this.elems.push(top, bottom);
            }

            var nowW = 0;
            var nowH = 0;
            var totalW = this.totalWidth - this.elems[0].textContent.length;
            var totalH = this.totalHeight - this.elems.length;
            var frameW = duration / totalW;
            var frameH = duration / totalH;
            var start = null;

            var check = performance.now();

            requestAnimationFrame(animate);
        });

    }

    /**
     * Erase all display content by printing a new empty box.
     */
    reset() {
        var box = createBox(this.totalWidth, this.totalHeight);
        this.elems.forEach((elem, i) => {
            elem.textContent = box[i];
        });
    }

    /**
     * Remove display content from document.
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
    print(txt, startY=0, startX=0, overwrite=false) {
        if (!Array.isArray(txt)) txt = [txt];
        if (!overwrite) {
            startY += this.padding.y;
            startX += this.padding.x;
        }

        for (let line of txt) {
            let prevTxt = this.elems[startY].textContent;
            let newLine = prevTxt.slice(0, startX) + line + prevTxt.slice(startX + line.length);
            this.elems[startY].textContent = newLine;
            if (startX !== this.padding.x) startX = this.padding.x;
            startY++;
        }
    }

    /**
     * Erase specified lines inside the display.
     * @param {number} [startY=0] - Y coordinate of the line that have to be erased.
     * @param {number} [endY=startY] - if specified, erase all lines between startY and endY.
     */
    cleanLines(startY, endY=startY) {
        startY += this.padding.y;
        endY += this.padding.y;
        var emptyLine = `│${' '.repeat(this.totalWidth - 2)}│`;

        for (startY; startY <= endY; startY++) {
            this.elems[startY].textContent = emptyLine;
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
