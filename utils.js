function readJSONFile(url) {
    return new Promise((resolve, reject) => {
        var rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", url);
        rawFile.onload = () => {
            if (rawFile.readyState === 4 && rawFile.status == "200") {
                resolve(JSON.parse(rawFile.responseText));
            }
        }
        rawFile.onerror = () => reject("Couldn't find '" + url +"'");
        rawFile.send();
    });
}

function FormatJSON(x, y, marginX, marginY) {
    this.x = x;
    this.y = y;
    this.marginX = marginX;
    this.marginY = marginY;

}
FormatJSON.prototype.getNewJSON = function(JSONs) {
    /* Formats a given text so it can be displayed in the box with
       every informations needed by the animation's methods. */

    // FIXME Find a better way to reference the differents json in the methods
    const _this = this;
    var returnedObj = [];

    this.transfer = Array(JSONs.length).fill([]);
    this.startAt = Array(JSONs.length).fill([0,0]);
    this.i = 0;

    if (JSONs.length > 1) {
        JSONs.forEach(function(json, i) {
            returnedObj.push(format(json, i));
            _this.i++;
        });
    } else {
        returnedObj = format(JSONs);
    }

    function format(json) {
        var txt = Array.isArray(json.txt) ? json.txt : [json.txt];
        var startAt = _this.startAt[_this.i];
        var format = json.format;
        var zone = {
            x: json.onTheBox ? _this.x : _this.x - _this.marginX * 2,
            y: _this.y - _this.marginY * 2
        };
        // FIXME add dontAddY options
        // FIXME add center x or/and y options
        var obj = {
            txt : [],
            startAt : startAt
        };

        var newTxt;
        // TODO allow formatting combination
        // TODO just modify the json instead of creationg new one
        if (format == undefined || format == "paragraph") {
            newTxt = _this.splitTxt(txt, startAt, zone);
            newTxt = _this.cleanOptions(newTxt);
        } else if (format == "align") {
            newTxt = _this.align(txt, startAt, zone, json.charToAdd);
            newTxt = _this.cleanOptions(newTxt);
        } else if (format == "combine") {
            newTxt = _this.combine(txt, startAt, zone);
            obj.pointOfNoReturn = json.pointOfNoReturn;
        } else if (format == "subtitle") {
            return { txt: _this.subtitle(txt) };
        } else if (format == "none") {
            newTxt = { txt: txt };
        }

        if (json.hasOwnProperty('wordIsTag')) {
            newTxt = { txt: _this.addTags(newTxt.txt, json.wordIsTag)};
        }

        obj.txt = newTxt.txt;
        if (newTxt.hasOwnProperty("options") && newTxt.options.length > 0) {
            let options = _this.manageOptions(newTxt.options, json);
            obj = {...obj, ...options};
        }
        if (json.onTheBox) obj.onTheBox = true;
        if (json.noClearingSpace) obj.noClearingSpace = true;
        if (json.speed != undefined) obj.speed = json.speed;
        return obj;
    }

    return returnedObj;

};
FormatJSON.prototype.addTags = function(txt, tagName) {
    var lines = [];
    txt.forEach(line => {
        line = line.split(" ")
        words = [];
        line.forEach((word, i) => {
            words.push('<span class="' + tagName + '">' + word + '</span>')
        });
        lines.push(words.join(' '))
    });

    return lines
};
FormatJSON.prototype.splitTxt = function(txt, startAt, zone) {
    /* Splits lines if its length higher than the box width. */
    // Defines characters that should'nt be the first or the last
    // character of a line
    var nvrFirst = ["?", "!", ":", ";", "»"];
    var nvrLast = ["¿", "¡", "«"];
    const _this = this;
    var txtLength = txt.length;
    var xZone = zone.x;

    function splitting(starter) {
        // Defines an index variable that contains tags length
        // and another that ignore them.
        var i = starter;
        var iScreen = i;

        var words = txt[l].split(" ");
        var wordsLength = words.length;

        function splitIt() {
            // Checks if there's no character requiring special
            // orthotypography and cuts the line accordingly.
            let first = nvrFirst.indexOf(_this.noOptTags(words[w])) > -1;
            let last = nvrLast.indexOf(_this.noOptTags(words[w-1])) > -1;
            if (first || last) {
                i -= words[w].length + words[w-1].length + 2;
                iScreen -= _this.noOptTags(words[w]).length + _this.noOptTags(words[w-1]).length + 2;
            } else {
                i -= words[w].length + 1;
                iScreen -=  _this.noOptTags(words[w]).length +1;
            }
            // Adds the rest of the line right after the current one
            // and adds a iteration to the for loop.
            txt.splice(l + 1, 0, txt[l].substr(i-starter + 1));
            txtLength++;
            // Replaces the current one
            txt[l] = txt[l].substring(0, i-starter);
        }

        // Determines where to cut the line.
        for (var w = 0; w < wordsLength; w++) {
            // Keeps the real length of the line so we can cut it with the tags included.

            i += w == 0 ? words[w].length : 1 + words[w].length;
            iScreen += w == 0 ? 0 : 1;
            // Checks if there's tags.
            if (words[w].indexOf("{{") > -1) {
                // Adds the word's length whitout the tags.
                iScreen += _this.noOptTags(words[w]).length;
            } else {
                iScreen += words[w].length;
            }

            // Checks if actual line length greater than the box width
            if (iScreen > xZone) {
                splitIt();
                // Breaks the loop on words, if the new line is still
                // wider than the box, the next iteration will cut it.
                break;
            }
        }
    }

    for (var l = 0; l < txtLength; l++) {
        if (txt[l].indexOf("\n") > -1) {
            let split = txt[l].indexOf("\n");
            txt.splice(l + 1, 0, txt[l].substr(split+1));
            txt[l] = txt[l].substring(0, split);
            txtLength++;
        }

        if (l == 0 && txt[l].length > xZone) {
            splitting(startAt[0]);
        }
        else if (txt[l].length > xZone) {
            splitting(0);
        }
    }

    return txt;

};
FormatJSON.prototype.align = function(txt, startAt, zone, adder) {
    /* Formats the text by aligning it to the specified direction */

    var xZone = zone.x;
    var yZone = zone.y;

    var yToAdd = yZone - txt.length;
    var xToAdd;

    txt = this.splitTxt(txt, startAt, zone);

    const _this = this;
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
FormatJSON.prototype.combine = function(txts, startAt, zone) {

    const _this = this;
    var starters = [{prevTxt: 0, prevIndex: 0}];

    var newTxts = [];

    txts.forEach(function(txt, i) {
        var t = "";

        if (i != 0) {
            var ref = starters[i];
            t = newTxts[ref.prevTxt].substr(0, ref.prevIndex + 1);
        }

        while (txt.indexOf("{{index::") > -1) {
            let openPos = txt.indexOf("{{index::");
            let closePos = txt.indexOf("}}", openPos);
            let iStarter = txt.substring(openPos +9, closePos);
            txt = txt.substring(0, openPos) + txt.substr(closePos+2);
            starters[iStarter] = {
                prevTxt : i,
                prevIndex : openPos + t.length
            };
        }

        newTxts.push(t+txt);
    });

    var options = [];
    newTxts.forEach(function(txt, i) {

        var tag = "{{index::" + i + "}}";
        var index = starters[i].prevIndex;
        var newTxt = txt.substring(0, index) + tag + txt.substr(index);
        newTxt = _this.splitTxt([newTxt], startAt, zone);
        // FIXME so wut much wtf (modulate the cleaner to do this with it)
        var cleaned = _this.cleanOptions(newTxt);
        newTxts[i] = !Array.isArray(cleaned.txt) ? [cleaned.txt] : cleaned.txt;
        if (!Array.isArray(cleaned.txt)) {
            options.push(cleaned.options[0]);
        } else {
            options.push(cleaned.options[0][0]);
        }
    });

    return {
        txt: newTxts,
        options: [options]
    };

};
FormatJSON.prototype.subtitle = function(input) {

    const _this = this;
    const maxX = _this.x - _this.marginX * 2;
    const maxY = _this.y - _this.marginY * 2;

    function convertToMillisecond(srtString) {
        var splittedStr = srtString.split(":").reverse();
        var multi = 1000;

        var ms = splittedStr.reduce(function(a,b) {
            if (typeof a == "string" && a.indexOf(".") > -1) {
                a = parseFloat(a)*multi;
            }
            b = parseInt(b);
            multi *= 60;

            return a + b*multi;
        });

        return ms;
    }

    function getPos(position, lineLength, secondLine) {
        var posX = Math.floor((_this.x-_this.marginX*2)*(position[0]/100)) - Math.floor(lineLength/2);
        var posY = Math.floor((_this.y-_this.marginY*2-1)*(position[1]/100));
        return [posX, posY];
    }

    var txts = [];

    input.forEach(function(subtitle) {
        var data = {};

        const timing = subtitle[0];
        const txt = subtitle[1];

        const position = subtitle[3] || [50,100];
        const lineAdder = subtitle[4] || 0;

        for (let i = 0; i < txt.length; i++) {
            txt[i] = " " + txt[i] + " ";
        }

        data.start = typeof timing[0] === "string" ? convertToMillisecond(timing[0]) : timing[0];
        data.end = typeof timing[1] === "string" ? convertToMillisecond(timing[1]) : timing[1];

        data.pos = [];
        if (txt.length > 1) {
            let posA = getPos(position, txt[0].length);
            let posB = getPos(position, txt[1].length);

            if (position[1] <= 50) posB[1] += 1;
            else posA[1] -= 1;

            if (lineAdder != 0) {
                posA[1] += lineAdder;
                posB[1] += lineAdder;
            }

            let cor = 0;
            let larger = txt[0].length > txt[1].length
                         ? {x: posA[0], len: txt[0].length}
                         : {x: posB[0], len: txt[1].length};
            if (larger.x < 0) cor = larger.x * -1;
            else if (larger.x + larger.len > maxX) {
                cor = maxX - (larger.x + larger.len);
            }

            posA[0] += cor;
            posB[0] += cor;

            if (posB[1] >= maxY) {
                cor = maxY - posB[1] -1;
                posB[1] += cor;
                posA[1] += cor;
            }

            data.pos.push(posA, posB);
        }
        else {
            let pos = getPos(position, txt[0].length);

            if (lineAdder != 0) pos[1] += lineAdder;

            if (pos[0] < 0) pos[0] = 0;
            else if (pos[0] + txt[0].length > maxX) {
                pos[0] += maxX - (pos[0] + txt[0].length);
            }

            if (pos[1] >= maxY) {
                pos[1] += maxY - pos[1] - 1;
            }

            data.pos.push(pos);
        }

        data.txt = txt;

        if (subtitle[2] != undefined) {
            data.tags = [];
            data.pos.forEach((posArray, i) => {
                let tag = {};
                tag.type = "span";
                tag.class = "sub " + subtitle[2];
                tag.line = posArray[1];
                tag.open = posArray[0];
                tag.close = posArray[0] + data.txt[i].length;

                data.tags.push(tag);
            })

        }
        txts.push(data);
    });

    return txts;
};
FormatJSON.prototype.cleanOptions = function(txt) {
    /* Separates the texts from the option's tags and returns it as an object */

    var options = [];
    const _this = this;

    if(!Array.isArray(txt)) txt = [txt];

    txt.forEach(function(line, l) {
        if (line.indexOf("{{") > -1) {
            var optLine = [];
            while (line.indexOf("{{") > -1) {
                let openPos = line.indexOf("{{");
                let closePos = line.indexOf("}}") + 2;
                let optStr = line.substring(openPos + 2, closePos - 2);

                line = line.substring(0, openPos) + line.substr(closePos);

                let opt = {};
                optStr = optStr.split("::");

                opt.type = optStr[0];
                opt.options = optStr[1].split("|");
                opt.value = opt.options.shift();
                if (l == 0) {
                    openPos += _this.startAt[_this.i][0];
                }
                let linePlus = _this.startAt[_this.i][1];
                opt.pos = [openPos, l + linePlus];

                optLine.push(opt);
            }
            txt[l] = line;
            options.push(optLine);
        }
    });

    return {
        txt: txt.length == 1 ? txt[0] : txt,
        options: txt.length == 1 ? options[0] : options
    }

};
FormatJSON.prototype.manageOptions = function(options, json) {
    /* Generates the options obj that will be added to the main obj */
    // FIXME REWORK ALL THIS SHIT
    var o = {};
    if (this.transfer[this.i] && this.transfer[this.i].length > 0) {
        options = [this.transfer[this.i], ...options];
    }

    const _this = this;
    options.forEach(function(optLine) {
        // The tag options need a length variable to recalculate its position
        // when multiple tags are on the same line.
        var length = 0;
        optLine.forEach(function(opt) {
            var type = opt.type;

            if (type == "tag") {
                if (!o.hasOwnProperty("tags")) o.tags = [];

                let tag = {
                    index: opt.pos[0] + length,
                    line: opt.pos[1]
                };

                if (opt.value.startsWith("/")) {
                    tag.content = "</" + opt.value.substr(1) + ">";
                } else {
                    let attrs = "";
                    opt.options.forEach(function(attr) {
                        attr = attr.split("=");
                        attrs += " " + attr[0] + "='";
                        attrs += attr[1].replace(",", " ") + "'";
                    });
                    tag.content = "<" + opt.value + attrs + ">";
                }

                length += tag.content.length;
                o.tags.push(tag);
            }
            else if (type == "pause") {
                if (!o.hasOwnProperty("pause")) o.pause = [];
                let pause = [opt.pos, opt.value*1000];
                o.pause.push(pause)
            }
            else if (type == "speed") {
                if (!o.hasOwnProperty("altSpeed")) o.altSpeed = [];
                if (!o.hasOwnProperty("speed")) {
                    o.speed = json.hasOwnProperty("speed") ? json.speed : 70;
                }
                let speed = (parseFloat(opt.value) * -1) * 20 + o.speed;
                if (speed < 0) speed = 0;
                let speedChange = [opt.pos, speed];
                o.altSpeed.push(speedChange);
            }
            else if (type == "clean") {

                function transferClean(pos) {
                    var ref = opt.value.substr(pos);
                    var objRef = _this.transfer[ref];
                    opt.value = opt.value.substring(0, pos);
                    objRef.push(opt)
                }

                if (opt.value.startsWith("/")) {
                    if (opt.value.length > 2) {
                        transferClean(2);
                    } else {
                        let iClean = opt.value.charCodeAt(1) - 97;
                        if (!o.hasOwnProperty("cleanAt")) o.cleanAt = [];
                        if (o.cleanAt[iClean] === undefined) {
                            o.cleanAt[iClean] = [];
                        }
                        o.cleanAt[iClean][1] = opt.pos;
                    }

                } else {
                    if (opt.value.length > 1) {
                        transferClean(1);
                    } else {
                        let iClean = opt.value.charCodeAt(0) - 97;
                        let chara = opt.options[0].replace("&nbsp;", " ");

                        if (!o.hasOwnProperty("cleanAt")) o.cleanAt = [];
                        if (o.cleanAt[iClean] === undefined) {
                            o.cleanAt[iClean] = [];
                        }
                        o.cleanAt[iClean][0] = opt.pos;
                        o.cleanAt[iClean][2] = chara;
                        o.cleanAt[iClean][3] = opt.options[1] || 35;
                    }
                }
            }
            else if (type == "start") {
                _this.startAt[opt.value] = opt.pos;
            }
            else if (type == "index") {
                if (!o.hasOwnProperty("checkPoint")) o.checkPoint = [];
                o.checkPoint[opt.value] = opt.pos;
            }
        });
    });

    return o;

};
FormatJSON.prototype.noOptTags = function(str) {
    /* Returns a string without option's tags */

    return str.replace(/(\{\{[^}]+)\}\}/g, "");

};
