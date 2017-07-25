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


}
Box.prototype.init = function(opt, content) {

    this.marginX = opt.marginX || 0;
    this.marginY = opt.marginY || 0;
    this.div = opt.divName;

    if (content) {
        this.content = content;
    }
    // Define the box dimension
    this.getPageDimension();


    if (opt.longestText) {
        this.getBoxSizeFromText(opt.longestText, opt.longestWord, opt.idealX);
    }
    else {
        this.getBoxSizeFromData(opt.idealX, opt.idealY, opt.minX, opt.minY);
    }

    if (opt.episodes) {
        this.episodes = opt.episodes;
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
    if (this.x == 0 || this.x > this.maxW) {
        while (div.hasChildNodes()) {
            div.removeChild(div.lastChild);
        }
        this.drawError();
        return;
    }

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

    var elem = document.createElement("p");
    one.innerHTML = "┌──────────────────────┐</br>│ /!\\ écran trop petit │</br>└──────────────────────┘";
    div.appendChild(elem);

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
                line.innerHTML = line.innerHTML.substr(0, line.innerHTML.length-2);
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
    for (let a = 0; a < self.x-2; a++) {
        cleanedLine += " ";
    }

    self.ps.forEach(function(line, i, array) {
        if (i > self.marginY && i < self.ps.length-self.marginY-1) {
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

    var opening = "<" + tag.type + " " + tag.ref + ">";
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
    console.log(this.x, this.y);
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



    console.log("lol");
    //var fill = setInterval(function() {
    //txt = [];
    for (var i = 0; i < self.y -self.marginY*2; i++) {
        if (i % 5 == 0) {
            console.log(chara.shift());
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
Box.prototype.menu = function() {
    var self = this;
    var div = document.getElementById(this.div);

    var pos = 1;
    for (var i = 0; i <= this.episodes; i++) {
        this.ps.forEach(function(line, index) {
            if (index < pos) line.innerHTML += " ".repeat(2);
            else if (index-pos == 0) line.innerHTML += "─┐";

            else if (i == 0) {
                    if (index-pos == 1) {
                        line.innerHTML += "<a class='ep' id='"+i+"'>"+i+"</a>│";
                    }
                    else line.innerHTML += " │";
            }
            else {
                    if (index-pos == 1) line.innerHTML += i+"│";
                    else if (index-pos == 4) {
                        line.innerHTML += "<a class='ep' id='"+i+"a'>a</a>│";
                    }
                    else if (index-pos == 6) {
                        line.innerHTML += "<a class='ep' id='"+i+"b'>b</a>│";
                    }
                    else line.innerHTML += " │";
            }

        });
        var elem = document.createElement("p");
        elem.innerHTML = " ".repeat(pos*2) + "└" + "─".repeat(this.x-2) + "┘";

        div.appendChild(elem);

        this.ps.push(elem);
        pos++;
    }


};
