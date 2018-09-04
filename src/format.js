/**
 * Text formatting module.
 * @module writejs/format
 * @author Nicolas Chesnais
 * @license GPL-3.0
 * @version 1.0
 */

import * as syntax from "./syntax.js";


/**
 * Reformats sentences in lines that do not exceed the maximum size imposed.<br>
 * Use ' ' (&nbsp; character) in your strings to ensure proper orthotyping.<br>
 * Syntax content will be ignored in the line length calculation.
 * @param {(string|string[])} txt - a single string with '\n' or an array of strings
 * @param {number} width - length at which lines will break
 * @param {number} [startAt=0] - index at which the very first line will start
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

/**
 * Extracts syntax content and convert it into a options's object
 * @param {string[]} txt
 * @returns {{txt:string[], opt:Object}} Object composed of the previous text (minus syntax) and syntax's convertion object
 */
export function extractOptions(txt) {
    var opts = {};

    txt = txt.map((line, l) => {
        let match;
        while (match = syntax.captureFirst(line)) {
            if (!opts.hasOwnProperty(match[1])) opts[match[1]] = [];

            opts[match[1]].push({
                // check if match[2] can be converted to a number
                value: !isNaN(match[2] - parseFloat(match[2])) ? +match[2] : match[2],
                index: match.index,
                line: l,
            });
            line = syntax.removeFirst(line);
        }
        return line;
    });

    return {txt: txt, opts: opts};
}


export function longestWord(words) {
    return words.reduce((a, b) => {
        if (b.length > a.length) return b;
        return a;
    });
}
