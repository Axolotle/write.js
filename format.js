/**
 * Text formatting module.
 * @module writejs/format
 * @author Nicolas Chesnais
 * @license GPL-3.0
 * @version 1.0
 */


/**
 * Syntax related utilities
 * @namespace
 */
export var syntax = {
    /**
     * Returns a string without syntax related content
     * @param {string} str
     * @returns {string}
     */
    remove(str) {
        return str.replace(/\{\{[^}]+\}\}/g, "");
    },
    /**
     * Returns the length of a string without syntax related content
     * @param {string} str
     * @returns {number}
     */
    getRealLength(str) {
        return this.remove(str).length;
    }
}


/**
 * Reformats sentences in lines that do not exceed the maximum size imposed.
 * Use ' ' (&nbsp; character) in your strings to ensure proper orthotyping.
 * Syntax content will be ignored in the line length calculation.
 * @param {(string|string[])} txt - a single string with '\n' or an array of strings
 * @param {number} width - length at which lines will break
 * @param {number=0} startAt - index at which the very first line will start
 * @returns {string[]} new array of string of the formated sentences
 */
export function split(txt, width, startAt=0) {
    if (!Array.isArray(txt)) txt = txt.split("\n");

    var newTxt = [];
    var index = startAt - 1;
    txt.forEach(line => {
        var newLine = [];
        line.split(" ").forEach(word => {
            index += 1 + syntax.getRealLength(word);

            if (index <= width) {
                newLine.push(word);
            } else {
                newTxt.push(newLine.join(" "));
                newLine = [word];
                index = -1;
            }
        });

        newTxt.push(newLine.join(" "));
        index = -1;
    });

    return newTxt;
}
