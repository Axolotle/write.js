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
    this.ps = [];
    this.error = false; //FIXME needed ?

}
Box.prototype.init = function(opt) {

    this.marginX = opt.marginX || 1;
    this.marginY = opt.marginY || 1;
    this.div = opt.divName;

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
    // return the page dimension in number of characters

    // Get the size in pixel of a common character
    var chara = this.getCharacterDimension();

    // Define how many characters we can fit inside the window
    var pageW = Math.floor(window.innerWidth / chara.w);
    var pageH = Math.floor(window.innerHeight / chara.h);

    return {"w" : pageW, "h" : pageH};

};
Box.prototype.getCharacterDimension = function() {
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

};
Box.prototype.getBoxSize = function (opt) {
    // Return the box size depending of the options given by the json object

    var _this = this;
    var maxX, maxY, minX, minY;

    if (opt.minX && typeof opt.minX == "string") {
        // if the minX option is a word or en sentence, get its length
        minX = opt.minX.length;
    } else {
        minX = opt.minX ? opt.minX : this.marginX * 2;
    }
    minY = opt.minY ? opt.minY : this.marginY * 2;

    if (this.maxW < minX || this.maxH < minY) {
        // required minimum size can't be obtained
        return null;
    }

    // define min & max from given values and page dimensions
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
                // box is already higher than the window, try with a wider x
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

    var ps = [];

    for (var n = 0; n < y; n++) {
        if (n == 0) ps.push(createLine("┌","─","┐"));
        else if (n == y-1) ps.push(createLine("└","─","┘"));
        else ps.push(createLine("│"," ","│"));
    }

    return ps;

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
        var elem = document.createElement("p");
        elem.innerHTML = line;
        div.appendChild(elem);
        self.ps.push(elem);
    });

    if (callback) callback();
};
Box.prototype.drawBox = function(callback) {

    if (this.x == 0) {
        this.drawError();
        return;
    }

    var div = document.getElementById(this.div);

    var one = document.createElement("p");
    var two = document.createElement("p");

    one.innerHTML = "┌┐";
    two.innerHTML = "└┘";

    div.appendChild(one);
    div.appendChild(two);

    this.ps.push(one, two);

    var self = this;
    var draw = setInterval(function() {
        if (self.ps.length < self.y) {

            var elem = document.createElement("p");

            var content = "│";
            for (var i = 0; i < self.ps[0].innerHTML.length-2; i++) {
                content += " ";
            }
            content += "│";

            elem.innerHTML = content;
            div.insertBefore(elem, div.lastChild);
            self.ps.splice(self.ps.length-1, 0, elem);
        }
        else {
            self.ps.forEach(function(ps, i) {
                var str = ps.innerHTML;
                if (i == 0 || i == self.ps.length-1) {
                    ps.innerHTML = str.substr(0,1) + "─" + str.substr(1);
                }
                else {
                    ps.innerHTML = str.substr(0,1) + " " + str.substr(1);
                }
            });
        }
        if (self.ps.length == self.y && self.ps[0].innerHTML.length == self.x) {
            clearInterval(draw);
            self.ps.forEach(function(ps) {
                ps.innerHTML += "";
            });
            if (callback) callback();

        }

    }, 10);

};
Box.prototype.reDraw = function(callback) {
    var div = document.getElementById(this.div);

    var self = this;
    var draw = setInterval(function() {
        if(self.ps.length != self.y) {
            if (self.ps.length < self.y) {

                var elem = document.createElement("p");

                var content = "│";
                for (var i = 0; i < self.ps[0].innerHTML.length-2; i++) {
                    content += " ";
                }
                content += "│";

                elem.innerHTML = content;
                div.insertBefore(elem, div.lastChild);
                self.ps.splice(self.ps.length-1, 0, elem);
            }
            else {
                self.ps.splice(self.ps.length-2, 1);
                div.removeChild(div.childNodes[div.childNodes.length-2]);
            }
        }
        else if (self.ps[0].innerHTML.length != self.x) {
            if (self.ps[0].innerHTML.length < self.x) {
                self.ps.forEach(function(ps, i) {
                    var str = ps.innerHTML;
                    if (i == 0 || i == self.ps.length-1) {
                        ps.innerHTML = str.substr(0,1) + "─" + str.substr(1);
                    }
                    else {
                        ps.innerHTML = str.substr(0,1) + " " + str.substr(1);
                    }
                });
            }
            else {
                self.ps.forEach(function(ps, i) {
                    var str = ps.innerHTML;

                    ps.innerHTML = str.substr(0,1) + str.substr(2);

                });
            }
        }

        else  {
            clearInterval(draw);
            // self.ps.forEach(function(span) {
            //     ps.innerHTML += "</br>";
            // });
            if (callback) callback();

        }

    }, 10);
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
Box.prototype.resetBox = function(callback) {
    var self = this;

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function removeRow() {
        var div = document.getElementById(self.div);

        while (self.ps.length > self.y) {
            div.removeChild(div.lastChild);
            self.ps.pop();

            self.ps.forEach(function(line, i, array) {
                if (line.innerHTML.length > self.x) {
                    line.innerHTML = line.innerHTML.substr(0, line.innerHTML.length-2);
                }

            });
            await sleep(10);
        }
    }

    self.removeTags();
    removeRow();

};
Box.prototype.cleanBox = function(callback) {
    var self = this;

    cleanedLine = "";
    if (!String.prototype.repeat) {
        for (let a = 0; a < self.x-2; a++) cleanedLine += " ";
    }
    else cleanedLine = " ".repeat(self.x-2);

    self.ps.forEach(function(line, i) {
        if (i >= self.marginY && i < self.ps.length-self.marginY) {
            line.innerHTML = "│" + cleanedLine + "│";
        }
    });

    if (callback) {
        callback();
    }

};
Box.prototype.rebootLine = function(line) {
    var space = "";
    if (!String.prototype.repeat) {
        for (let a = 0; a < this.x-2; a++) space += " ";
    }
    else space = " ".repeat(this.x-2);

    let str = this.ps[line+this.marginY].innerHTML;
    let start = str.indexOf("│");
    let end = str.lastIndexOf("│");

    this.ps[line+this.marginY].innerHTML =  str[start] + space + str.substr(end);

};
Box.prototype.printChar = function(line, index, char) {
    function setCharAt(str, i, chr) {
        return str.substr(0,i) + chr + str.substr(i+chr.length);
    }

    var str = this.ps[line+this.marginY].innerHTML;
    this.ps[line+this.marginY].innerHTML = setCharAt(str, index+this.marginX, char);
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

    var str = this.ps[tag.line+this.marginY].innerHTML;
    this.ps[tag.line+this.marginY].innerHTML = setTagAt(str, tag.open+this.marginX, tag.close+this.marginX, opening, closing);
};
Box.prototype.removeTags = function() {

    this.ps.forEach(function(p) {
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


Box.prototype.fillScreen = function() {
    var self = this;

    var chara = [
        //  "⠀","⠁","⠂","⠃","⠄","⠅","⠆","⠇","⠈","⠉","⠊","⠋","⠌","⠍","⠎","⠏",
        //  "⠐","⠑","⠒","⠓","⠔","⠕","⠖","⠗","⠘","⠙","⠚","⠛","⠜","⠝","⠞","⠟",
        //  "⠠","⠡","⠢","⠣","⠤","⠥","⠦","⠧","⠨","⠩","⠪","⠫","⠬","⠭","⠮","⠯",
        //  "⠰","⠱","⠲","⠳","⠴","⠵","⠶","⠷","⠸","⠹","⠺","⠻","⠼","⠽","⠾","⠿"

        " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
        " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
        " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ",
        " ", "─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼", "╭", "╮", "╯",
        "╰", "╴", "╵", "╶", "╷"
        //"#", "/", "'", ".", ",", "%", "~", "-", "*", "~", "-", "*","~", "-", "*"
        //" ", "─", "│", "├", "┤", "┬", "┴", "┼"
    ]
    //var txt = [];
    function getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }



    //var fill = setInterval(function() {
    //txt = [];
    for (var i = 0; i < self.y -self.marginY*2; i++) {
        if (i % 5 == 0) {
            //chara.shift();
        }
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

    //}, 100);

};
