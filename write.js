function ModifyJSON(obj, jsonObj, box) {

    this.init(obj, jsonObj, box);

}
ModifyJSON.prototype.init = function(obj, jsonObj, box) {

    this.speed = obj.speed || 70;
    this.cleanSpeed = obj.cleanSpeed || this.speed/2;
    this.startAt = obj.startAt || [0,0];


    if (obj.cleanAt) this.cleanAt = obj.cleanAt;
    if (obj.noClearingSpace) this.noClearingSpace = true;
    if (obj.onTheBox) this.onTheBox = true;

    if (Array.isArray(obj.txt)) {
        if (obj.format == "combine") {
            this.txt = this.combineSentences(obj.txt, box, obj.pause);
        }
        else {
            this.txt = this.centerSentences(obj.txt, obj.charToAdd, box, jsonObj);
        }
    }
    else {
        this.txt = this.defineSentences(obj.txt, box.x-box.marginX*2, jsonObj);
    }
};
ModifyJSON.prototype.centerSentences = function(txt, char, box, jsonObj) {
    var self = this;

    function generateCharLine(n, elem) {
        var charLine = "";
        for (var i = 0; i < n; i++) {
            charLine += elem;
        }
        return charLine;
    }
    var y = box.y - box.marginY*2;
    var x = this.onTheBox ? box.x : box.x - box.marginX*2;


    var yToAdd = y - txt.length;
    var xToAdd = 0;

    var sentences = [];

    for (var i = 0; i < Math.floor(yToAdd/2); i++) {
        sentences.push(generateCharLine(x, char));
    }

    txt.forEach(function(line) {
        var isTag = false;
        var tags = [];

        if (line.indexOf("<r>") != -1) {
            line = generateCharLine(x, line.replace("<r>", ""));
        }
        if (line.indexOf("<a") != -1) {
            isTag = true;

            let tag = {}
            tag.line = sentences.length;
            tag.open = line.indexOf("<");
            tag.type = line.substr(tag.open+1, 1);
            tag.ref = line.substring(line.indexOf(tag.type)+2, line.indexOf(">"))
            line = line.substr(line.indexOf(">")+1);
            tag.close = line.indexOf("<", tag.open+1);
            line = line.substring(0,line.indexOf("<"))

            tags.push(tag);
        }

        xToAdd = x - line.length;
        var sentence = "";



        sentence += generateCharLine(Math.ceil(xToAdd/2), char);
        if (isTag) {
            if (self.tags == undefined) {
                self.tags = [];
            }
            tags.forEach(function(tag) {
                tag.open += sentence.length;
                tag.close += sentence.length;
                self.tags.push(tag)
            });

        }
        sentence += line;
        sentence += generateCharLine(Math.floor(xToAdd/2), char);

        sentences.push(sentence);
    });

    for (var i = 0; i < Math.ceil(yToAdd/2); i++) {
        sentences.push(generateCharLine(x, char));
    }

    return sentences;
};
ModifyJSON.prototype.combineSentencesSAVE = function(txts, box, pause) {
    var self = this;

    var sentences = [];
    var starters = [[0,0]];

    txts.forEach(function(txt, txtIndex) {
        var t = "";

        if (txtIndex != 0) {
            let previousTxt = starters[txtIndex][0];
            let previousIndex = starters[txtIndex][1];
            // FIXME added 1 to previousIndex to keep the space
            t += sentences[previousTxt].substr(0, previousIndex);
        }

        while (txt.indexOf("<") != -1) {
            var startIndex = txt.indexOf("<");
            var endIndex = txt.indexOf(">");

            var tag = parseInt(txt.substring(startIndex+2, endIndex));
            starters[tag] = [txtIndex, startIndex+t.length];
            txt = txt.substr(0,startIndex) + txt.substr(endIndex+1);
        }

        t += txt;
        sentences.push(t);
    });
    sentences.forEach(function(sentence, i) {
        if (i == pause) {
            sentence = sentence.substr(0,starters[i][1]) +"<p><t"+i+">" + sentence.substr(starters[i][1]);
        }
        else {
            sentence = sentence.substr(0,starters[i][1]) + "<t"+i+">" + sentence.substr(starters[i][1]);
        }
        console.log(sentence);
        sentences[i] = self.defineSentences(sentence, box.x-box.marginX*2);
    });
    console.log(sentences);
    return sentences;
};
ModifyJSON.prototype.combineSentences = function(txts, box, pause) {
    var self = this;

    var sentences = [];
    var starters = [[0,0]];

    txts.forEach(function(txt, txtIndex) {
        var t = "";

        if (txtIndex != 0) {
            let previousTxt = starters[txtIndex][0];
            let previousIndex = starters[txtIndex][1];
            // FIXME added 1 to previousIndex to keep the space
            t += sentences[previousTxt].substr(0, previousIndex+1);
        }

        while (txt.indexOf("<") != -1) {
            var startIndex = txt.indexOf("<");
            var endIndex = txt.indexOf(">");

            var tag = parseInt(txt.substring(startIndex+2, endIndex));
            starters[tag] = [txtIndex, startIndex+t.length];
            txt = txt.substr(0,startIndex) + txt.substr(endIndex+1);
        }

        t += txt;
        sentences.push(t);
    });
    sentences.forEach(function(sentence, i) {
        if (i == pause) {
            sentence = sentence.substr(0,starters[i][1]) +"<p><t"+i+">" + sentence.substr(starters[i][1]);
        }
        else {
            sentence = sentence.substr(0,starters[i][1]) + "<t"+i+">" + sentence.substr(starters[i][1]);
        }
        sentences[i] = self.defineSentences(sentence, box.x-box.marginX*2);
        console.log(sentences[i]);
    });

    return sentences;
};
ModifyJSON.prototype.defineSentences = function(txt, x, jsonObj) {
    var line = this.startAt[0],
        index = this.startAt[1];
    var sentence = [],
        sentences = [];

    var dontEscape = ["?", "!", ":", ";"];

    var splittedTxt = txt.split(" ");

    var self = this;
    splittedTxt.forEach(function(word) {
        //console.log(sentences, line);
        var isTag = false;
        var tags = {};
        var newLine = false;

        if (word.indexOf("<") != -1) {
            isTag = true;

            while (word.indexOf("<") != -1) {
                var startIndex = word.indexOf("<");
                var endIndex = word.indexOf(">");
                var tag = word.substring(startIndex+1, endIndex);
                tags[tag] = startIndex ;
                console.log(tag, line, sentences.length);
                if (tag == "t10") {
                    console.log();
                }

                word = word.substr(0,startIndex) + word.substr(endIndex+1);
            }


        }

        //var width = index + 1 + word.length;
        var width = index == 0 ? index + word.length : index + 1 + word.length;

        if (word.indexOf("\n") > -1) {
            word = word.replace('\n', '');
            newLine = true;
        }
        if (width <= x) {
            sentence.push(word);

            //if (index != 0) index += 1 + word.length;
            //else index += word.length;
            index += index == 0 ? word.length : 1 + word.length;
        }
        else if (dontEscape.indexOf(word) > -1) {
            var lastword = sentence.pop();
            sentences.push(sentence);

            sentence = [lastword, word];
            line++;
            index = lastword.length + 1 + word.length;
        }
        else {
            sentences.push(sentence);
            sentence = [word];
            line++;
            index = word.length;
        }

        if (newLine) {
            sentences.push(sentence);
            line++;
            sentence = [];
            index = 0;
        }
        if (isTag) {
            for (var tag in tags) {
                if (tags.hasOwnProperty(tag)) {
                    var pos = [line, index - word.length + tags[tag]];
                    console.log("position", pos);
                    self.manageTags(tag, pos, jsonObj);
                }
            }
        }

    });

    sentences.push(sentence);

    return this.wordsArrayToStringArray(sentences);

};
ModifyJSON.prototype.defineSentencesSAVE = function(txt, x, jsonObj) {
    var line = this.startAt[0],
        index = this.startAt[1];
    var sentence = [],
        sentences = [];

    var dontEscape = ["?", "!", ":", ";"];

    var splittedTxt = txt.split(" ");

    var self = this;
console.log(txt);
    splittedTxt.forEach(function(word) {
        var isTag = false;
        var tags = {};
        var newLine = false;

        if (word.indexOf("<") != -1) {
            isTag = true;

            while (word.indexOf("<") != -1) {
                var startIndex = word.indexOf("<");
                var endIndex = word.indexOf(">");
                var tag = word.substring(startIndex+1, endIndex);
                tags[tag] = startIndex ;
                console.log(tag, line, sentences.length);
                if (tag == "t10") {
                    console.log();
                }

                word = word.substr(0,startIndex) + word.substr(endIndex+1);
            }


        }

        //var width = index + 1 + word.length;
        var width = index == 0 ? index + word.length : index + 1 + word.length;

        if (word.indexOf("\n") > -1) {
            word = word.replace('\n', '');
            newLine = true;
        }
        if (width <= x) {
            sentence.push(word);

            //if (index != 0) index += 1 + word.length;
            //else index += word.length;
            index += index == 0 ? word.length : 1 + word.length;
        }
        else if (dontEscape.indexOf(word) > -1) {
            var lastword = sentence.pop();
            sentences.push(sentence);

            sentence = [lastword, word];
            index = lastword.length + 1 + word.length;
        }
        else {
            sentences.push(sentence);
            sentence = [word];
            line++;
            index = word.length;
        }

        if (newLine) {
            sentences.push(sentence);
            line++;
            sentence = [];
            index = 0;
        }
        if (isTag) {
            for (var tag in tags) {
                if (tags.hasOwnProperty(tag)) {
                    var pos = [line, index - word.length + tags[tag]];
                    console.log("position", pos);
                    self.manageTags(tag, pos, jsonObj);
                }
            }
        }

    });

    sentences.push(sentence);

    return this.wordsArrayToStringArray(sentences);

};
ModifyJSON.prototype.manageTags = function (tag, pos, jsonObj) {

    //console.log(tag, pos);
    // starting at (startAt) tag <s>
    if (tag[0] == "s") {
        var n = parseInt(tag.substr(1));
        jsonObj[n].startAt = pos;
    }
    else if (tag[0] == "t") {
        var n = parseInt(tag.substr(1));
        if (!this.checkPoint) {
            this.checkPoint = [];
        }
        this.checkPoint[n] = pos;
    }
    // cleaning at (cleanAt) tag <c>
    else if (tag[0] == "c") {
        // get the obj index to refer to
        var n = parseInt(tag.substr(1,tag.indexOf("-")));
        // get the character and convert it into an array index ("a" = 0, ...)
        var ref = tag.substr(tag.indexOf("-")+1, 1).charCodeAt(0) - 97;
        // get the cleaning or end characters
        var infos = tag.substr(tag.indexOf("-")+2);

        // possible FIXME, not very elegant
        if (jsonObj[n].cleanAt === undefined) {
            jsonObj[n].cleanAt = [];
        }
        if (jsonObj[n].cleanAt[ref] === undefined) {
            jsonObj[n].cleanAt[ref] = [];
        }
        if (jsonObj[n].cleanAt[ref-1] === undefined) {
            jsonObj[n].cleanAt[ref-1] = [];
        }

        if (infos == "/") {
            jsonObj[n].cleanAt[ref][1] = pos;
        }
        else {
            // get the character between the simple quotes
            var char = infos.substr(1, infos.length-2);

            // check if the previous cleaning "end" index is already defined
            // this allow the user to chain cleaning tags without closing them
            if (ref >= 1 && !Array.isArray(jsonObj[n].cleanAt[ref-1][1])) {
                jsonObj[n].cleanAt[ref-1][1] = pos;
            }
            jsonObj[n].cleanAt[ref][2] = char;
            jsonObj[n].cleanAt[ref][0] = pos;
        }


    }
    // Speed alteration (altSpeed) tag <m>
    else if (tag[0] == "m") {
        var speed;
        if (tag[1] == "+") {
            speed = tag.substr(tag.indexOf("+")+1);
            speed = this.speed - (parseInt(speed)*20);
        }
        else if (tag[1] == "-") {
            speed = tag.substr(tag.indexOf("-")+1);
            speed = this.speed + parseInt(speed*20);
        }
        else {
            speed = this.speed;
        }
        if (this.altSpeed === undefined) {
            this.altSpeed = [];
        }
        this.altSpeed.push([pos, speed]);
    }
    // Pause (pauses) tag
    else if (tag[0] == "p") {
        if (this.pause === undefined) {
            this.pause = [];
        }
        var pause = parseFloat(tag.substr(1));
        if (pause == undefined) pause = 1;
        this.pause.push([pos, pause*1000]);
    }

};
ModifyJSON.prototype.wordsArrayToStringArray = function(wordsArray) {
    var sentences = wordsArray.map(function(words) {
        return words.join(" ");
    });
    return sentences;

};







function Animation(obj, box) {
    this.init(obj, box);
}
Animation.prototype.init = function(obj, box) {

    this.cleanSpeed = obj.cleanSpeed;

    if (obj.cleanAt) this.cleanAt = obj.cleanAt;
    if (obj.noClearingSpace) this.noClearingSpace = obj.noClearingSpace;
    if (obj.onTheBox) this.onTheBox = true;
    if (obj.tags) this.tags = obj.tags;
    if (obj.checkPoint) this.checkPoint = obj.checkPoint;

    this.startAt = obj.startAt;
    this.altSpeed = obj.altSpeed || [];
    this.pause = obj.pause || [];

    // FIXME string to char on specific method
    this.txt = obj.txt;

    this.box = box;
    this.speed = obj.speed;

    // define stop attribut and listener that will stop any running function
    this.stop = false;
    this.stopListener();
};
Animation.prototype.stopListener = function() {
    // Generic stop method triggering the clearInterval of timed animation
    // Events dependant methods still needs to listen to the stop event
    var self = this;

    function stop() {
        self.stop = true;
        window.removeEventListener("stop", stop);
    }

    window.addEventListener("stop", stop);
};
Animation.prototype.formatStringsToIndieChar = function(sentences) {

    var t = sentences.map(function(sentence) {
        return sentence.split("");
    });

    return t;

};
Animation.prototype.writeText = function(callback) {

    this.txt = this.formatStringsToIndieChar(this.txt);

    var line = this.startAt[0];
    var index = this.startAt[1];

    if (this.onTheBox) {
        index -= this.box.marginX;
    }

    var l = 0;
    var i = 0;

    var speed = this.speed;

    var self = this;
    var write = function() {
        if (self.stop) {
            return;
        }

        if (self.pause[0] != undefined && l == self.pause[0][0][0] && index == self.pause[0][0][1]) {
            var pause = self.pause.shift();
            if (pause != undefined) {
                setTimeout(write, pause[1]);
            }
        }
        else {
                if (self.altSpeed[0] != undefined && l == self.altSpeed[0][0][0] && index == self.altSpeed[0][0][1]) {
                    speed = self.altSpeed[0][1];
                    self.altSpeed.shift();
                }

            var shift = self.txt[l].shift();


            if (shift == undefined) {
                if (l >= self.txt.length - 1) {
                    if (callback)
                        callback();
                        return;
                }
                else {
                    self.cleanEndOfLine(line, index, " ");
                    line++;
                    l++;
                    index = 0;
                    if (self.onTheBox) {
                        index -= self.box.marginX;
                    }
                }
                setTimeout(write, speed);
                return;
            }
            if (shift == "\\") {
                if (index == 0) {
                    setTimeout(write, speed);
                    return;
                }
                else shift = " ";
            }
            if (shift == " " && self.noClearingSpace) {
                setTimeout(write, speed);
                index++;
                return;
            }
            self.box.printChar(line, index, shift);

            index++;
            setTimeout(write, speed);

        }

    }
    write();

};
Animation.prototype.appendText = function(callback) {
    var self = this;
    this.txt.forEach(function(line, i) {
        self.box.printChar(i, 0, line);
    });

    if (self.tags) {
        self.tags.forEach(function(tag) {
            self.box.addTags(tag);
        })
    }
    if (callback) {
        callback();
    }
};
Animation.prototype.addWordSAVE = function(removeListeners, callback) {
    // Setup listeners for adding and removing words of a text

    // This prototype takes two callback functions : one to remove the listeners
    // that triggers "add" and "remove" events from the outside the Animation
    // object, and another optional one that will execute the next given step

    var self = this;

    this.txt.forEach(function(txts, i) {
         txts.forEach(function(sentences, j) {
             self.txt[i][j] = sentences.split(" ");
         });
    });

    var n = l = i = index = 0;
    var end = false;
    var check = false;
    // use pause tag to define an line/index from where the user can't go back
    var pointOfNoReturn = self.pause[0][0];

    var lastEnding = [];

    window.addEventListener("remove", remove);
    window.addEventListener("add", add);
    window.addEventListener("stop", function() {
        stop(removeListeners);
    });

    function stop(next) {
        window.removeEventListener("remove", remove);
        window.removeEventListener("add", add);
        removeListeners();
        if (next) {
            next();
        }
    }


    function crossOut(start, ending, oneLine) {
        var tag = { "type" : "s" };

        if (start[0] == ending[0]) {
            tag.line = start[0];
            tag.open = start[1];
            tag.close = ending[1];
            self.box.addTags(tag);
        }
        else {
            for (var z = ending[0]; z >= start[0]; z--) {
                tag.line = z;
                if (z == start[0]) {
                    tag.open = start[1];
                    tag.close = lastEnding[z]-1;
                }
                else if (z == ending[0]) {
                    tag.open = 0;
                    tag.close = ending[1];
                }
                else {
                    tag.open = 0;
                    tag.close = lastEnding[z]-1;
                }

                self.box.addTags(tag);
            }
        }



    }

    function add() {
        var nextWord = self.txt[n][l][i];

        if (nextWord == undefined) {
            if (self.txt[n][l+1] == undefined) {
                if (!end && self.txt[n+1] != undefined) {
                    end = true;
                    console.log(self.checkPoint[n+1], [l, index-1]);
                    crossOut(self.checkPoint[n+1], [l, index-1]);
                }
                // removes method's listeners and throws the callback (wich removes the keyboard or mouse listeners) when last text is finished (then eventually throw another callback for next action)
                else if (n == self.txt.length-1){
                    stop(callback);
                }
                return;
            }
            else {
                lastEnding.push(index);
                l++;
                i = index = 0;

                nextWord = self.txt[n][l][i];
            }
        }

        if (end) {
            // delete line content
            self.box.rebootLine(l);
            // reprint line as it was without the <s> tag
            self.box.printChar(l, 0, self.txt[n][l].slice(0,i).join(" "));
            // print the next word
            self.box.printChar(l, index, nextWord);
            index += nextWord.length + 1;
            i++;
            //if (index-1 <= self.box.x - self.box.marginX*2) {
            // if line is the first line of the next text, only cross out previous text
                if (l == self.checkPoint[n+1][0] && index >= self.checkPoint[n+1][1]) {
                    crossOut(self.checkPoint[n+1], [l,index-1]);
                }
                else {
                    crossOut([l,0], [l,index-1]);
                }
            //}
        }
        else {
            self.box.printChar(l, index, nextWord);
            index += nextWord.length + 1;
            i++;
        }

    }

    function remove() {
        if (l == pointOfNoReturn[0] && index < pointOfNoReturn[1]+1) {
            return;
        }

        var lastWord = self.txt[n][l][i-1];
        if (lastWord == undefined) {
            if (l <= 0) {
                return;
            }
            else {
                l--;
                i = self.txt[n][l].length-1 ;
                lastWord = self.txt[n][l][i];
                index = lastEnding.pop()- lastWord.length-1;
            }
        }
        else {
            index -= lastWord.length+1;
            i--;
        }

        var space = "";
        if (!String.prototype.repeat)
            for (var a = 0; a < lastWord.length; a++) space += " ";
        else space = " ".repeat(lastWord.length);

        if (end) {
            self.box.rebootLine(l);
            self.box.printChar(l, 0, self.txt[n][l].slice(0,i).join(" "));
            self.box.printChar(l, index, space);
            if (index > 0) {
                if (l == self.checkPoint[n+1][0] && index > self.checkPoint[n+1][1]) {
                    crossOut(self.checkPoint[n+1], [l,index-1]);
                }
                else {
                    if (l == self.checkPoint[n+1][0] && index == self.checkPoint[n+1][1]) {
                        console.log("yep");
                    }
                    else {
                        crossOut([l,0], [l,index-1]);
                    }
                }
            }

        }
        else {
            self.box.printChar(l, index, space);
        }



        if (self.checkPoint[n+1] != undefined) {
            if (end == true && l == self.checkPoint[n+1][0] && index == self.checkPoint[n+1][1]) {
                n++;
                end = false;
            }
        }

    }


};
Animation.prototype.addWord = function(removeListeners, callback) {
    // Setup listeners for adding and removing words of a text

    /* This prototype takes two callback functions : one to remove the listeners
       that triggers "add" and "remove" events from the outside the Animation
       object, and another optional one that will execute the next given step */

    var self = this;

    this.txt.forEach(function(txts, i) {
         txts.forEach(function(sentences, j) {
             self.txt[i][j] = sentences.split(" ");
         });
    });

    var n = l = i = index = 0;
    var end = false;
    var check = false;
    // use pause tag to define an line/index from where the user can't go back
    var pointOfNoReturn = self.pause[0][0];
    var lastEnding = [];

    console.log(self.checkPoint);

    //FIXME jhfdjkhgskdjfhg
    var cor = false;

    window.addEventListener("remove", remove);
    window.addEventListener("add", add);
    window.addEventListener("stop", function() {
        stop(removeListeners);
    });

    function stop(next) {
        window.removeEventListener("remove", remove);
        window.removeEventListener("add", add);
        removeListeners();
        if (next) {
            next();
        }
    }


    function crossOut(start, ending) {
        var tag = { "type" : "s" };

        if (start[0] == ending[0]) {
            tag.line = start[0];
            if (start[1] == 0) {
                tag.open = 0;
            }
            else {
                tag.open = start[1]+1;
            }
            tag.close = ending[1];
            self.box.addTags(tag);
        }
        else {
            for (var z = ending[0]; z >= start[0]; z--) {
                tag.line = z;
                if (z == start[0]) {
                    if (start[1] == 0) {
                        tag.open = 0;
                    }
                    else {
                        tag.open = start[1]+1;
                    }
                    tag.close = lastEnding[z]-1;
                }
                else if (z == ending[0]) {
                    tag.open = 0;
                    tag.close = ending[1];
                }
                else {
                    tag.open = 0;
                    tag.close = lastEnding[z]-1;
                }

                self.box.addTags(tag);
            }
        }



    }

    function add() {
        var nextWord = self.txt[n][l][i];

        if (nextWord == undefined) {
            if (self.txt[n][l+1] == undefined) {
                if (!end) {
                    end = true;
                }
                else {
                    return;
                }
                if (self.txt[n+1] == undefined) {
                    stop(callback);
                    return;
                }
                // magically change the checkpoint if its index is the end of a line
                if (self.checkPoint[n+1][1] >= lastEnding[self.checkPoint[n+1][0]]-1) {
                    self.checkPoint[n+1] = [self.checkPoint[n+1][0]+1, 0]
                }
                crossOut(self.checkPoint[n+1], [l, index-1]);
                console.log("crossOut", self.checkPoint[n+1]);
                return;
            }
            else {
                lastEnding.push(index);
                l++;
                i = index = 0;

                nextWord = self.txt[n][l][i];
            }
        }

        if (end) {
            self.box.rebootLine(l);
            // reprint line as it was without the <s> tag
            self.box.printChar(l, 0, self.txt[n][l].slice(0,i).join(" "));
            // print the next word
            self.box.printChar(l, index, nextWord);

            if (l == self.checkPoint[n+1][0] && index >= self.checkPoint[n+1][1]) {
                crossOut(self.checkPoint[n+1], [l,index+nextWord.length]);
            }
            else {
                crossOut([l,0], [l,index+nextWord.length]);
            }
        }
        else {
            self.box.printChar(l, index, nextWord);
        }

        index += nextWord.length + 1;
        i++;
    }

    function remove() {

        function getSpaces(length) {
            let space = "";
            if (!String.prototype.repeat)
                for (let a = 0; a < length; a++) space += " ";
            else space = " ".repeat(length);

            return space;
        }



        var lastWord = self.txt[n][l][i-1];
        if (l == pointOfNoReturn[0] && index-lastWord.length-1 <= pointOfNoReturn[1]) {
            return;
        }
        if (cor) {
            // Sorry FIXME
            lastEnding.pop();
            cor = false;
        }
        if (lastWord == undefined) {
            if (l <= 0) {
                return;
            }
            else {
                l--;
                i = self.txt[n][l].length-1 ;
                lastWord = self.txt[n][l][i];
                index = lastEnding.pop()- lastWord.length-1;
            }
        }
        else {
            index -= lastWord.length+1;
            i--;
        }
        if (end) {
            self.box.rebootLine(l);
            self.box.printChar(l, 0, self.txt[n][l].slice(0,i).join(" "));
            self.box.printChar(l, index, getSpaces(lastWord.length));
            if (index > 0) {
                if (l <= self.checkPoint[n+1][0] && index-1 <= self.checkPoint[n+1][1]) {
                    end = false;
                    n++;
                }
                else {
                    if (l == self.checkPoint[n+1][0] && index >= self.checkPoint[n+1][1]) {
                        console.log("crossOut end", self.checkPoint[n+1]);
                        crossOut(self.checkPoint[n+1], [l,index-1]);
                    }
                    else {
                        crossOut([l,0], [l,index-1]);
                    }
                }
            }
            else if (l <= self.checkPoint[n+1][0] && index-1 <= self.checkPoint[n+1][1]) {
                if (self.txt[n+1][l-1].length != self.txt[n][l-1].length) {
                    // deal with the fucking checkpoint exception
                    console.log("checkPoint relou", self.txt[n+1][l-1], self.txt[n][l-1]);
                    end = false;
                    n++;
                    l -= 1;
                    i = self.txt[n][l].length-1;
                    index = self.txt[n-1][l].join(" ").length+1;
                    lastEnding.pop();
                    lastEnding.push(self.txt[n][l].join(" ").length+1);
                    cor = true;
                }
                else {
                    end = false;
                    n++;
                }

            }
        }
        else {
            self.box.printChar(l, index, getSpaces(lastWord.length));
        }
    }
};
Animation.prototype.cleanEndOfLine = function(line, index, char) {
    var self = this;
    var cleaning = setInterval(function() {
        if (index >= self.box.x - self.box.marginX*2) {
            clearInterval(cleaning);
            return;
        }
        self.box.printChar(line, index++, char);
    }, 10);

};
Animation.prototype.clean = function(pos, callback) {

    var cleanAt = this.cleanAt[pos] || this.cleanAt[0];
    var line = cleanAt[0][0];
    var index = cleanAt[0][1];
    var char,
        chars;

    if (cleanAt[2].length > 1) chars = cleanAt[2].split("");
    else char = cleanAt[2];

    var self = this;
    var cleaningPage = setInterval(function() {
        if (self.stop) {
            clearInterval(cleaningPage);
            return;
        }
        // if multiple characters are given to the method, it will display a random one (with more chance to display the first one)
        if (chars != undefined) {
            let rand = Math.random() * (chars.length-1);

            if (rand < 0.5) {
                char = chars[0];
            }
            else {
                char = chars[1];
            }
        }
        // clear the interval at specified line/index
        if (line >= cleanAt[1][0] && index >= cleanAt[1][1]) {
            clearInterval(cleaningPage);
            if (callback) callback();
        }
        else if (index >= self.box.x - self.box.marginX*2) {
            line++;
            index = 0;
        }
        else {
            if (char === "\\") char = " ";
            self.box.printChar(line, index++, char);
        }


    }, self.cleanSpeed);

};
Animation.prototype.reversedClean = function(pos, callback) {
    var cleanAt = this.cleanAt[pos] || this.cleanAt[0];
    var line = cleanAt[1][0];
    var index = cleanAt[1][1];
    var char = cleanAt[2];

    var self = this;
    var cleaningPage = setInterval(function() {
        // clear the interval at specified line/index
        if (line == 0 && index < 0) {
            clearInterval(cleaningPage);
            if (callback) callback();
        }
        else if (index < 0) {
            line--;
            index = self.box.x - self.box.marginX - "</br>".length+1;
        }
        else {
            if (char === "\\") char = " ";
            self.box.printChar(line, index--, char);
        }

    }, self.cleanSpeed);

};
