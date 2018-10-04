/**
 * Text formatting module.
 * @module writejs/format
 * @author Nicolas Chesnais
 * @license GPL-3.0
 * @version 1.0
 */

import * as syntax from "./syntax.js";
import { has } from "../utils.js";


/**
 * Reformats sentences in lines that do not exceed the maximum size imposed.<br>
 * Use ' ' (&#8239; character) or ' ' (&nbsp; character) in your strings to ensure proper orthotyping.<br>
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
                index = word.length;
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
 * @returns {{txt:string[], opts:Object}} Object composed of the previous text (minus syntax) and syntax's convertion object
 */
export function extract(txt) {
    var opts = {};

    txt = txt.map((line, l) => {
        let match;
        while (match = syntax.captureFirst(line)) {
            if (match[1] === "tag") {
                if (!opts.hasOwnProperty("tags")) opts.tags = [];
                if (match[2][0] === "/") {
                    let tagName = match[2].substr(1);
                    for (var i = opts.tags.length - 1; i >= 0; i--) {
                        if (opts.tags[i].name == tagName && !opts.tags[i].end) {
                            opts.tags[i].end = {line: l, index: match.index};
                            break;
                        }
                    }
                } else {
                    let [tagName, ...extra] = match[2].split("|");
                    let tag = {
                        name: tagName,
                        start: {line: l, index: match.index}
                    };
                    for (let ex of extra) {
                        let [prop, value] = ex.split("=");
                        if (prop === "class") value = value.replace(",", " ");
                        // TODO Check/reject onclick and other stuff like that
                        tag[prop] = value;
                    }
                    opts.tags.push(tag);
                }
            } else {
                if (!opts.hasOwnProperty(match[1])) opts[match[1]] = [];

                opts[match[1]].push({
                    // check if match[2] can be converted to a number
                    value: !isNaN(match[2] - parseFloat(match[2])) ? +match[2] : match[2],
                    index: match.index,
                    line: l,
                });
            }

            line = syntax.removeFirst(line);
        }
        return line;
    });

    return {txt: txt, opts: opts};
}

export function longestWord(words) {
    return words.reduce((a, b) => {
        return b.length > a.length ? b : a;
    });
}

export function parse(txt) {
    var startTag = /^<([-a-z]+)(?:\s([ -='a-z0-9]+))?>/;
    var endTag = /^<\/([-a-z]+)>/;
    var isHTML = (tag) => {
        return !["pause"].includes(tag);
    }
    var index, match;

    var tags = [];
    var actualTag;
    tags.last = () => {
        return this[this.length - 1];
    }

    return txt.map(l => {
        let line = new Tag("line");
        actualTag = line;

        var stop = 0;
        while(l !== "") {
            if (l.startsWith("</")) {
                match = l.match(endTag);
                tags.pop();
                actualTag = tags.last();
                l = l.substring(l.indexOf(">") + 1);
            } else if (l.startsWith("<")) {
                match = l.match(startTag);
                if (isHTML(match[1])) {
                    let tag = new Tag(match[1], match[2]);
                    tags.push(tag);
                    actualTag.add(tag)
                    actualTag = tag;
                } else {
                    actualTag.add({"pause": 1});
                }

                l = l.substring(match[0].length);
            } else {
                index = l.indexOf("<");
                let text = index < 0 ? l : l.substring(0, index);
                l = index < 0 ? "" : l.substring(index);
                actualTag.add(text);
            }
        }
        return line;
    });
}

export class Tag {
    constructor(nodeName, attr) {
        this.nodeName = nodeName;
        this.nodes = [];
        this.attr = {};
    }

    get length() {
        return this.nodes.reduce((sum, node) =>{
            if (node instanceof Tag || typeof node === 'string') {
                return sum + node.length;
            } else {
                return sum;
            }
        }, 0);
    }

    stringify() {
        var str = "";
        for (let node of this.nodes) {
            if (node instanceof Tag) {
                str += `<${node.nodeName}>${node.stringify()}</${node.nodeName}>`
            } else if (typeof node === "object") {
                // str += '<pause 1>';
            } else {
                str += node;
            }
        }
        return str;
    }

    add(content) {
        this.nodes.push(content);
    }
}
