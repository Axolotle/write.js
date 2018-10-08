/**
 * Text formatting module.
 * @module writejs/syntax
 * @author Nicolas Chesnais
 * @license GPL-3.0
 * @version 1.0
 */

export let startTag = /^<([-a-z]+)(?:\s([- ='a-z0-9]+))?>/;
export let endTag = /^<\/([-a-z]+)>/;

/**
 * Returns a string without syntax related content
 * @param {string} str
 * @returns {string}
 */
export function removeAll(str) {
    var newStr = "";
    while (str) {
        let match;
        if (str.startsWith("</")) {
            match = str.match(endTag);
        } else if (str.startsWith("<")) {
            match = str.match(startTag);
        }

        if (match) str = str.slice(match[0].length);
        else {
            let nextTag = str.indexOf("<", 1);
            if (nextTag < 0) nextTag = str.length;
            newStr += str.slice(0, nextTag);
            str = str.slice(nextTag);
        }
    }
    return newStr;
}

/**
 * Returns the length of a string without syntax related content
 * @param {string} str
 * @returns {number}
 */
export function getRealLength(str) {
    return removeAll(str).length;
}

/**
 * Indicates if given string contains syntax content.
 * @param {string} str
 * @returns {boolean}
 */
export function hasSyntax(str) {
    return str.match(/<([-a-z]+)(?:\s([ \-='a-z0-9]+))?>/) !== null;
}
