function Box() {
    // Define base information
    this.x = 0;
    this.y = 0;
    this.lines = [];
    this.error = false;

    var pageSize = this.getPageDimension();
    this.maxW = pageSize.w;
    this.maxH = pageSize.h;
    this.charaW = pageSize.charaW;
    this.charaH = pageSize.charaH;

}
Box.prototype.init = function(opt) {
    return new Promise ((resolve, reject) => {
        this.marginX = opt.marginX || 1;
        this.marginY = opt.marginY || 1;
        this.div = opt.divName;
        this.animDuration = opt.animDuration * 1000 || 300;

        var pageSize = this.getPageDimension();
        this.maxW = pageSize.w;
        this.maxH = pageSize.h;
        this.charaW = pageSize.charaW;
        this.charaH = pageSize.charaH;

        var boxSize = this.getBoxSize(opt);
        if (boxSize != null) {
            this.x = boxSize.x;
            this.y = boxSize.y;
            resolve();
        } else {
            reject("Écran trop petit !");
        }
    });
};
Box.prototype.getPageDimension = function() {
    /* Returns the page dimension in number of characters */

    // Get the size in pixel of a common character
    var chara = this.getCharacterDimension();

    // Define how many characters we can fit inside the window
    var pageW = Math.floor(window.innerWidth / chara.w);
    var pageH = Math.floor(window.innerHeight / chara.h);

    return {w: pageW, h: pageH, charaW: chara.w, charaH: chara.h};

};
Box.prototype.getCharacterDimension = function() {
    /* Creates an span element, return the height and the width of one
       character then delete it */

    var test = document.createElement("span");
    test.style.visibility = "hidden";
    document.getElementsByTagName("html")[0].appendChild(test);
    test.innerHTML = "|";

    var w = test.offsetWidth;
    var h = test.offsetHeight;

    test.parentNode.removeChild(test);

    return {w: w, h: h};

};
Box.prototype.getBoxSize = function (opt) {
    /* Returns the box size depending of the options given by the json object */

    function fromText(words, x) {
        /* Returns dimensions so a given text can be fully displayed in the
           user's window. A min x value is required to set the y value. */

        // Defines characters that should'nt be the first or the last
        // character of a line
        const nvrFirst = ["?", "!", ":", ";", "»"];
        const nvrLast = ["¿", "¡", "«"];

        var y = 1 + margsY;
        var lineLen = 0;
        // Simulates text formatting to get the height of the box
        for (let i = 0, word; word = words[i]; i++) {
            if (y > maxY) {
                // Box is already higher than the max height, try with a wider x
                if (x <= maxX) {
                    return fromText(words, x + 1);
                }
                else {
                    return null;
                }
            }

            let wordLen = word.length;
            let nextLineLen = lineLen === 0 ? wordLen : lineLen + 1 + wordLen;

            // TODO add the possibility of dealing with '&nbsp;' and '&#8239;' spaces
            if (word.indexOf("\n") > -1) {
                if (nextLineLen - "\n".length > x - margsX) {
                    y += 2;
                }
                else {
                    y += 1;
                }
                lineLen = 0;
            }
            else if (nextLineLen <= x - margsX) {
                lineLen = nextLineLen;
            }
            else {
                if (nvrFirst.indexOf(word) > -1 || nvrLast.indexOf(words[i-1]) > -1) {
                    lineLen = words[i-1].length + 1 + wordLen;
                }
                else {
                    lineLen = wordLen;
                }
                y += 1;
            }
        }

        return {"x" : x, "y" : y};
    }

    function fromRatio(ratio, y) {
        // Returns dimensions so that the box is homothetic to a given ratio.
        var x = Math.round(y * ratio);

        if (x <= maxX && x >= minX && y <= maxY && y >= minY){
            return checkOddOrEven(x, y);
        }
        else if (x > maxX && y - 1 >= minY) {
            return fromRatio(ratio, y - 1);
        }
        else {
            return null;
        }
    }

    function checkOddOrEven(x, y) {
        if (evenX !== undefined || evenY !== undefined) {
            if ((evenX === true && x % 2 != 0) || (evenX === false && x % 2 == 0)) {
                x -= 1;
            }
            if ((evenY === true && y % 2 != 0) || (evenY === false && y % 2 == 0)) {
                y -= 1;
            }
        }
        return {"x" : x, "y" : y};
    }

    const _this = this;
    const evenX = opt.evenX;
    const evenY = opt.evenY;
    const margsX = _this.marginX * 2;
    const margsY = _this.marginY * 2;

    var maxX = opt.maxX > _this.maxW ? _this.maxW : opt.maxX || _this.maxW;
    var maxY = opt.maxY > _this.maxH ? _this.maxH : opt.maxY || _this.maxH;
    var minX = opt.minX < margsX ? margsX : opt.minX || margsX;
    var minY = opt.minY < margsY ? margsY : opt.minY || margsY;

    if (maxX < minX || maxY < minY) {
        return null;
    }

    if (opt.hasOwnProperty("longestText")) {
        let words = opt.longestText.split(" ");
        let longestWord = words.reduce((a, b) => {
            if (b.length > a.length) {
                return b;
            } else {
                return a;
            }
        }).length;

        if (longestWord > minX) {
            return fromText(words, longestWord);
        }
        else {
            return fromText(words, minX);
        }
    }
    else if (opt.hasOwnProperty("ratio")) {
        var charaRatio = _this.charaH / this.charaW;
        var givenRatio = opt.ratio[0] / opt.ratio[1];
        var ratio = givenRatio * charaRatio;
        return fromRatio(ratio, maxY);
    }
    else {
        return checkOddOrEven(maxX, maxY);
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
Box.prototype.display = function() {
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

};
Box.prototype.draw = function() {
    /* Animation of the display of the box from previous size or scratch
       to the needed size in a given time. */

    return new Promise ((resolve, reject) => {

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
                for (let i = 0; i < l; i++) {
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
                for (let i = 0; i < yStep; i++) {
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
                for (let y = 0; y < yStep; y++) {
                    div.removeChild(div.lastChild.previousElementSibling);
                }
                _this.lines.splice(_this.lines.length - 1 - yStep, yStep);
            }

            if (progress < _this.animDuration) {
                requestAnimationFrame(draw);
            }
            else {
                resolve();
            }
        }

        requestAnimationFrame(draw);

    });

};
Box.prototype.remove = function() {
    /* Totally remove the box by deleting every nodes */
    const div = document.getElementById(this.div);

    const length = div.children.length;
    for (let n = 0; n < length; n++) {
        div.removeChild(div.lastChild);
    }

    this.lines = [];
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
Box.prototype.printOnLine = function(l, i, txt, insert) {
    /* Prints a string on the box at a specified line and index */

    // Adds the margins so the text remains in the writing zone
    i += this.marginX;
    l += this.marginY;
    // Gets previous line content
    var prevTxt = this.lines[l].innerHTML;

    // If insert is true don't overwrite the text
    var overwrite = insert ? 0 : txt.length;

    // Rewrites the line with new content
    var newLine = prevTxt.substr(0, i) + txt + prevTxt.substr(i + overwrite);

    this.lines[l].innerHTML = newLine;

};
Box.prototype.insertOnLine = function(l, i, txt, length) {
    // FIXME merge with printOnLine
    /* Prints a string on the box at a specified line and index by overwriting
    to a given length */

    // Adds the margins so the text remains in the writing zone
    i += this.marginX;
    l += this.marginY;
    // Gets previous line content
    var prevTxt = this.lines[l].innerHTML;

    // Rewrites the line with new content
    var newLine = prevTxt.substr(0, i) + txt + prevTxt.substr(i + length);

    this.lines[l].innerHTML = newLine;

};
Box.prototype.safePrint = function(l, i, txt, insert) {
    i += this.marginX;
    l += this.marginY;
    // Gets previous line content
    var prevTxt = this.lines[l].textContent;

    // If insert is true don't overwrite the text
    var overwrite = insert ? 0 : txt.length;

    // Rewrites the line with new content
    var newLine = prevTxt.substr(0, i) + txt + prevTxt.substr(i + overwrite);

    this.lines[l].textContent = newLine;

};
Box.prototype.addTags = function(tag) {
    /* Adds any tag to the box's writing zone */

    // Builds the tag structure from properties given by the tag object
    var opening = "<" + tag.type;
    // FIXME maybe throw an attributes object and loop on it
    if (tag.class) opening += " class='" + tag.class + "'";
    if (tag.ref) opening += " " + tag.ref;
    opening += ">";
    var closing = "</" + tag.type + ">";

    // Adds the margins
    var l = tag.line + this.marginY;
    var iOpen = tag.open + this.marginX;
    var iClose = tag.close + this.marginX;
    // Gets previous line content
    var prevTxt = this.lines[l].innerHTML;

    // Rewrites the line with the tag to include
    var newLine = prevTxt.substring(0, iOpen) + opening + prevTxt.substring(iOpen, iClose) + closing + prevTxt.substr(iClose);
    this.lines[l].innerHTML = newLine;

};
Box.prototype.removeTags = function(l) {
    /* Removes every or specific lines tags from the box but lets
    ** the content on the screen */
    const _this = this;

    function removeTagsOnLine(l) {
        var line = _this.lines[l]
        var length = line.children.length;
        if (length > 0) {
            let content = line.innerHTML;
            // Rewrites the line until there's no tags anymore
            for (let i = 0; i < length; i++) {
                let open = content.indexOf("<");
                let close = content.indexOf(">", content.indexOf(">")+1);
                let txt = line.children[i].innerHTML;

                content = content.substring(0, open) + txt + content.substr(close+1);
            }
            _this.lines[l].innerHTML = content;
        }
    }

    if (l === undefined) {
        let end = _this.lines.length;
        for (let i = 0; i < end; i++) removeTagsOnLine(i);
    } else if (!Array.isArray(l)) {
        removeTagsOnLine(l + _this.marginY);
    } else {
        let start = l[0] + _this.marginY;
        let end = l[1]  + _this.marginY;
        for (start; i <= end; i++) removeTagsOnLine(i);
    }

};
Box.prototype.drawError = function(message) {

    // FIXME need to rework the error handling
    const _this = this;
    const div = document.getElementById(_this.div);
    _this.error = true;

    while (div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
    _this.lines = [];

    var sentences = [];
    var sentence = "│ ";
    var width = 2;
    var longest = 0;
    message.split(" ").forEach(word => {
        let length = word.length;
        width += sentence.length > 2 ? length + 1 : length;
        if (width <= _this.maxW - 2) {
            sentence += sentence.length > 0 ? " " + word : word;
        } else {
            if (sentence.length + 2 > longest) longest = sentence.length + 2;
            sentences.push(sentence + " │");
            sentence = "│ ";
            width = 2;
        }
    });
    sentences.push(sentence + " │");
    if (sentence.length + 2 > longest) longest = sentence.length + 2;
    sentences.unshift("┌" + "─".repeat(longest - 2) + "┐");
    sentences.push("└" + "─".repeat(longest - 2) + "┘");

    var err  = document.createDocumentFragment("div");
    //err.className += "error";
    sentences.forEach(sentence => {
        let elem = document.createElement("p");
        elem.innerHTML = sentence;
        err.appendChild(elem);
    });

    div.appendChild(err);

};

Box.prototype.fill = function(txt) {
    var len = this.lines.length;
    for (var i = 0; i < len; i++) {
        this.lines[i].textContent = txt[i];
    }
}

Box.prototype.setupAnim = function(txt) {
    var len = this.lines.length;
    var extraSpace = (this.x - this.lines[0].textContent.length) / 2;
    extraSpace = " ".repeat(extraSpace)
    for (let i = 0; i < len; i++) {
        this.lines[i].textContent = extraSpace + this.lines[i].textContent + extraSpace;
    }

    // var extraHeigth = (this.y - len) / 2;
    // var emptyLine = "" + " ".repeat(this.x) + "";
    // var div = document.getElementById(this.div);
    // for (let i = 0; i < extraHeigth; i++) {
    //     let top = document.createElement("p");
    //     top.textContent = emptyLine;
    //     div.prepend(top);
    //     let bot = document.createElement("p");
    //     bot.textContent = emptyLine;
    //     div.append(bot);
    //
    // }
}
