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
    this.spans = [];


}
Box.prototype.init = function(opt) {

    this.marginX = opt.marginX || 0;
    this.marginY = opt.marginY || 0;
    this.div = opt.divName;

    // Define the box dimension
    this.getPageDimension();


    if (opt.longestText) {
        this.getBoxSizeFromText(opt.longestText, opt.longestWord, opt.idealX);
    }
    else {
        this.getBoxSizeFromData(opt.idealX, opt.idealY, opt.minX, opt.minY);
    }

    //var lines = this.setupBox(this.x, this.y);
    //this.drawBox(this.x, this.y, options.divName);

};
Box.prototype.getPageDimension = function() {
    // define the page dimension in number of characters

    function getCharDim() {
        // Create an span element, return the height and the width of one
        // character then delete it
        var test = document.createElement("span");
        test.style.visibility = "hidden";
        document.body.appendChild(test);
        test.innerHTML = "|";

        var w = test.offsetWidth;
        var h = test.offsetHeight;

        test.parentNode.removeChild(test);

        return {"w" : w, "h" : h};
    }

    // Get size array of a common character
    var char = getCharDim();

    var pageW = window.innerWidth;
    var pageH = window.innerHeight;

    // Define how many characters we can fit inside the window (including margins)
    this.maxW = parseInt(pageW / char.w);
    this.maxH = parseInt(pageH / char.h);
    //FIXME side effect function maybe not the best choice

};
Box.prototype.getBoxSizeFromData = function(idealX, idealY, minX, minY) {
    var self = this;

    function getDim() {
        if (self.x > self.maxW) {

            if (self.x-self.marginX*2 > minX) {
                self.x--;
                getDim();
            }

        }
        if (self.y > self.maxH && self.y-this.marginy*2 > minY) {
            self.y--;
            getDim();
        }
    }

    // Check if window can at least contain the longest word with box margin
    if (this.maxW < minX + this.marginX * 2) {
        console.log("SCREEN TO SMALL - need moar width");
    }
    else if (this.maxH < minY + this.marginY*2) {
        console.log("SCREEN TO SMALL - need moar heigth");
    }
    // Manage to fit the box in the window
    else {
        this.x = idealX + this.marginX*2;
        this.y = idealY + this.marginY*2;
        getDim();
    }

}
Box.prototype.getBoxSizeFromText = function(longestText, sizeOfLongestWord, idealX) {
    var self = this;
    function getDim(txt) {
        var y = self.formatTxt(txt);
        if (y + self.marginY*2 > self.maxH && self.x > self.maxW) {
            return console.log("SCREEN TO SMALL");
        } else if (y + self.marginY*2 > self.maxH) {
            self.x++;
            return getDim(txt);
        } else if (self.x > self.maxW) {
            self.x--;
            return getDim(txt);
        }
        else {
            return y + self.marginY*2;
        }
    }

    // Check if window can at least contain the longest word with box margin
    if (this.maxW < sizeOfLongestWord + this.marginX * 2) {
    }
    // Manage to fit the box in the window
    else {
        this.x = idealX + this.marginX*2;
        this.y = getDim(longestText);
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

    if (this.x == 0) {
        this.drawError();
        return;
    }

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

    if (this.x == 0) {
        this.drawError();
        return;
    }

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
Box.prototype.reDraw = function(callback) {
    var div = document.getElementById(this.div);
    if (this.x == 0 || this.x > this.maxW) {
        while (div.hasChildNodes()) {
            div.removeChild(div.lastChild);
        }
        this.drawError();
        return;
    }

    var self = this;
    self.spans.forEach(function(span, i) {
        if (span.innerHTML.indexOf("<br>") > -1) {
            span.innerHTML = span.innerHTML.replace("<br>", "");
        }

    });
    var draw = setInterval(function() {
        if(self.spans.length != self.y) {
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
                self.spans.splice(self.spans.length-2, 1);
                div.removeChild(div.childNodes[div.childNodes.length-2]);
            }
        }
        else if (self.spans[0].innerHTML.length != self.x) {
            if (self.spans[0].innerHTML.length < self.x) {
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
            else {
                self.spans.forEach(function(span, i) {
                    var str = span.innerHTML;

                    span.innerHTML = str.substr(0,1) + str.substr(2);

                });
            }
        }

        else  {
            clearInterval(draw);
            self.spans.forEach(function(span) {
                span.innerHTML += "</br>";
            });
            if (callback) callback();

        }

    }, 10);
};
Box.prototype.drawError = function() {
    var div = document.getElementById(this.div);

    var one = document.createElement("span");

    one.innerHTML = "┌──────────────────────┐</br>│ /!\\ écran trop petit │</br>└──────────────────────┘";

    div.appendChild(one);

};
Box.prototype.cleanBox = function(callback) {
    var self = this;

    cleanedLine = "";
    for (let a = 0; a < self.x-2; a++) {
        cleanedLine += " ";
    }

    self.spans.forEach(function(line, i, array) {
        if (i > self.marginY && i < self.spans.length-self.marginY-1) {
            let str = line.innerHTML;
            let start = str.indexOf("│");
            let end = str.lastIndexOf("│");

            line.innerHTML =  str[start] + cleanedLine + str.substr(end);
        }
    });

    if (callback) {
        callback();
    }

};
Box.prototype.rebootLine = function(line) {
    var space = "";
    if (!String.prototype.repeat)
        for (var a = 0; a < this.x-2; a++) space += " ";
    else space = " ".repeat(this.x-2);

    let str = this.spans[line+this.marginY].innerHTML;
    let start = str.indexOf("│");
    let end = str.lastIndexOf("│");

    this.spans[line+this.marginY].innerHTML =  str[start] + space + str.substr(end);

};
Box.prototype.printChar = function(line, index, char) {
    function setCharAt(str, i, chr) {
        return str.substr(0,i) + chr + str.substr(i+chr.length);
    }

    var str = this.spans[line+this.marginY].innerHTML;
    this.spans[line+this.marginY].innerHTML = setCharAt(str, index+this.marginX, char);
};
Box.prototype.addTags = function(tag) {
    function setTagAt(str, openI, closeI, openTag, closeTag) {
        return str.substring(0,openI) + openTag + str.substring(openI, closeI) + closeTag + str.substr(closeI);
    }

    var opening = "<" + tag.type + " " + tag.ref + ">";
    var closing = "</" + tag.type + ">";

    var str = this.spans[tag.line+this.marginY].innerHTML;
    this.spans[tag.line+this.marginY].innerHTML = setTagAt(str, tag.open+this.marginX, tag.close+this.marginX, opening, closing);
};



Box.prototype.fillScreen = function() {
    console.log(this.x, this.y);
    var self = this;

var chara = [
     "⠀","⠁","⠂","⠃","⠄","⠅","⠆","⠇","⠈","⠉","⠊","⠋","⠌","⠍","⠎","⠏",
     "⠐","⠑","⠒","⠓","⠔","⠕","⠖","⠗","⠘","⠙","⠚","⠛","⠜","⠝","⠞","⠟",
     "⠠","⠡","⠢","⠣","⠤","⠥","⠦","⠧","⠨","⠩","⠪","⠫","⠬","⠭","⠮","⠯",
     "⠰","⠱","⠲","⠳","⠴","⠵","⠶","⠷","⠸","⠹","⠺","⠻","⠼","⠽","⠾","⠿"

    // " ", "─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼", "╭", "╮", "╯", "╰", "╴", "╵", "╶", "╷"
    //"#", "/", "'", ".", ",", "%", "~", "-", "*", "~", "-", "*","~", "-", "*"
    //" ", " "," "," "," ","─", "│", "├", "┤", "┬", "┴", "┼"
]
    //var txt = [];
    function getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }



    console.log("lol");
    var fill = setInterval(function() {
        //txt = [];
        for (var i = 0; i < self.y -self.marginY*2; i++) {
            var sentence = "";
            for (var j = 0; j < self.x - self.marginX*2; j++) {
                var c = getRandomArbitrary(0, chara.length);
                sentence += chara[c];
            }
            self.printChar(i, 0, sentence);
        }

        // txt.forEach(function(sentence, line) {
        //     self.printChar(line, 0, sentence);
        // });

    }, 10);

}
