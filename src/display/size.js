import { longestWord } from '../format.js';
/**
 * Module for defining display size.
 * @module writejs/utils
 * @author Nicolas Chesnais
 * @license GPL-3.0
 * @version 1.0
 */



function fromText(txt, width, padding, max) {
    var height = padding.y;
    var actualWidth = padding.x;

    for (const words of txt) {
        actualWidth = padding.x;
        height++;
        for (const word of words) {
            if (height > max.height) {
                if (width <= max.width) {
                    return fromText(words, width + 1, padding, max);
                } else {
                    throw error;
                }
            }

            let wordLen = word.length;
            let nextWidth = actualWidth === padding.x ? wordLen : actualWidth + 1 + wordLen;

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

function fromRatio(ratio, height) {
    var width = Math.round(height * ratio);

    if (width <= max.width && width >= min.width && height <= max.height && y >= min.height) {
        return {
            width: evenOdd.width === undefined ? width : checkOddOrEven(width, evenOdd.width)
        }
    }
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
        minWidth = padding.x * 2,
        minHeight = padding.y * 2,
        aspect = {},
        longestText,
        ratio,
    } = {}
) {
    const error = new Error('Screen too small');
    const padd = {x: padding.x * 2, y: padding.y * 2};
    const max = {
        width: maxWidth < screen.width ? maxWidth : screen.width,
        height: maxHeight < screen.height ? maxHeight : screen.height,
    };
    const min = {
        width: minWidth < padd.x ? padd.x : minWidth,
        height: minHeight < padd.y ? padd.y : minHeight,
    };
    const evenOdd = {
        width: !aspect.hasOwnProperty('width') ? undefined : aspect.width,
        height: !aspect.hasOwnProperty('height') ? undefined : aspect.height,
    }

    if (max.width < min.width || max.height < min.height) throw error;

    if (longestText) {
        let txt = Array.isArray(longestText) ? longestText : longestText.split('\n');
        txt = txt.map(line => line.split(' '));
        let longestLen = longestWord(txt.map(words => longestWord(words))).length;

        if (longestLen > maxWidth) throw error;

        if (longestLen > minWidth) return fromText(txt, longestLen, padd, max);
        else return fromText(txt, minWidth, padd, max);
    }

    if (ratio) {
        if (!Array.isArray(ratio) || ratio.length !== 2) {
            throw new TypeError('"Ratio" property');
        }
        let combineRatio = (ratio[0] / ratio[1]) * (glyph.height / glyph.width);
        return fromRatio(combineRatio, max.height);
    }
}
