/**
 * Text formatting module.
 * @module writejs/format
 * @author Nicolas Chesnais
 * @license GPL-3.0
 * @version 1.0
 */

import { startTag, endTag, options } from "./syntax.js";
import { Txt, Line, Tag } from "./objects.js";
import { has, isNumber } from "../utils.js";


export function longestWord(words) {
    return words.reduce((a, b) => {
        return b.length > a.length ? b : a;
    });
}

/**
 * Reformats sentences in lines that do not exceed the given width, parse syntax content (HTML or options) and returned an array of Tag instances.<br>
 * Use ' ' (&#8239; character) or ' ' (&nbsp; character) in your strings to ensure proper orthotyping.<br>
 * @param {(string|string[])} strs - a single string with '\n' or an array of strings
 * @param {number} width - length at which lines will break
 * @param {number} [startAt=0] - index at which the very first line will start
 * @returns {Object[]} new array of Tag objects of the formated sentences
 */
export function splitParse(strs, width, startAt=0) {
    if (!Array.isArray(strs)) strs = strs.split("\n");

    var isHTML = (tag) => {
        return !["pause", "speed"].includes(tag);
    }

    var tags = [new Line()];
    tags.last = function () {
        return this[this.length - 1];
    }
    tags.reset = function () {
        parsed.push(this.shift());
        this.unshift(new Line());
        for (let i = 1, len = this.length; i < len; i++) {
            this[i] = new Tag(this[i].nodeName);
            this[i-1].push(this[i]);
        }
        currentTag = this.last();
    }

    var index = startAt;
    var currentTag = tags[0];
    var parsed = new Txt();
    var glyphs;

    for (let str of strs) {
        while(str) {
            let match;
            // End of html tag
            if (str.startsWith("</")) {
                match = str.match(endTag);
                if (match && tags.last().nodeName == match[1]) {
                    tags.pop();
                    currentTag = tags.last();
                    str = str.slice(match[0].length);
                }

            // Start of html tag + options
            } else if (str.startsWith("<")) {
                match = str.match(startTag);
                if (match) {
                    // HTML
                    if (isHTML(match[1])) {
                        let tag = new Tag(match[1], match[2] ? getAttr(match[2]) : {});
                        tags.push(tag);
                        currentTag.push(tag)
                        currentTag = tag;

                    // Options
                    } else {
                        currentTag.push(options[match[1]](match[2]));
                    }
                    str = str.slice(match[0].length);
                }
            }

            // text nodes
            if (!match) {
                let nextTag = str.indexOf("<", 1);
                if (nextTag < 0) nextTag = str.length;
                let text = "";
                let textToAdd = str.slice(0, nextTag);
                str = str.slice(textToAdd.length);

                if (index + nextTag > width) {
                    while (textToAdd) {
                        let nextSpace = textToAdd.indexOf(" ", 1);
                        if (nextSpace < 0) nextSpace = textToAdd.length;
                        let content = textToAdd.slice(0, nextSpace);

                        if (index + nextSpace <= width) {
                            text += content;
                            index += content.length;

                        } else {
                            currentTag.push(text);
                            // remove first whitespace
                            text = content.startsWith(" ") ? content.slice(1) : content;
                            index = text.length;
                            tags.reset();

                        }
                        textToAdd = textToAdd.slice(content.length);
                    }

                } else {
                    // remove first whitespace if first textnode of the line
                    text = index === 0 && textToAdd.startsWith(" ") ? textToAdd.slice(1) : textToAdd;
                    index += text.length;

                }
                currentTag.push(text);
            }
        }
        tags.reset();
        index = 0;

    }
    return parsed;
}

export function getAttr(str) {
    var attrs = {};
    str.split(" ").forEach(attr => {
        let [name, value] = attr.split("=");
        if (value.indexOf("'") > -1) value = value.slice(1, value.length - 1);
        attrs[name] = value;
    });
    return attrs;
}
