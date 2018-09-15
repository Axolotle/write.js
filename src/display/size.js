import { split, longestWord } from '../format.js';
/**
 * Module for defining display size.
 * @module writejs/utils
 * @author Nicolas Chesnais
 * @license GPL-3.0
 * @version 1.0
 */


function fromText(txt, width, padd, max) {
    var height = 0;
    var actualWidth = -1;

    for (const words of txt) {
        for (const word of words) {
            if (height > max.height - padd.height) {
                if (width < max.width - padd.width) {
                    return fromText(txt, width + 1, padd, max);
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
    const padd = {
        width: padding.x * 2,
        height: padding.y * 2,
    };
    const max = {
        width: maxWidth < screen.width ? maxWidth : screen.width,
        height: maxHeight < screen.height ? maxHeight : screen.height,
    };
    const min = {
        width: minWidth < padd.width ? padd.width : minWidth,
        height: minHeight < padd.height ? padd.height : minHeight,
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

        if (longestLen > maxWidth) throw new Error('Screen too small');

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
