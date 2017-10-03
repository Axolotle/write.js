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


function Box() {
    // Define base information
    this.x = 0;
    this.y = 0;
    this.lines = [];
    this.error = false; //FIXME needed ?

}
Box.prototype.init = function(opt) {

    this.marginX = opt.marginX || 1;
    this.marginY = opt.marginY || 1;
    this.div = opt.divName;
    this.animDuration = opt.animDuration * 1000 || 300;

    var pageSize = this.getPageDimension();
    this.maxW = pageSize.w;
    this.maxH = pageSize.h;

    var boxSize = this.getBoxSize(opt);
    if (boxSize != null) {
        this.x = boxSize.x;
        this.y = boxSize.y;
    } else {
        this.drawError();
        // FIXME deal with errors
    }

};
Box.prototype.getPageDimension = function() {
    /* Returns the page dimension in number of characters */

    // Get the size in pixel of a common character
    var chara = this.getCharacterDimension();

    // Define how many characters we can fit inside the window
    var pageW = Math.floor(window.innerWidth / chara.w);
    var pageH = Math.floor(window.innerHeight / chara.h);

    return {"w" : pageW, "h" : pageH};

};
Box.prototype.getCharacterDimension = function() {
    /* Creates an span element, return the height and the width of one
       character then delete it */

    var test = document.createElement("span");
    test.style.visibility = "hidden";
    document.body.appendChild(test);
    test.innerHTML = "|";

    var w = test.offsetWidth;
    var h = test.offsetHeight;

    test.parentNode.removeChild(test);

    return {"w" : w, "h" : h};

};
Box.prototype.getBoxSize = function (opt) {
    /* Returns the box size depending of the options given by the json object */

    var _this = this;
    var maxX, maxY, minX, minY;

    if (opt.minX && typeof opt.minX == "string") {
        // If the minX option is a word or en sentence, get its length
        minX = opt.minX.length;
    } else {
        minX = opt.minX || this.marginX * 2;
    }
    minY = opt.minY || this.marginY * 2;

    if (this.maxW < minX || this.maxH < minY) {
        // Required minimum size can't be obtained
        return null;
    }

    // Define min & max from given values and page dimensions
    maxX = opt.maxX && opt.maxX <= this.maxW ? opt.maxX : this.maxW;
    maxY = opt.maxY && opt.maxY <= this.maxH ? opt.maxY : this.maxH;


    function fromText(words, x) {
        // Returns dimensions so a given text can be fully displayed in the
        // user's window. An ideal x value is required to set the y value.

        var line = 1,
            index = 0,
            dontEscape = ["?", "!", ":", ";"];

        // Margins must be substracted from the usable width
        var y = 1 + _this.marginY * 2;
        var margins = _this.marginX * 2;

        if (x > maxX) {
            // Window is probably too small to fit the text
            return null;
        }

        wordsLength = words.length;
        // Simulates text formatting to get the height of the box
        for (var i = 0; i < wordsLength; i++) {
            if (y > maxY) {
                // Box is already higher than the window, try with a wider x
                return fromText(words, ++x);
            }

            let length = words[i].length;
            let width = index == 0 ? length : index + 1 + length;

            if (words[i].indexOf("\n") > -1) {
                if (width - "\n".length > x - margins) {
                    y += 2;
                }
                else {
                    y++;
                }
                index = 0;
            } else if (width <= x - margins) {
                index += index == 0 ? length : 1 + length;
            } else if (dontEscape.indexOf(words[i]) > -1) {
                var lastWord = words[i-1];
                index = lastWord.length + 1 + length;
                y++;
            } else {
                index = length;
                y++;
            }
        }

        return {"x" : x, "y" : y};
    }

    function fromRatio(ratio, y) {
        // Returns dimensions so that the box is homothetic at a given ratio.
        var x = Math.round(y * ratio);

        if (x <= maxX && x >= minX && y <= maxY && y >= minY){
            return {"x" : x, "y" : y};
        } else if (x > maxX && y-1 >= minY) {
            return fromRatio(ratio, y--);
        } else return null;
    }

    function fromMinMax(x, y) {
        // Returns dimensions so that each axis is between the min & max values.
        if (x <= maxX && x >= minX && y <= maxY && y >= minY){
            return {"x" : x, "y" : y};
        } else if (x > maxX && y > maxY) {
            return fromMinMax(--x, --y);
        } else if (x > maxX) {
            return fromMinMax(--x, y);
        } else if (y > maxY) {
            return fromMinMax(x, --y);
        } else {
            return null;
        }
    }


    if (opt.longestText) {
        var words = opt.longestText.split(" ");

        return fromText(words, opt.idealX);
    } else if (opt.ratio) {
        // To get a homothetic box, given ratio must be added to the
        // ratio of the font size.
        var charaSize = this.getCharacterDimension();
        var charaRatio = charaSize.h/charaSize.w;
        var givenRatio = opt.ratio[0]/opt.ratio[1];
        var ratio = givenRatio * charaRatio;

        return fromRatio(ratio, maxY);
    } else {
        return fromMinMax(maxX, maxY);
    }

};
Box.prototype.setupLines = function(x,y) {
    /* Creates the box lines from dimensions */

    var lines = [];

    var repeatedLines = "─".repeat(x - 2);
    var repeatedSpaces = "│" + " ".repeat(x - 2) + "│";
    for (var n = 0; n < y; n++) {
        var content;
        if (n == 0) {
            content = "┌" + repeatedLines + "┐";
        } else if (n == y-1) {
            content = "└" + repeatedLines + "┘";
        } else {
            content = repeatedSpaces;
        }
        lines.push(content);
    }

    return lines;

};
Box.prototype.display = function(callback) {
    /* Display the box on window without animation. */

    // Gets the formated lines with the box characters
    var boxLines = this.setupLines(this.x, this.y);

    var _this = this;
    // Creates a document object outside the DOM.
    var docFragment = document.createDocumentFragment();

    boxLines.forEach(function(line) {
        var elem = document.createElement("p");
        elem.innerHTML = line;
        // Also keep the line reference for future use.
        _this.lines.push(elem);
        docFragment.appendChild(elem);
    });

    // Appends the fragment to the DOM.
    var div = document.getElementById(this.div);
    div.appendChild(docFragment);

    if (callback) callback();

};
Box.prototype.draw = function(callback) {
    /* Animation of the display of the box from previous size or scratch
       to the needed size in a given time. */

    var div = document.getElementById(this.div);
    var _this = this;
    var start = null;

    var x = this.x;
    var y = this.y;

    var oldX, oldY;
    if (this.lines[0] == undefined) {
        var one = document.createElement("p");
        var two = document.createElement("p");
        one.innerHTML = "┌┐";
        two.innerHTML = "└┘";
        div.appendChild(one);
        div.appendChild(two);
        this.lines.push(one, two);
        oldX = oldY = 2;
    } else {
        oldX = this.lines[0].innerHTML.length;
        oldY = this.lines.length;
    }

    var actualX = oldX;
    var actualY = oldY;
    var xFrame = this.animDuration / (x - actualX);
    var yFrame = this.animDuration / (y - actualY);

    function draw(timeStamp) {
        if (start === null) start = timeStamp;
        var progress = timeStamp - start;

        // Defines how many lines we should add or remove to/from the box for this frame.
        var xStep = Math.floor((progress / xFrame) - (actualX - oldX));
        var yStep = Math.floor((progress / yFrame) - (actualY - oldY));

        // Corrects add variables if progress went a bit to far
        if ((xStep > 0 && actualX + xStep > x) ||
        (xStep < 0 && actualX + xStep < x)) {
            xStep = x - actualX;
        }
        if ((yStep > 0 && actualY + yStep > y) ||
        (yStep < 0 && actualY + yStep < y)) {
            yStep = y - actualY;
        }

        if (xStep != 0) {
            actualX += xStep;
            // Rewrites the lines with the new length.
            var l = _this.lines.length;
            var repeatedSpaces = "│" + " ".repeat(actualX-2) + "│";
            var repeatedLines = "─".repeat(actualX-2);
            for (var i = 0; i < l; i++) {
                if (i == 0) {
                    _this.lines[i].innerHTML = "┌" + repeatedLines + "┐";
                } else if (i == l-1) {
                    _this.lines[i].innerHTML = "└" + repeatedLines + "┘";
                } else {
                    _this.lines[i].innerHTML = repeatedSpaces;
                }
            }
        }

        if (yStep > 0) {
            actualY += yStep;

            // Inserts new nodes and characters.
            var l = _this.lines.length - 1;
            var repeatedSpaces = "│" + " ".repeat(actualX-2) + "│";
            for (var i = 0; i < yStep; i++) {
                var elem = document.createElement("p");
                elem.innerHTML = repeatedSpaces;
                div.insertBefore(elem, div.lastChild)
                // also keeps a reference to the element for future use.
                _this.lines.splice(l + i, 0, elem);
            }
        } else if (yStep < 0) {
            actualY += yStep;
            yStep *= -1;

            // Removes nodes
            for (var y = 0; y < yStep; y++) {
                div.removeChild(div.lastChild.previousElementSibling);
            }
            _this.lines.splice(_this.lines.length - 1 - yStep, yStep);
        }

        if (progress < _this.animDuration) {
            requestAnimationFrame(draw);
        }
        else {
            if (callback) callback();
        }
    }

    requestAnimationFrame(draw);

};
Box.prototype.reboot = function(callback) {
    /* Cleans every lines of the box from any text and elements that
       could be on screen by rewriting it */

    var repeatedLines = "─".repeat(this.x - 2);
    var repeatedSpaces = "│" + " ".repeat(this.x - 2) + "│";

    var l = this.lines.length;
    for (var i = 0; i < l; i++) {
        if (i == 0) {
            this.lines[i].innerHTML = "┌" + repeatedLines + "┐";
        } else if (i == l-1) {
            this.lines[i].innerHTML = "└" + repeatedLines + "┘";
        } else {
            this.lines[i].innerHTML = repeatedSpaces;
        }
    }

    if (callback) callback();

};
Box.prototype.cleanLines = function(lines) {
    /* Cleans only specified lines inside the box minus margins */

    var cleanLine = "│" + " ".repeat(this.x - 2) + "│";
    var i = this.marginY;
    var l = this.lines.length - 1 - i;

    if (lines != undefined && typeof lines == "number") {
        // Cleans only one line if argument is a number
        this.lines[i+lines].innerHTML = cleanLine;
    } else {
        // Cleans every inner lines if no argument is given
        // Else set specified lines for the for loop
        if (Array.isArray(lines)) {
            l = lines[1] + i;
            i += lines[0];
        }

        for (i; i <= l; i++) {
            this.lines[i].innerHTML = cleanLine;
        }
    }

};
Box.prototype.printChar = function(line, index, char) {
    function setCharAt(str, i, chr) {
        return str.substr(0,i) + chr + str.substr(i+chr.length);
    }

    var str = this.lines[line+this.marginY].innerHTML;
    this.lines[line+this.marginY].innerHTML = setCharAt(str, index+this.marginX, char);
};
Box.prototype.addTags = function(tag) {
    function setTagAt(str, openI, closeI, openTag, closeTag) {
        return str.substring(0,openI) + openTag + str.substring(openI, closeI) + closeTag + str.substr(closeI);
    }

    var opening = "<" + tag.type
    if (tag.class) {
        opening += " class='" + tag.class + "'";
    }
    if (tag.ref) {
        opening += " " + tag.ref;
    }
    opening += ">";
    var closing = "</" + tag.type + ">";

    var str = this.lines[tag.line+this.marginY].innerHTML;
    this.lines[tag.line+this.marginY].innerHTML = setTagAt(str, tag.open+this.marginX, tag.close+this.marginX, opening, closing);
};
Box.prototype.removeTags = function() {

    this.lines.forEach(function(p) {
        if (p.children) {
            var l = p.children.length;
            for (var i = 0; i < l; i++) {
                var index = p.innerHTML.indexOf("<");
                var txt = p.children[0].innerHTML;
                p.removeChild(p.children[0]);

                p.innerHTML = p.innerHTML.substr(0, index) + txt + p.innerHTML.substr(index);
            }
        }
    });
};
Box.prototype.drawError = function() {
    var div = document.getElementById(this.div);

    while (div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
    //var bod = document.getElementById("center");
    this.error = true;
    var err  = document.createElement("div");
    err.className += "error";
    div.appendChild(err);

    var elem = document.createElement("p");
    elem.innerHTML = "┌──────────────────────┐</br>│ /!\\ écran trop petit │</br>└──────────────────────┘";
    err.appendChild(elem);

    setTimeout(function() {
        div.removeChild(err);
    }, 2000);

};
