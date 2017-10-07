function readJSONFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

function FormatJSON(x, y, marginX, marginY) {
    this.x = x;
    this.y = y;
    this.marginX = marginX;
    this.marginY = marginY;

}
FormatJSON.prototype.getNewJSON = function(json, jsonArray) {
    /* Formats a given text so it can be displayed in the box with
       every informations needed by the animation's methods. */

    // Creates an empty object that will be returned after processing.
    var obj = {};

    // Stores text in an array if it's not already. FIXME good scope ?
    var txt = Array.isArray(json.txt) ? json.txt : [json.txt];
    // FIXME add onTheBox & dontAddY options
    // FIXME add center x or/and y options
    this.yZone = this.y - this.marginY * 2;
    this.xZone = this.x - this.marginX * 2;



    // Applies the specified formatting to the text.
    var format = json.format;
    if (format == undefined || format == "paragraph") {
        obj.txt = this.splitLines(txt);
        //Object.assign(obj, ...options);
    } else if (format == "align") {
        let newTxt = this.separateOptFromText(this.align(txt, json.charToAdd));
        obj.txt = newTxt.txt;
        if (newTxt.options.length > 0) {
            let options = this.manageOptions(newTxt.options);
            obj = {...obj, ...options};
        }
    } else if (format == "combine") {
        obj.txt = this.combine(txt);
    } else if (format == "subtitle") {
        obj.txt = this.subtitle(txt);
    }

    return obj;
}
FormatJSON.prototype.splitLines = function(txt) {
    /* Splits lines if its length higher than the box width. */

    // Defines characters that should'nt be the first or the last
    // character of a line
    var nvrFirst = ["?", "!", ":", ";", "»"];
    var nvrLast = ["¿", "¡", "«"];

    var txtLength = txt.length;
    var xZone = this.xZone;
    for (let l = 0; l < txtLength; l++) {
        let line = txt[l];
        if (txt[l].length > xZone) {
            // Defines an index variable that contains tags length
            // and another that ignore them.
            let i = 0;
            let iScreen = i;

            let words = txt[l].split(" ");
            let wordsLength = words.length;

            // Determines where to cut the line.
            for (let w = 0; w < wordsLength; w++) {
                // Keeps the real length of the line so we can cut it with the tags included.
                i += w == 0 ? words[w].length : 1 + words[w].length;
                iScreen += w == 0 ? 0 : 1;

                // Checks if there's tags.
                if (words[w].indexOf("{{") > -1) {
                    // Adds the word's length whitout the tags.
                    iScreen += this.noOptTags(words[w]).length;
                } else {
                    iScreen += words[w].length;
                }

                // Checks if actual line length greater than the box width
                if (iScreen > xZone) {
                    // Checks if there's no character requiring special
                    // orthotypography and cuts the line accordingly.
                    let first = nvrFirst.indexOf(this.noOptTags(words[w])) > -1;
                    let last = nvrLast.indexOf(this.noOptTags(words[w-1])) > -1;
                    if (first || last) {
                        i -= words[w].length + words[w-1].length + 2;
                    } else {
                        i -= words[w].length + 1;
                    }
                    // Adds the rest of the line right after the current one
                    // and adds a iteration to the for loop.
                    txt.splice(l + 1, 0, txt[l].substr(i + 1));
                    txtLength++;
                    // Replaces the current one
                    txt[l] = txt[l].substring(0, i);

                    // Breaks the loop on words, if the new line is still
                    // wider than the box, the next iteration will cut it.
                    break;
                }
            }
        }
    }

    return txt;

};
FormatJSON.prototype.align = function(txt, adder) {
    /* Formats the text by aligning it to the specified direction */

    var xZone = this.xZone;
    var yZone = this.yZone;

    var yToAdd = yZone - txt.length;
    var xToAdd;

    txt = this.splitLines(txt);

    var _this = this;
    txt.forEach(function(line, index) {
        xToAdd = xZone - _this.noOptTags(line).length;

        var before = adder.repeat(Math.ceil(xToAdd / 2));
        var after = adder.repeat(Math.floor(xToAdd / 2));
        txt[index] = before + line + after;
    });

    var adderLine = adder.repeat(xZone);
    var before = Array(Math.floor(yToAdd / 2)).fill(adderLine);
    var after = Array(Math.ceil(yToAdd / 2)).fill(adderLine);

    return [...before, ...txt, ...after];

};
FormatJSON.prototype.combine = function(txt) {
};
FormatJSON.prototype.subtitle = function(txt) {
};
FormatJSON.prototype.separateOptFromText = function(txt) {
    /* Separates the texts from the option's tags and returns it as an object */

    var options = [];

    txt.forEach(function(line, l) {
        if (line.indexOf("{{") > -1) {
            var optLine = [];
            while (line.indexOf("{{") > -1) {
                let openPos = line.indexOf("{{");
                let closePos = line.indexOf("}}") + 2;
                let optStr = line.substring(openPos + 2, closePos - 2);

                line = line.substring(0, openPos) + line.substr(closePos);

                let opt = {};
                optStr = optStr.split(":");
                opt.type = optStr[0];
                opt.options = optStr[1].split("|");
                opt.value = opt.options.shift();
                opt.pos = [openPos, l];

                optLine.push(opt);
            }
            txt[l] = line;
            options.push(optLine);
        }
    });

    return {
        txt: txt,
        options: options
    }

};
FormatJSON.prototype.manageOptions = function(options) {
    /* Generates the options obj that will be added to the main obj */
    // FIXME REWORK ALL THIS SHIT
    var o = {};

    options.forEach(function(optLine) {
        var length = 0;
        optLine.forEach(function(opt, i) {
            if (opt.type == "tag") {
                if (!o.hasOwnProperty("tags")) o.tags = [];

                let tag = {
                    index : opt.pos[0] + length,
                    line: opt.pos[1]
                };

                if (opt.value.startsWith("/")) {
                    tag.content = "</" + opt.value.substr(1) + ">";
                } else {
                    let attrs = "";
                    opt.options.forEach(function(attr, i) {
                        attr = attr.split("=");
                        attrs += " " + attr[0] + "='";
                        attrs += attr[1].replace(",", " ") + "'";
                    });
                    tag.content = "<" + opt.value + attrs + ">";
                }

                length += tag.content.length;
                o.tags.push(tag);
            }
        });
    });

    return o;

};
FormatJSON.prototype.noOptTags = function(str) {
    /* Returns a string without option's tags */

    while (str.indexOf("{{") > -1) {
        let openPos = str.indexOf("{{");
        let closePos = str.indexOf("}}") + 2;
        str = str.substring(0, openPos) + str.substr(closePos);
    }

    return str;

};
