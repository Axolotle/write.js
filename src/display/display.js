import { getGlyphDimensions, getWindowDimensions, defineSize } from './size.js';
import { has } from '../utils.js';
import { splitParse, cutHTML } from "../parser/parser.js";

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
        this.elem = document.getElementById(nodeName);
        this.margin = {x: 0, y: 0};
        this.padding = {x: 0, y: 0};

        this.stroke = ["┌", "─", "┐", "│", " ", "│", "└", "─", "┘"];
        this.fill = " ";
        if (options) this.init(options);
    }

    get lines() {
        return Array.from(this.elem.getElementsByClassName("line"));
    }

    /**
     * initialize the display.<br>
     * Use the {@link Display#draw} or {@link Display#display} method to print the display on the window.
     * @param {Object} [options] - Options to initialize the display
     */
    init(options) {
        if (has(options, 'margin')) this.margin = options.margin;
        if (has(options, 'padding')) this.padding = options.padding;
        if (has(options, 'stroke')) this.stroke = options.stroke;
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

    get EmptyContent() {
        var top = this.stroke[0] + this.stroke[1].repeat(this.totalWidth - 2) + this.stroke[2];
        var bottom = this.stroke[6] + this.stroke[7].repeat(this.totalWidth - 2) + this.stroke[8];
        var paddY = Array(this.padding.y - 1).fill(
            this.stroke[3] + this.stroke[4].repeat(this.totalWidth -2) + this.stroke[5]
        )
        var content = Array(this.height).fill([
            this.stroke[3] + this.stroke[4].repeat(this.padding.x -1),
            this.fill.repeat(this.width),
            this.stroke[4].repeat(this.padding.x -1) + this.stroke[5]
        ])
        return [top, ...paddY, ...content, ...paddY, bottom];
    }

    /**
     * Append a clean box to the node element.
     */
    display() {
        var box = this.EmptyContent;
        var fragment = document.createDocumentFragment();
        for (let line of box) {
            let elemLine = document.createElement('p');
            if (Array.isArray(line)) {
                elemLine.appendChild(document.createTextNode(line[0]))
                let content = document.createElement("span");
                content.classList.add("line");
                content.textContent = line[1];
                elemLine.appendChild(content);
                elemLine.appendChild(document.createTextNode(line[2]))
            } else {
                elemLine.textContent = line;
            }
            fragment.appendChild(elemLine);
        }
        this.elem.appendChild(fragment);
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
                top.textContent = this.stroke[0] + this.stroke[2];
                bottom.textContent = this.stroke[6] + this.stroke[8];
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
     * Erase all display content and print a new empty box.
     */
    reset(hard=false) {
        if (hard) {
            this.remove();
            this.display();
        } else {
            let lines = this.lines;
            let emptyLine = this.fill.repeat(this.width)
            for (let line of lines) {
                line.textContent = emptyLine;
            }
        }

    }

    /**
     * Remove display content from document.
     */
    remove() {
        while (this.elem.lastChild) {
            this.elem.lastChild.remove();
        }
    }

    /**
     * Print some string(s) on the display.
     * @param {(string|string[])} txt - a single string with or without '\n' or an array of strings.
     * @param {number} [startY=0] - Y coordinate at witch the print has to start.
     * @param {number} [startX=0] - X coordinate at witch the print has to start.
     */
    rawPrint(txt, startY=0, startX=0, overwrite=false) {
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

    print(txt, startY=0) {
        var lines = this.lines;
        for (let line of txt) {
            lines[startY++].innerHTML = line.HTMLString + cutHTML(lines[startY].innerHTML, line.textLength);
        }
    }

    /**
     * Erase specified lines inside the display.
     * @param {number} [startY=0] - Y coordinate of the line that have to be erased.
     * @param {number} [endY=startY] - if specified, erase all lines between startY and endY.
     */
    resetLines(startY, endY=startY) {
        let lines = this.lines;
        let emptyLine = this.fill.repeat(this.width);

        for (startY; startY <= endY; startY++) {
            lines[startY].textContent = emptyLine;
        }
    }
}

export default Display;
