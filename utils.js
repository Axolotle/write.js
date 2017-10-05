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

function formatJSON(json, x, y, marginX, marginY, jsonArray) {
    /* Formats a given text so it can be displayed in the box with
       every informations needed by the animation's methods. */
    // FIXME TOO MUCH SIDE-EFFECT FUNCTIONS WTF

    // Creates an empty object that will be returned after processing.
    var obj = {};

    // Stores text in an array if it's not already. FIXME good scope ?
    var txt = Array.isArray(json.txt) ? json.txt : [json.txt];
    // FIXME add onTheBox & dontAddY options
    // FIXME add center x or/and y options
    var yZone = y - marginY * 2;
    var xZone = x - marginX * 2;



    // Applies the specified formatting to the text.
    var format = json.format;
    if (format == undefined || format == "paragraph") {
        let formated = formatting(txt);
        obj.txt = formated.txt;
        let options = manageOptions(formated.options);
        //Object.assign(obj, ...options);
    } else if (format == "align") {
        let formated = formatting(txt);
        //formated = aligning(formated.txt);

    } else if (format == "combine") {
        obj.txt = combining();
    } else if (format == "subtitle") {
        obj.txt = subtitling();
    }


    function formatting(txt) {
        /* Splits lines if its length higher than the box width. */

        var neverFirst = ["?", "!", ":", ";", "»"];
        var neverLast = ["¿", "¡", "«"];

        var tagsByLine = [];

        var txtLength = txt.length;
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
                        let wordCopy = words[w];
                        while (wordCopy.indexOf("{{") > -1) {
                            let openPos = wordCopy.indexOf("{{");
                            let closePos = wordCopy.indexOf("}}") + 2;
                            wordCopy = wordCopy.substring(0, openPos) + wordCopy.substr(closePos);
                        }
                        // Adds the word's length whitout the tags.
                        iScreen += wordCopy.length;

                    } else {
                        iScreen += words[w].length;
                    }

                    // Checks if actual line length greater than the box width
                    if (iScreen > xZone) {
                        // Checks if there's no character requiring special
                        // orthotypography and cuts the line accordingly.
                        if (neverFirst.indexOf(words[w]) > -1
                            || neverLast.indexOf(words[w-1]) > -1) {
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

            let tags = [];
            if (txt[l].indexOf("{{") > -1) {
                while (txt[l].indexOf("{{") > -1) {
                    let openPos = txt[l].indexOf("{{");
                    let closePos = txt[l].indexOf("}}") + 2;
                    let tagStr = txt[l].substring(openPos + 2, closePos - 2);

                    txt[l] = txt[l].substring(0, openPos)
                           + txt[l].substr(closePos);

                    var tag = {};
                    tagStr = tagStr.split(":");
                    tag.type = tagStr[0];
                    tag.options = tagStr[1].split("|");
                    tag.pos = [openPos, l];

                    tags.push(tag);
                }
            }
            tagsByLine.push(tags);
        }

        return {
            txt: txt,
            options: tagsByLine
        }
    }

    function aligning() {
        /* Formats the text by aligning it to the specified direction */

        var adder = json.charToAdd;

        var yToAdd = yZone - txt.length;
        var xToAdd;

        txt.forEach(function(line, index) {
            xToAdd = xZone - line.length;

            var before = adder.repeat(Math.ceil(xToAdd / 2));
            var after = adder.repeat(Math.floor(xToAdd / 2));
            txt[index] = before + line + after;
        });

        var adderLine = adder.repeat(xZone);
        var before = Array(Math.floor(yToAdd / 2)).fill(adderLine);
        var after = Array(Math.ceil(yToAdd / 2)).fill(adderLine);

        return [...before, ...txt, ...after];

    }

    function combining() {

    }

    function subtitling() {

    }

    function manageOptions(options) {

    }

    return obj;

}
