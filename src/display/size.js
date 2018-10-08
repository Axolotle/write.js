import { longestWord } from '../parser/parser.js';
import { removeAll } from "../parser/syntax.js";
import { has } from '../utils.js';

/**
 * Module for defining display size.
 * @module writejs/utils
 * @author Nicolas Chesnais
 * @license GPL-3.0
 * @version 1.0
 */

function OddOrEven(n) {
    return n % 2 === 0 ? "even" : "odd";
}

function getOddOrEven(n, aspect, adder=-1) {
    if (OddOrEven(n) !== aspect) return n + adder;
    return n;
}

function fromMax(width, height, evenOdd) {
    return {
        width: evenOdd.width === undefined
            ? width
            : getOddOrEven(width, evenOdd.width),
        height: evenOdd.height === undefined
            ? height
            : getOddOrEven(height, evenOdd.height),
    }
}

function fromText(txt, width, max) {
    var height = 0;
    var actualWidth = -1;

    for (const words of txt) {
        for (const word of words) {
            if (height > max.height) {
                if (width < max.width) {
                    return fromText(txt, width + 1, max);
                } else {
                    throw new Error('Screen too small');
                }
            }

            actualWidth += 1 + word.length;
            if (actualWidth > width) {
                height += 1;
                actualWidth = word.length;
            }
        }
        if (actualWidth !== -1) {
            height += 1;
            actualWidth = -1;
        }
    }
    return {width: width, height: height};
}

function fromRatio(ratio, height, max, min, evenOdd) {
    var {width, height} = fromMax(Math.round(height * ratio), height, evenOdd);

    if (width <= max.width && width >= min.width && height <= max.height && height >= min.height) {
        return {width: width, height: height};
    }

    let nextHeight = evenOdd.height === undefined
        ? height - 1
        : getOddOrEven(height - 1, evenOdd.height, -1);
    if (nextHeight >= min.height && width >= min.width) {
        return fromRatio(ratio, nextHeight, max, min, evenOdd);
    }
    throw new Error('Screen too small');
}

/**
 * Returns the dimensions of a glyph in pixels
 * @param {string} [targetId='box'] - target element's id
 * @param {string} [glyph='A'] - testing glyph
 * @returns {{width:number, height:number}} dimensions in pixels of the displayed glyph
 */
export function getGlyphDimensions(targetId='display', glyph='A') {
    var test = document.createElement('span');
    test.style.visibility = 'hidden';
    document.getElementById(targetId).appendChild(test);
    test.innerHTML = glyph;
    var w = test.offsetWidth;
    var h = test.offsetHeight;
    test.remove();

    return {width: w, height: h};
}

/**
 * Returns the dimensions of the window in number of glyphs
 * @param {{width:number, height:number}} glyph - glyph dimensions in pixels
 * @param {{x:number, y:number}} margin - margins in glyphs to substract to the window possible size
 * @returns {{width:number, height:number}} dimensions in glyphs of the window
 */
export function getWindowDimensions(glyph, margin={x: 0, y:0}) {
    return {
        width: Math.floor(window.innerWidth / glyph.width) - margin.x * 2,
        height: Math.floor(window.innerHeight / glyph.height) - margin.y * 2
    }
}

/**
 * Returns the dimensions of the window in number of glyphs
 * @param {{width:number, height:number}} screen - screen dimensions in glyphs
 * @param {{width:number, height:number}} glyph - glyph dimensions in pixels
 * @param {Object} [options] - Options to initialize the display
 * @returns {{width:number, height:number}} dimensions in glyphs of the window
 */
export function defineSize(
    screen,
    glyph,
    {
        padding = {x: 0, y:0},
        maxWidth = screen.width,
        maxHeight = screen.height,
        minWidth = 1,
        minHeight = 1,
        hasSyntax = false,
        aspect = {},
        longestText,
        ratio,
    } = {}
) {
    const padd = {
        width: padding.x * 2,
        height: padding.y * 2,
    };
    const max = {
        width: (maxWidth < screen.width ? maxWidth : screen.width) - padd.width,
        height: (maxHeight < screen.height ? maxHeight : screen.height) - padd.height,
    };
    const min = {
        width: minWidth > padd.width ? minWidth - padd.width : 1,
        height: minHeight > padd.height ? minHeight - padd.height : 1,
    };
    const evenOdd = {
        width: !has(aspect, 'width') ? undefined : aspect.width,
        height: !has(aspect, 'height') ? undefined : aspect.height,
    };

    if (max.width < min.width || max.height < min.height) {
        throw new Error('Screen too small');
    }

    if (longestText) {
        if (hasSyntax) longestText = removeAll(longestText);
        let txt = Array.isArray(longestText) ? longestText : longestText.split('\n');
        txt = txt.map(line => line.split(' '));
        let longestLen = longestWord(txt.map(words => longestWord(words))).length;

        if (longestLen > maxWidth) throw new Error('Screen too small');

        if (longestLen > minWidth) return fromText(txt, longestLen, max);
        else return fromText(txt, minWidth, max);
    }

    if (ratio) {
        if (!Array.isArray(ratio) || ratio.length !== 2) {
            throw new TypeError('"Ratio" property');
        }
        let combineRatio = (ratio[0] / ratio[1]) * (glyph.height / glyph.width);
        return fromRatio(combineRatio, max.height, max, min, evenOdd);
    }

    return fromMax(max.width, max.height, evenOdd);
}
