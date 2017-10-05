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
       every informations needed by the animation's methods */

    // Creates an empty object that will be returned after processing
    var obj = {};

    var neverFirst = ["?", "!", ":", ";", "»"];
    var neverLast = ["¿", "¡", "«"];

    // Applies the specified formatting to the text
    var format = json.format;
    if (format == undefined || format == "paragraph") {
        obj.txt = formatting();
    } else if (format == "align") {
        obj.txt = aligning();
    } else if (format == "combine") {
        obj.txt = combining();
    } else if (format == "subtitle") {
        obj.txt = subtitling();
    }


    function formatting() {

    }

    function aligning() {
        /* Formats the text by aligning it to the specified direction */

        // Stores text in an array if it's not already
        var txt = Array.isArray(json.txt) ? json.txt : [json.txt];
        var adder = json.charToAdd;

        // FIXME add onTheBox & dontAddY options
        // FIXME add center x or/and y options
        var yZone = y - marginY * 2;
        var xZone = x - marginX * 2;

        // FIXME maybe build a function that do this kind of formatting before aligning it
        txt.forEach(function(line, lineIndex) {
            // Cuts line if its too long
            if (line.length > xZone) {
                // FIXME deal with tags
                var i = 0;
                let words = line.split(" ");
                let wordsLength = words.length;

                for (var w = 0; w < wordsLength; w++) {
                    i += w == 0 ? words[w].length : 1 + words[w].length;

                    if (i > xZone) {
                        if (neverFirst.indexOf(words[w]) > -1 ||
                            neverLast.indexOf(words[w-1]) > -1) {
                            i -= words[w].length + words[w-1].length + 2;
                        } else {
                            i -= words[w].length;
                        }
                        txt.splice(lineIndex + 1, 0, line.substr(i + 1));
                        txt[lineIndex] = line = line.substring(0, i);

                        break;
                    }
                }
            }
        });

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

    return obj;

}
