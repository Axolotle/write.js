function Animation(obj, box) {
    this.init(obj, box);
}
Animation.prototype.init = function(obj, box) {
    if (obj.cleanAt) this.cleanAt = obj.cleanAt;
    if (obj.noClearingSpace) this.noClearingSpace = obj.noClearingSpace;
    if (obj.onTheBox) this.onTheBox = true;
    if (obj.tags) this.tags = obj.tags;
    if (obj.checkPoint) this.checkPoint = obj.checkPoint;
    if (obj.endAt) this.endAt = obj.endAt;
    if (obj.pointOfNoReturn) this.pointOfNoReturn = obj.pointOfNoReturn;

    this.startAt = obj.startAt || [0,0];
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

    var line = this.startAt[1];
    var index = this.onTheBox ? this.box.marginX * -1 : this.startAt[0];

    var l = 0;
    var i = 0;
    var speed = this.speed || 15;

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
                    if (self.tags) {
                        let plus = self.onTheBox ? self.box.marginX * -1 : 0;
                        self.tags.forEach(function(tag) {
                            self.box.printOnLine(tag.line, tag.index+plus, tag.content, true);
                        })
                    }
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
            self.box.printOnLine(line, index, shift);

            index++;
            setTimeout(write, speed);

        }

    }
    write();

};
Animation.prototype.appendText = function(callback) {
    var self = this;
    this.txt.forEach(function(line, i) {
        self.box.printOnLine(i, 0, line);
    });

    if (self.tags) {
        self.tags.forEach(function(tag) {
            self.box.printOnLine(tag.line, tag.index, tag.content, true);
        })
    }
    if (callback) {
        callback();
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

    var pointOfNoReturn = this.checkPoint[this.pointOfNoReturn];
    var lastEnding = [];

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

        if (start[1] == ending[1]) {
            tag.line = start[1];
            if (start[0] == 0) {
                tag.open = 0;
            }
            else {
                tag.open = start[0]+1;
            }
            tag.close = ending[0];
            self.box.addTags(tag);
        }
        else {
            for (var z = ending[1]; z >= start[1]; z--) {
                tag.line = z;
                if (z == start[1]) {
                    if (start[0] == 0) {
                        tag.open = 0;
                    }
                    else {
                        tag.open = start[0]+1;
                    }
                    tag.close = lastEnding[z]-1;
                }
                else if (z == ending[1]) {
                    tag.open = 0;
                    tag.close = ending[0];
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
                if (self.checkPoint[n+1][0] >= lastEnding[self.checkPoint[n+1][1]]-1) {
                    self.checkPoint[n+1] = [0, self.checkPoint[n+1][1]+1]
                }
                crossOut(self.checkPoint[n+1], [index-1, l]);
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
            self.box.cleanLines(l);
            // reprint line as it was without the <s> tag
            self.box.printOnLine(l, 0, self.txt[n][l].slice(0,i).join(" "));
            // print the next word
            self.box.printOnLine(l, index, nextWord);

            if (l == self.checkPoint[n+1][1] && index >= self.checkPoint[n+1][0]) {
                crossOut(self.checkPoint[n+1], [index+nextWord.length, l]);
            }
            else {
                crossOut([0,l], [index+nextWord.length, l]);
            }
        }
        else {
            self.box.printOnLine(l, index, nextWord);
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
        if (l == pointOfNoReturn[1] && index-lastWord.length-1 <= pointOfNoReturn[0]) {
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
            self.box.cleanLines(l);
            self.box.printOnLine(l, 0, self.txt[n][l].slice(0,i).join(" "));
            self.box.printOnLine(l, index, getSpaces(lastWord.length));
            if (index > 0) {
                if (l <= self.checkPoint[n+1][1] && index-1 <= self.checkPoint[n+1][0]) {
                    end = false;
                    n++;
                }
                else {
                    if (l == self.checkPoint[n+1][1] && index >= self.checkPoint[n+1][0]) {
                        crossOut(self.checkPoint[n+1], [index-1, l]);
                    }
                    else {
                        crossOut([0, l], [index-1, l]);
                    }
                }
            }
            else if (l <= self.checkPoint[n+1][1] && index-1 <= self.checkPoint[n+1][0]) {
                if (self.txt[n+1][l-1].length != self.txt[n][l-1].length) {
                    // deal with the fucking checkpoint exception
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
            self.box.printOnLine(l, index, getSpaces(lastWord.length));
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
        self.box.printOnLine(line, index++, char);
    }, 10);

};
Animation.prototype.clean = function(pos, callback) {

    var cleanAt = this.cleanAt[pos] || this.cleanAt[0];
    var line = cleanAt[0][1];
    var index = cleanAt[0][0];
    var char,
        chars;

    var speed = cleanAt[3];

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
        if (line >= cleanAt[1][1] && index >= cleanAt[1][0]) {
            clearInterval(cleaningPage);
            if (callback) callback();
        }
        else if (index >= self.box.x - self.box.marginX*2) {
            line++;
            index = 0;
        }
        else {
            if (char === "\\") char = " ";
            self.box.printOnLine(line, index++, char);
        }


    }, speed);

};
Animation.prototype.reversedClean = function(pos, callback) {
    var cleanAt = this.cleanAt[pos] || this.cleanAt[0];
    var line = cleanAt[1][1];
    var index = cleanAt[1][0];
    var char = cleanAt[2];
    var speed = cleanAt[3];

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
            self.box.printOnLine(line, index--, char);
        }

    }, speed);

};
Animation.prototype.startSubtitles = function(callback) {

    var self = this;
    var start = null;

    var active = [];
    var removed = false;

    function sub(timestamp) {
        if (self.stop) {
            return;
        }
        if (start === null) start = timestamp;
        var progress = timestamp - start;

        if (active.length > 0) {
            for (var i = 0; i < active.length; i++) {
                if (progress >= active[i].end) {
                    self.box.removeTags();
                    for (var a = 0; a < active[i].txt.length; a++) {
                        self.box.printOnLine(active[i].pos[a][0], active[i].pos[a][1], " ".repeat(active[i].txt[a].length));
                    }
                    active.splice(i, 1);
                    removed = true;
                }
            }
        }

        if (self.txt[0] != undefined && progress >= self.txt[0].start) {
            let data = self.txt[0];
            self.box.removeTags();

            for (var i = 0; i < data.txt.length; i++) {
                self.box.printOnLine(data.pos[i][0], data.pos[i][1], data.txt[i]);
            }
            active.push(self.txt.shift());
            removed = true;
        }

        if (removed) {
            for (var i = 0; i < active.length; i++) {
                for (var a = 0; a < active[i].txt.length; a++) {
                    if (active[i].tags != undefined) {
                        self.box.addTags(active[i].tags[a]);
                    }
                }
            }
            removed = false;
        }


        if (self.txt.length > 0 || active.length > 0) {
            requestAnimationFrame(sub);
        }
        else {
            callback();
        }
    }

    requestAnimationFrame(sub);
};
