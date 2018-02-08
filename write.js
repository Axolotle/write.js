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
Animation.prototype.sleep = function(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
Animation.prototype.writeText = function(box) {
    return new Promise ((resolve, reject) => {
        const _this = this;
        // FIXME try to get a better controlled frame rate
        // FIXME add an option to clean the end of line or not

        // Splits each texts in individual characters
        _this.txt = _this.txt.map((sentence) => { return sentence.split("")});

        var line = _this.startAt[1];
        var index = _this.onTheBox ? box.marginX * -1 : _this.startAt[0];

        var l = 0;
        var i = 0;
        var speed = _this.speed != undefined ? _this.speed : 70;

        var pause = _this.hasOwnProperty("pause") ? _this.pause.shift() : false;
        var altSpeed = _this.hasOwnProperty("altSpeed") ? _this.altSpeed.shift() : false;

        async function writing() {
            if (_this.stop) reject("User triggered a stop event");

            else if (pause && index == pause[0][0] && l == pause[0][1]) {
                await _this.sleep(pause[1]);
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
                        await _this.sleep(speed);
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
Animation.prototype.insertText = function(box) {
    // FIXME merge with displayText ?
    const _this = this;
    _this.txt.forEach((line, i) => box.insertOnLine(i, 0, line, _this.lineLength[i]));
};
Animation.prototype.addWord = function(box, removeListeners) {
    return new Promise ((resolve, reject) => {
        const _this = this;

        // Splits every texts in words arrays
        _this.txt.forEach((txts, i) => {
            txts.forEach((sentences, j)  => {
                _this.txt[i][j] = sentences.split(" ");
            });
        });

        // Setup text related indexes
        var n = l = i = index = 0;
        // Setup end of a text boolean that will triggers the crossing
        var end = false;

        const pointOfNoReturn = _this.checkPoint[_this.pointOfNoReturn];
        var lastEnding = [];

        //FIXME jhfdjkhgskdjfhg
        var cor = false;

        // Setup listeners for adding and removing words of a text
        window.addEventListener("remove", remove);
        window.addEventListener("add", add);
        window.addEventListener("stop", () => stop(removeListeners));

        function stop() {
            window.removeEventListener("remove", remove);
            window.removeEventListener("add", add);
            removeListeners();
            resolve();
        }

        function crossOut(start, ending) {
            var tag = { "type" : "s" };

            if (start[1] == ending[1]) {
                tag.line = start[1];
                if (start[0] == 0) tag.open = 0;
                else tag.open = start[0]+1;
                tag.close = ending[0];
                box.addTags(tag);
            }
            else {
                for (var z = ending[1]; z >= start[1]; z--) {
                    tag.line = z;
                    if (z == start[1]) {
                        if (start[0] == 0) tag.open = 0;
                        else tag.open = start[0]+1;
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
                    box.addTags(tag);
                }
            }
        }

        function add() {
            var nextWord = _this.txt[n][l][i];

            if (nextWord === undefined) {
                if (_this.txt[n][l+1] === undefined) {
                    if (!end) end = true;
                    else return;

                    if (_this.txt[n+1] === undefined) return stop();

                    // magically change the checkpoint if its index is the end of a line
                    if (_this.checkPoint[n+1][0] >= lastEnding[_this.checkPoint[n+1][1]]-1) {
                        _this.checkPoint[n+1] = [0, _this.checkPoint[n+1][1]+1]
                    }
                    crossOut(_this.checkPoint[n+1], [index-1, l]);
                    return;
                }
                else {
                    lastEnding.push(index);
                    l++;
                    i = index = 0;

                    nextWord = _this.txt[n][l][i];
                }
            }

            if (end) {
                box.removeTags(l);
                // print the next word
                box.printOnLine(l, index, nextWord);

                if (l == _this.checkPoint[n+1][1] && index >= _this.checkPoint[n+1][0]) {
                    crossOut(_this.checkPoint[n+1], [index+nextWord.length, l]);
                }
                else {
                    crossOut([0,l], [index+nextWord.length, l]);
                }
            }
            else {
                box.printOnLine(l, index, nextWord);
            }

            index += nextWord.length + 1;
            i++;
        }

        function remove() {
            var lastWord = _this.txt[n][l][i-1];
            if (l == pointOfNoReturn[1] && index-lastWord.length-1 <= pointOfNoReturn[0]) {
                return;
            }
            if (cor) {
                // Sorry FIXME
                lastEnding.pop();
                cor = false;
            }
            if (lastWord == undefined) {
                if (l <= 0) return;
                else {
                    l--;
                    i = _this.txt[n][l].length-1 ;
                    lastWord = _this.txt[n][l][i];
                    index = lastEnding.pop() - lastWord.length-1;
                }
            }
            else {
                index -= lastWord.length+1;
                i--;
            }
            if (end) {
                box.removeTags(l);
                box.printOnLine(l, index, " ".repeat(lastWord.length));
                if (index > 0) {
                    if (l <= _this.checkPoint[n+1][1] && index-1 <= _this.checkPoint[n+1][0]) {
                        end = false;
                        n++;
                    }
                    else {
                        if (l == _this.checkPoint[n+1][1] && index >= _this.checkPoint[n+1][0]) {
                            crossOut(_this.checkPoint[n+1], [index-1, l]);
                        }
                        else {
                            crossOut([0, l], [index-1, l]);
                        }
                    }
                }
                else if (l <= _this.checkPoint[n+1][1] && index-1 <= _this.checkPoint[n+1][0]) {
                    if (_this.txt[n+1][l-1].length != _this.txt[n][l-1].length) {
                        // deal with the fucking checkpoint exception
                        end = false;
                        n++;
                        l -= 1;
                        i = _this.txt[n][l].length-1;
                        index = _this.txt[n-1][l].join(" ").length+1;
                        lastEnding.pop();
                        lastEnding.push(_this.txt[n][l].join(" ").length+1);
                        cor = true;
                    }
                    else {
                        end = false;
                        n++;
                    }

                }
            }
            else {
                box.printOnLine(l, index, " ".repeat(lastWord.length));
            }
        }
    });
};
Animation.prototype.cleanEndOfLine = function(line, index, char, box) {
    return new Promise ((resolve, reject) => {
        const _this = this;

        async function cleaning() {
            if (index >= box.x - box.marginX*2) {
                resolve();
                return;
            }
            await _this.sleep(10);
            box.printOnLine(line, index++, char);
            requestAnimationFrame(cleaning);
        }

        requestAnimationFrame(cleaning);
    });
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

        var line = reverse ? cleanAt[1][1] : cleanAt[0][1];
        var index = reverse ?  cleanAt[1][0] : cleanAt[0][0];

        async function cleaning() {
            if (_this.stop) return reject("User triggered a stop event");

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

            await _this.sleep(speed);
            box.printOnLine(line, index, char);
            index += reverse ? -1 : 1;
            requestAnimationFrame(cleaning);
        }

        requestAnimationFrame(cleaning);

    });
};
Animation.prototype.startSubtitles = function(box) {
    return new Promise((resolve, reject) => {
        const _this = this;
        var start = null;

        var active = [];
        var removed = false;

        function sub(timestamp) {
            if (_this.stop) return reject("User triggered a stop event");

            if (start === null) start = timestamp;
            var progress = timestamp - start;

            if (active.length > 0) {
                for (var i = 0; i < active.length; i++) {
                    if (progress >= active[i].end) {
                        box.removeTags();
                        for (var a = 0; a < active[i].txt.length; a++) {
                            box.printOnLine(active[i].pos[a][1], active[i].pos[a][0], " ".repeat(active[i].txt[a].length));
                        }
                        active.splice(i, 1);
                        removed = true;
                    }
                }
            }

            while (_this.txt[0] != undefined && progress >= _this.txt[0].start) {
                let data = _this.txt[0];
                box.removeTags();

                for (var i = 0; i < data.txt.length; i++) {
                    box.printOnLine(data.pos[i][1], data.pos[i][0], data.txt[i]);
                }
                active.push(_this.txt.shift());
                removed = true;
            }

            if (removed) {
                for (var i = 0; i < active.length; i++) {
                    for (var a = 0; a < active[i].txt.length; a++) {
                        if (active[i].tags != undefined) {
                            box.addTags(active[i].tags[a]);
                        }
                    }
                }
                removed = false;
            }

            if (_this.txt.length > 0 || active.length > 0) {
                requestAnimationFrame(sub);
            }
            else {
                resolve();
            }
        }

        requestAnimationFrame(sub);
    });
};
Animation.prototype.mouseOver = function(hide) {
    return new Promise((resolve, reject) => {
        const _this = this;
        // var visibility = hide ? 'hidden' : 'visible';
        var visibility = hide ? 0 : 1;
        var words = document.getElementsByClassName(_this.tagName);
        var wordsLen = words.length;
        var overedWords = 0;

        function changeVisibility(elem) {
            let i = Array.prototype.indexOf.call(words, elem.target);
            // words[i].style.visibility = visibility;
            words[i].style.opacity = visibility;
            words[i].removeEventListener('mouseover', changeVisibility);
            overedWords++;
            if (overedWords == wordsLen) {
                resolve();
            }
        }

        for (let i = 0; i < wordsLen; i++) {
            words[i].addEventListener("mouseover", changeVisibility);
        }
    });
};
Animation.prototype.overlay = function(box) {
    return new Promise((resolve, reject) => {
        const _this = this;
        const bg = document.getElementsByTagName('body')[0];
        const div = document.getElementById(box.div);
        window.addEventListener('mousemove', moveClip);

        const pointerSkin = {
            'read': '│<br>│<br><br><br>───         ───<br><br><br>│<br>│<br>',
            'clickBold': ' <br> <br>┃<br>   ━━╋━━   <br>┃<br> <br> <br>',
            'click': ' <br> <br>│<br>   ──┼──   <br>│<br> <br> <br>'
        }

        const pointer = document.createElement('p');
        pointer.id = 'cursor';
        pointer.innerHTML = pointerSkin.read;

        bg.style.cursor = 'none';
        bg.appendChild(pointer);
        var x = pointer.offsetWidth;
        var y = pointer.offsetHeight;


        var noteZone = document.createElement('div');
        const html = document.getElementsByTagName('html')[0];
        noteZone.id = 'noteZone';
        html.appendChild(noteZone);

        const notes = document.getElementsByClassName('notes');
        for (let i = 0; i < notes.length; i += 1) {
            notes[i].addEventListener('click', displayNote);
            notes[i].addEventListener('mouseover', () => {
                pointer.innerHTML = pointerSkin.click;
                x = pointer.offsetWidth;
                y = pointer.offsetHeight;
            });
            notes[i].addEventListener("mouseout", () => {
                pointer.innerHTML = pointerSkin.read;
                x = pointer.offsetWidth;
                y = pointer.offsetHeight;
            });
        }

        function moveClip(e) {
            let pos = 'at ' + e.clientX + 'px ' + e.clientY + 'px';
            bg.style.clipPath = 'circle(100px ' + pos + ')';
            pointer.style.top = (e.clientY - y/2) + 'px';
            pointer.style.left = (e.clientX - x/2) + 'px';
        }

        function displayNote(elem) {
            let i = Array.prototype.indexOf.call(notes, elem.target);
            noteZone.innerHTML = _this.notes[i]
        }

        const nextPage = document.getElementById('nextPage');
        nextPage.onclick = resolve;
    });
};
