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


function Box(options) {
    // Define base information
    this.x = 0;
    this.y = 0;
    this.spans = [];
    this.marginX = options.marginX || 0;
    this.marginY = options.marginY || 0;
    this.div = options.divName;

    this.init(options);
}
Box.prototype.init = function(options) {

    // Define the box dimension
    this.defineBoxDimension(options.longestText, options.longestWord, options.idealX);

    //var lines = this.setupBox(this.x, this.y);
    //this.drawBox(this.x, this.y, options.divName);

};
Box.prototype.defineBoxDimension = function(longestText, sizeOfLongestWord, idealX) {
    // Define the box dimensions (x, y) from window and texts informations

    function getCharaSize() {
        // Create an span element, return the height and the width of one
        // character then delete it
        var test = document.createElement("span");
        test.style.visibility = "hidden";
        document.body.appendChild(test);
        test.innerHTML = "|";

        var w = test.offsetWidth;
        var h = test.offsetHeight;

        test.parentNode.removeChild(test);

        return [w, h];
    }

    // Get size array of a common character
    var letterSize = getCharaSize();

    var pageW = window.innerWidth;
    var pageH = window.innerHeight;

    // Define how many characters we can fill inside the window (including margins)
    var maxW = parseInt(pageW / letterSize[0]);
    var maxH = parseInt(pageH / letterSize[1]);

    // Check if window can at least contain the longest word with box margin
    if (maxW < sizeOfLongestWord + this.marginX * 2) {
        console.log("SCREEN TO SMALL");
    }
    // Manage to fit the box in the window
    else {
        this.x = idealX + this.marginX*2;
        this.y = this.getBoxSizeFromText(longestText, maxW, maxH);
    }
};
Box.prototype.getBoxSizeFromText = function(txt, maxW, maxH) {
    var y = this.formatTxt(txt);
    if (y + this.marginY*2 > maxH && this.x > maxW) {
        return console.log("SCREEN TO SMALL");
    } else if (y + this.marginY*2 > maxH) {
        this.x++;
        return this.getBoxSizeFromText(txt, maxW, maxH);
    } else if (this.x > maxW) {
        this.x--;
        return this.getBoxSizeFromText(txt, maxW, maxH);
    }
    else {
        return y + this.marginY*2;
    }


}
Box.prototype.formatTxt = function(txt) {

    var line = 1;
    var index = 0;
    var dontEscape = ["?", "!", ":", ";"];

    var splittedTxt = txt.split(" ");

    var self = this;
    splittedTxt.forEach(function(word, i, array) {
        var newLine = false;

        var width = index == 0 ? index + word.length : index + 1 + word.length;

        if (word.indexOf("\n") > -1) {
            word = word.replace('\n', '');
            newLine = true;
            console.log("newline");
        }

        if (width <= self.x - self.marginX*2) {
            index += index == 0 ? word.length : 1 + word.length;
        }
        else if (dontEscape.indexOf(word) != -1) {
            var lastword = array[i-1];
            index = lastword.length + 1 + word.length;
        }
        else {
            line++;
            index = word.length;
        }

        if (newLine) {
            line++;
            index = 0;
        }

    });

    return line++;

};
Box.prototype.setupBox = function(x,y) {
    // Draw the box and display it on window

    function createLine(c1, c2, c3) {
        // Create a line of 'x' elements

        var line = c1;
        for(var i = 0; i < x -2; i++)
            line += c2;
        line += c3;

        return line;
    }

    var spans = [];

    for (var n = 0; n < y; n++) {
        if (n == 0) spans.push(createLine("┌","─","┐"));
        else if (n == y-1) spans.push(createLine("└","─","┘"));
        else spans.push(createLine("│"," ","│"));
    }

    return spans;

};
Box.prototype.displayBox = function(callback) {

    var boxLines = this.setupBox(this.x, this.y);

    var div = document.getElementById(this.div);

    var self = this;
    boxLines.forEach(function(line) {
        var elem = document.createElement("span");
        elem.innerHTML = line + "</br>";
        div.appendChild(elem);
        self.spans.push(elem);
    });

    if (callback) callback();
};
Box.prototype.drawBox = function(callback) {

    var div = document.getElementById(this.div);

    var one = document.createElement("span");
    var two = document.createElement("span");

    one.innerHTML = "┌┐";
    two.innerHTML = "└┘";

    div.appendChild(one);
    div.appendChild(two);

    this.spans.push(one, two);

    var self = this;
    var draw = setInterval(function() {
        if (self.spans.length < self.y) {

            var elem = document.createElement("span");

            var content = "│";
            for (var i = 0; i < self.spans[0].innerHTML.length-2; i++) {
                content += " ";
            }
            content += "│";

            elem.innerHTML = content;
            div.insertBefore(elem, div.lastChild);
            self.spans.splice(self.spans.length-1, 0, elem);
        }
        else {
            self.spans.forEach(function(span, i) {
                var str = span.innerHTML;
                if (i == 0 || i == self.spans.length-1) {
                    span.innerHTML = str.substr(0,1) + "─" + str.substr(1);
                }
                else {
                    span.innerHTML = str.substr(0,1) + " " + str.substr(1);
                }
            });
        }
        if (self.spans.length == self.y && self.spans[0].innerHTML.length == self.x) {
            clearInterval(draw);
            self.spans.forEach(function(span) {
                span.innerHTML += "</br>"
            });
            if (callback) callback();

        }

    }, 10);

};
Box.prototype.printChar = function(line, index, char) {
    function setCharAt(str, i, chr) {
        return str.substr(0,i) + chr + str.substr(i+1);
    }

    var str = this.spans[line+this.marginY].innerHTML;
    this.spans[line+this.marginY].innerHTML = setCharAt(str, index+this.marginX, char);
};
