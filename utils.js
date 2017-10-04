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

function formatJSON(jsonArray, x, y, marginX, marginY) {

    // Creates an empty object that will be returned after processing
    var obj = {
        txt: []
    };

    // Applies the specified formatting to each texts
    jsonArray.forEach(function(json, i, array) {
        var format = json.format;
        if (format == undefined || format == "paragraph") {
            obj.txt.push(formatting(json.txt));
        } else if (format == "center") {
            obj.txt.push(centering(json.txt));
        } else if (format == "combine") {
            obj.txt.push(combining(json.txt));
        } else if (format == "subtitle") {
            obj.txt.push(subtitling(json.txt));
        }

    });

    function formatting(txt) {

    }

    function centering(txt) {

    }

    function combining(txt) {

    }

    function subtitling(txt) {

    }
}
