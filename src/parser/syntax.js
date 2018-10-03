/**
 * Text formatting module.
 * @module writejs/syntax
 * @author Nicolas Chesnais
 * @license GPL-3.0
 * @version 1.0
 */


/**
 * Returns the first syntax match
 * @param {string} str
 * @returns {Array} match Array
 */
export function captureFirst(str) {
    return str.match(/\{\{([a-z]+)::([^}]+)\}\}/);
}

/**
 * Returns an array containing all syntax matches.
 * @param {string} str
 * @returns {array[]} Array of match arrays
 */
export function captureAll(str) {
    let match, matches = [];
    while (match = captureFirst(str)) {
        matches.push(match);
        str = removeFirst(str);
    }
    return matches;
}

/**
 * Returns a string without syntax related content
 * @param {string} str
 * @returns {string}
 */
export function removeAll(str) {
    return str.replace(/\{\{[^}]+\}\}/g, "");
}

/**
 * Returns a string without first occurence of syntax related content
 * @param {string} str
 * @returns {string}
 */
export function removeFirst(str) {
    return str.replace(/\{\{[^}]+\}\}/, "");
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
    return captureFirst(str) !== null;
}
