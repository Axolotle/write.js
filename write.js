function Animation(obj) {
    Object.assign(this, obj);

    // define stop attribut and listener that will stop any running function
    this.stop = false;
    this.stopListener();
}
Animation.prototype.stopListener = function() {
    // Generic stop method triggering the clearInterval of timed animation
    // Events dependant methods still needs to listen to the stop event
    const _this = this;

    function stop() {
        _this.stop = true;
        window.removeEventListener("stop", stop);
    }

    window.addEventListener("stop", stop);
};
Animation.prototype.writeText = function(box) {
    return new Promise ((resolve, reject) => {
        const _this = this;
        // FIXME try to get a better controlled frame rate

        // Splits each texts in individual characters
        _this.txt = _this.txt.map((sentence) => { return sentence.split("")});

        var line = _this.startAt[1];
        var index = _this.onTheBox ? box.marginX * -1 : _this.startAt[0];

        var l = 0;
        var i = 0;
        var speed = _this.speed != undefined ? _this.speed : 70;

        var pause = _this.hasOwnProperty("pause") ? _this.pause.shift() : false;
        var altSpeed = _this.hasOwnProperty("altSpeed") ? _this.altSpeed.shift() : false;

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function writing() {
            if (_this.stop) reject("User triggered a stop event");

            else if (pause && index == pause[0][0] && l == pause[0][1]) {
                await sleep(pause[1]);
                if (_this.pause[0] != undefined) pause = _this.pause.shift();
                else pause = false;
                requestAnimationFrame(writing);
                return;
            }
            else {
                if (altSpeed && index == altSpeed[0][0] && l == altSpeed[0][1]) {
                    speed = altSpeed[1];
                    if (_this.altSpeed[0] != undefined) altSpeed = _this.altSpeed.shift();
                    else altSpeed = false;
                }
                if (_this.txt[l][0] != undefined) {
                    let chara = _this.txt[l].shift();

                    if (chara == "\\") {
                        if (index == 0) {
                            requestAnimationFrame(writing);
                            return;
                        } else {
                            chara = " ";
                        }
                    }
                    if (chara == " " && _this.noClearingSpace) {
                        requestAnimationFrame(writing);
                        index++;
                        return;
                    }

                    box.printOnLine(line, index, chara);
                    index++;
                    if (speed != 0) {
                        await sleep(speed);
                    }
                    requestAnimationFrame(writing);
                }
                else {
                    if (l >= _this.txt.length - 1) {
                        if (_this.tags) {
                            let adder = _this.onTheBox ? box.marginX * -1 : 0;
                            _this.tags.forEach(tag => {
                                box.printOnLine(tag.line, tag.index+adder, tag.content, true);
                            });
                        }
                        resolve();
                    }
                    else {
                        _this.cleanEndOfLine(line, index, " ", box);
                        line++;
                        l++;
                        index = _this.onTheBox ? box.marginX * -1 : 0;
                        requestAnimationFrame(writing);
                    }
                }
            }
        }
        requestAnimationFrame(writing);
    });
};
Animation.prototype.displayText = function(box) {
    const _this = this;

    _this.txt.forEach((line, i) => box.printOnLine(i, 0, line));

    if (_this.tags) {
        // FIXME rework the tag stuff
        _this.tags.forEach((tag) => {
            box.printOnLine(tag.line, tag.index, tag.content, true);
        });
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
Animation.prototype.cleanEndOfLine = function(line, index, char, box) {
    var self = this;
    var cleaning = setInterval(function() {
        if (index >= box.x - box.marginX*2) {
            clearInterval(cleaning);
            return;
        }
        box.printOnLine(line, index++, char);
    }, 10);

};
Animation.prototype.clean = function(box, pos, reverse) {
    return new Promise ((resolve, reject) => {
        const _this = this;

        if (pos === "reverse") {
            reverse = true;
            pos = 0;
        }
        const cleanAt = this.cleanAt[pos] || this.cleanAt[0];
        const chara = cleanAt[2].length > 1 ? cleanAt[2].split("") : cleanAt[2];
        const speed = cleanAt[3];

        var line = reverse ? cleanAt[1][0] : cleanAt[0][0];
        var index = reverse ?  cleanAt[1][1] : cleanAt[0][1];

        console.log(reverse);
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function cleaning() {
            if (_this.stop) reject("User triggered a stop event");

            if (reverse) {
                if (line == 0 && index < 0) {
                    resolve();
                    return;
                }
                if (index < 0) {
                    line--;
                    index = box.x - box.marginX*2 -1;
                }
            } else {
                if (line >= cleanAt[1][1] && index >= cleanAt[1][0]) {
                    resolve();
                    return;
                }
                if (index >= box.x - box.marginX*2) {
                    line++;
                    index = 0;
                }
            }

            var char;
            if (Array.isArray(chara)) {
                let rand = Math.random();
                if (rand < 0.5) char = chara[0];
                else char = chara[1];
            } else {
                char = chara;
            }

            await sleep(speed);
            box.printOnLine(line, index, char);
            index += reverse ? -1 : 1;
            requestAnimationFrame(cleaning);
        }

        requestAnimationFrame(cleaning);

    });
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
