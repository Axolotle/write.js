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
Animation.prototype.displayText = function(box, txt) {
    const _this = this;
    txt = txt || this.txt;
    txt.forEach((line, i) => box.printOnLine(i, 0, line));

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
Animation.prototype.notesReader = function(cursor) {
    return new Promise((resolve, reject) => {
        const _this = this;

        function displayNote(elem) {
            let i = Array.prototype.indexOf.call(links, elem.target);
            noteZone.innerHTML = _this.notes[i];
            noteZone.style.display = 'block';
        }
        function hover() {
            cursor.updateSkin('hover');
        }
        function normal() {
            cursor.updateSkin('normal');
        }
        function initSkinEvents(elem) {
            elem.addEventListener('mouseover', hover, true);
            elem.addEventListener("mouseout", normal, true);
        }
        function removeSkinEvents(elem) {
            elem.removeEventListener('mouseover', hover, true);
            elem.removeEventListener("mouseout", normal, true);
        }

        const noteZone = document.createElement('div');
        noteZone.id = 'noteZone';
        const body = document.getElementsByTagName('body')[0];
        body.appendChild(noteZone);

        noteZone.onclick = () => {
            noteZone.style.display = 'none';
        };

        const links = document.getElementsByClassName('notes');
        const linksLen = links.length
        for (let i = 0; i < linksLen; i++) {
            links[i].addEventListener('click', displayNote);
            initSkinEvents(links[i]);
        }

        const nextPage = document.getElementById('nextPage');
        initSkinEvents(nextPage);

        function stop() {
            try {
                body.removeChild(noteZone);
            } catch (e) {
                return
            }
            for (let i = 0; i < linksLen; i++) {
                links[i].removeEventListener('click', displayNote);
                removeSkinEvents(links[i]);
            }
            removeSkinEvents(nextPage);
            nextPage.removeEventListener('click', stop);
        }

        nextPage.addEventListener('click', () => {
            stop();
            resolve();
        });
        window.addEventListener('stop', () => {
            stop();
            reject("User triggered a stop event");
        });

    });
};
Animation.prototype.initMap = function (box) {
    const _this = this;
    var map = this.stages.map(stage => stage.map.split("\n"));
    var info = this.stages.map(stage => stage.physic.split("\n"));
    var rooms = this.stages.map(stage => stage.rooms);
    const mapMaxX = map[0][0].length;
    const mapMaxY = map[0].length;
    const maxX = box.x - box.marginX * 2;
    const maxY = box.y - box.marginY * 2;
    const middleX = Math.round(box.x / _this.player.posDivX) - box.marginX;
    const middleY = Math.round(box.y / _this.player.posDivY) - box.marginY;
    const nonWalkable = ["▉"];

    var init = _this.init;
    var mapX = init.x - middleX;
    var mapY = init.y - middleY;
    var x = init.x;
    var y = init.y;
    var roomDisplay = {
        symbol: init.symbol,
        line: maxY - 2,
        txt: init.roomName,
        tag: {
            type: "s",
            line: maxY - 2,
            open: 2,
            close: init.roomName.length + 2,
        },
    };
    var stage = init.stage;
    var startTime = Date.now();
    var gameover = false;
    var actions = undefined;
    var blocked = false;
    var required = new Set();
    var tags = [];
    var special = new Set(Object.keys(init.specialActions));
    var monologues = _this.monologues;

    render();
    update();

    window.addEventListener("keydown", checkKeys);


    function checkKeys(e) {
        const key = e.key || e.keyIdentifier || e.keyCode;
        // TODO check compatibility for Array.prototype.includes()
        if (gameover) {
            if ([" ", "U+0020", 32].indexOf(key) > -1) {
                gameover = false;
                // window.removeEventListener("keydown", checkKeys);
            } else {
                return;
            }
        }
        if (blocked && actions) {
            if (key == "x" && actions[0]) {
                action(0);
            } else if (key == "c" && actions[1]) {
                action(1);
            } else if (key == "v" && actions[2]) {
                action(2);
            } else {
                return;
            }
        } else if (blocked) {
            if ([" ", "U+0020", 32].indexOf(key) > -1) {
                blocked = false;
                render();
                update();
            } else {
                return;
            }
        } else {
            if (["ArrowLeft", "Left", 37].indexOf(key) > -1) {
                move("left", info[stage][y][x-1]);
            } else if (["ArrowUp", "Up", 38].indexOf(key) > -1) {
                move("up", info[stage][y-1][x]);
            } else if (["ArrowRight", "Right", 39].indexOf(key) > -1) {
                move("right", info[stage][y][x+1]);
            } else if (["ArrowDown", "Down", 40].indexOf(key) > -1) {
                move("down", info[stage][y+1][x]);
            } else if ([" ", "U+0020", 32].indexOf(key) > -1 && special.has(info[stage][y][x])) {
                specialAction(info[stage][y][x]);
            } else {
                return;
            }
        }

        e.preventDefault();
    }

    function move(dir, symbol) {
        console.log(dir, "|"+symbol+"|");
        if (nonWalkable.indexOf(symbol) > -1) return;

        if (dir == "left" && x > 0) {
            mapX -= 1;
            x -= 1;
        } else if (dir == "up" && y > 0) {
            mapY -= 1;
            y -= 1;
        } else if (dir == "right" && x < mapMaxX - 1) {
            mapX += 1;
            x += 1;
        } else if (dir == "down" && y < mapMaxY - 1) {
            mapY += 1;
            y += 1;
        }
        // Start vomiting

        if (symbol === "0") {
            render();
            stage = 1;
        } else if (symbol === "1") {
            stage = 0;
            render();
        } else if (special.has(symbol)) {
            render();
            let opt = init.specialActions[symbol];
            let txt = " " + opt.text + " ";
            let middle = Math.floor(box.x / 2) - Math.ceil(txt.length / 2);
            let tag = {
                type: "s",
                line: 2,
                open: middle,
                close: middle + txt.length
            };
            tags.push(tag);
            blit(txt, 2, middle);
        } else if ([" ", "▒"].indexOf(symbol) == -1 && roomDisplay.symbol != symbol) {
            let room = rooms[stage][symbol];
            roomDisplay.symbol = symbol;
            roomDisplay.txt = (stage == 0 ? " Rdc - " : " 1er : ") + (room.name || symbol) + " ";
            roomDisplay.tag.close = roomDisplay.txt.length + roomDisplay.tag.open;
            render();

            let txt = [];
            if (room.hasOwnProperty("removeRandom") && room.randomText.length == 0) {
                update();
                return;
            }

            if (room.hasOwnProperty("clock")) {
                txt.push("Sur l'horloge au mur il est " + formatTime(Date.now() - startTime) + "\n");
            }
            if (room.hasOwnProperty("fixedText")) {
                txt.push(room.fixedText);
                let mono = monologues[Math.floor(Math.random() * 30)];
                if (mono) txt.push(mono);
            }
            if (room.hasOwnProperty("randomText")) {
                if (room.hasOwnProperty("removeRandom")) {
                    txt.push(rooms[stage][symbol].randomText.pop());
                } else {
                    txt.push(pick(room.randomText));
                }
            }
            if (room.hasOwnProperty("effect")) {
                if (room.effect == "game_over") {
                    gameover = true;
                    text.push("\n\nGAME OVER");
                } else {
                    required.add(room.effect);
                }
            }
            if (room.hasOwnProperty("actions")) {
                if (!Array.isArray(room.actions)) {
                    let req = getRequired(Object.keys(room.actions)) || "default";
                    actions = room.actions[req];
                } else {
                    actions = room.actions;
                }
                console.log(actions);
                if (actions) {
                    if (txt.length != 0) {
                        txt.push("");
                    }
                    let opt = ["x", "c", "v"];
                    console.log(actions.length);
                    for (let i = 0, len = actions.length ; i < len; i++) {
                        txt.push("[" + opt[i] + "] " + actions[i].text);
                    }
                    if (txt.length == 1) {
                        txt.push("");
                    }
                    console.log(txt, txt.length);
                }
            } else {
                txt.push("\n\n{{tag::s}} continuer {{tag::/s}}");
            }
            if (txt.length > 1) {
                renderText(txt);
            }
        } else {
            render();
        }
        update();

    }

    function action(n) {
        let action = actions[n];
        let success = true;
        let text = [];
        let teleCoord;
        if (action.hasOwnProperty("required")) {
            let failure;
            if (Array.isArray(action.required)) {
                for (const req of action.required) {
                    if (!required.has(req)) {
                        failure = action.failure;
                        failure.text = failure.text[req];
                        break;
                    }
                }
            } else if (!required.has(action.required)) {
                failure = action.failure;
            }
            if (failure !== undefined) {
                success = false;
                text.push(failure.text);
                if (failure.effect == "game_over") {
                    gameover = true;
                    text.push("\n\nGAME OVER");
                }
                if (Array.isArray(failure.effect)) {
                    teleport(failure.effect);
                }
            }
        }
        if (success && action.hasOwnProperty("success") && action.success !== null) {
            if (action.success.hasOwnProperty("text")) {
                text.push(action.success.text);
            }
            if (action.success.hasOwnProperty("effect") && action.success.effect !== null) {
                let effect = action.success.effect;
                if (Array.isArray(effect)) {
                    teleCoord = effect;
                } else if (effect.indexOf("open") > -1) {
                    // open door
                } else if (effect == "you_win") {
                    // WIN
                } else if (effect == "game_over") {
                    gameover = true;
                    text.push("\n\nGAME OVER");
                } else {
                    required.add(effect);
                }
            }
            if (action.success.hasOwnProperty("remove")) {
                if (action.success.remove === true) {
                    delete rooms[stage][roomDisplay.symbol].actions;
                } else {
                    for (const prop of Object.keys(rooms[stage][roomDisplay.symbol])) {
                        if (prop != "name") {
                            delete rooms[stage][roomDisplay.symbol][prop];
                        }
                    }
                }

            }
        }
        if (teleCoord) {
            teleport(teleCoord);
        }
        text.push("\n\n{{tag::s}} continuer {{tag::/s}}");
        render();
        if (text.length > 1) {
            renderText(text);
        } else {
            blocked = false;
        }
        update();
        actions = undefined;
    }

    function specialAction(symbol) {
        if (symbol === "░") {
            return;
        }
        blocked = true;
        render();
        let opt = init.specialActions[symbol];
        if (symbol === "▶") {
            required.add(opt.effect)
        }
        if (symbol === "▷" || symbol === "△" || symbol === "▶") {
            renderText([opt.response, "\n\n{{tag::s}} continuer {{tag::/s}}"]);
        } else if (symbol === "▬") {
            displayPlan();
        }
        update();
    }

    function displayPlan() {

    }

    function getRequired(elems) {
        // Return a required name or null if none have been found
        for (const elem of elems) {
            if (required.has(elem)) {
                return elem;
            }
        }
        return null;
    }
    function teleport(coord) {
        mapX += coord[0];
        x += coord[0];
        mapY += coord[1];
        y += coord[1];
        let symbol = coord[2] || info[stage][y][x];
        roomDisplay.symbol = symbol;
        roomDisplay.txt = (stage == 0 ? " Rdc - " : " 1er : ") + rooms[stage][symbol].name + " ";
        roomDisplay.tag.close = roomDisplay.txt.length + roomDisplay.tag.open;
    }

    function renderText(txt) {
        // then start crying for me
        let formatter = new FormatJSON();
        let width = box.x * (3/5) - 6;
        let mY = 2;
        let mX = 3;
        txt = formatter.splitTxt(txt, [0,0], {x: width});
        txt = formatter.cleanOptions(txt);

        let actualTxt = boxify(txt.txt, width, txt.txt.length, mX-1, mY-1, true);

        blit(actualTxt, 1, box.x * (1/5));
        mY += 1;
        mX += Math.floor(box.x * (1/5));
        blocked = true;
        // FIXME tag stuff bordel
        if (txt.options.length > 0) {
            let options = formatter.manageOptions(txt.options).tags;
            for (let i = 0; i < options.length; i += 2) {
                let content = options[i].content.substring(1, options[i].content.length - 1);
                let sLine = options[i].line;
                let eLine = options[i+1].line;
                let extra = 0;
                if (i !== 0) {
                    extra = options.reduce((length, tag, index) => {
                        if (tag.line === sLine && index < i) {
                            return length + tag.content.length;
                        } else {
                            return length;
                        }
                    }, 0);
                }

                let tag = {
                    type: content,
                    line: sLine + mY,
                    open: options[i].index + mX ,
                };
                if (eLine !== sLine) {
                    tag.close = txt.txt[sLine].length + mX + extra;
                    tags.push(tag);
                    if (eLine - sLine > 1) {
                        for (let l = sLine + 1; l < eLine; l++) {
                            tag = {type: content};
                            tag.line = l + mY;
                            tag.open = 0 + mX;
                            tag.close = txt.txt[l].length + mX;
                            tags.push(tag);
                        }
                    }
                    tag = {type: content};
                    tag.open = 0 + mX;
                    tag.line = eLine + mY;
                    tag.close = txt.txt[eLine].length + mX;
                    tags.push(tag);
                } else {
                    tag.close = options[i+1].index + mX - extra - options[i].content.length ;
                    tags.push(tag);
                }
            }
        }
    }

    function render() {
        display = getMapPortion();
        blit("▉", middleY, middleX);
        blit(roomDisplay.txt, roomDisplay.line, 2);
    }

    function blit(content, startY, startX) {
        if (!Array.isArray(content)) {
            display[startY] = replaceStrAt(display[startY], startX, content);
        } else {
            for (let y = 0, l = content.length; y < l; y++) {
                display[startY+y] = replaceStrAt(display[startY+y], startX, content[y]);
            }
        }
    }

    function update() {
        box.removeTags();
        for (let l = 0; l < maxY; l++) {
            box.printOnLine(l, 0, display[l]);
        }
        tags.push(roomDisplay.tag);
        for (const tag of tags) {
            box.addTags(tag);
        }
        tags = [];
    }

    function getMapPortion() {
        function getExtraLines(quantity) {
            return Array(quantity).fill(" ".repeat(maxX));
        }

        function adaptX(portion) {
            return portion.map(line => {
                if (mapX < 0) {
                    return " ".repeat(mapX * -1) + line.slice(0, mapX + maxX);
                } else if (mapX + maxX > mapMaxX) {
                    return line.slice(mapX, mapX + maxX) + " ".repeat((mapX + maxX) - mapMaxX);
                } else {
                    return line.slice(mapX, mapX + maxX);
                }
            });
        }

        if (mapY < 0) {
            let portion = adaptX(map[stage].slice(0, mapY + maxY));
            return getExtraLines(mapY * -1).concat(portion);
        } else if (mapY + maxY > mapMaxY) {
            let portion = adaptX(map[stage].slice(mapY, mapMaxY));
            return portion.concat(getExtraLines((mapY + maxY) - mapMaxY));
        } else {
            return adaptX(map[stage].slice(mapY, mapY + maxY));
        }

    }

    function formatTime(ms) {
        let s = Math.floor(ms / 1000) + init.time;
        let h = Math.floor(s / 3600);
        let m = Math.floor((s % 3600) / 60);
        if (m === 60) {
            m = 0;
            h++;
        }
        if (h === 24) h = 0;
        return h + (m < 10 ? "h0" + m : "h" + m);
    }

};

function Viewfinder(divName, size, normal, hover) {
    let skin = {
        'none': ' <br> <br> <br>           <br> <br> <br> <br>',
        'read': '│<br>│<br><br>───       ───<br><br>│<br>│<br>',
        'readLarge': '│<br>│<br><br><br>───         ───<br><br><br>│<br>│<br>',
        'readBold': '┃<br>┃<br><br>━━━       ━━━<br><br>┃<br>┃<br>',
        'click': ' <br> <br>│<br>   ──┼──   <br>│<br> <br> <br>',
        'clickBold': ' <br> <br>┃<br>   ━━╋━━   <br>┃<br> <br> <br>'
    };

    this.skin = {
        'normal': skin[normal],
        'hover': skin[hover]
    };
    this.div = document.getElementById(divName);
    this.size = size;
}
Viewfinder.prototype.initClipPath = function(duration) {
    return new Promise((resolve, reject) => {
        const _this = this;
        var size = _this.size;

        function anim(timeStamp) {
            if (animStart === null) animStart = timeStamp;
            var runtime = timeStamp - animStart;
            var progress = runtime / duration;
            var actualSize = maxSize - step * runtime;
            if (runtime < duration) {
                _this.div.style.clipPath = 'circle(' + actualSize + 'px)'
                requestAnimationFrame(anim);
            }
            else {
                _this.div.style.clipPath = 'circle(' + size + 'px)';
                _this.initPointer();
                resolve();
            }
        }

        if (duration) {
            let main = document.getElementsByTagName('main')[0];
            let x = main.offsetWidth;
            let y = main.offsetHeight;
            // get half of the box's diagonal
            var maxSize = Math.sqrt(x*x + y*y) / 2;
            var animStart = null;
            var step = (maxSize - size) / duration;
            requestAnimationFrame(anim);
        }
        else {
            _this.div.style.clipPath = 'circle(' + size + 'px)';
            _this.initPointer();
            resolve();
        }
    });
};
Viewfinder.prototype.initPointer = function() {
    this.div.style.cursor = 'none';
    const pointer = document.createElement('p');
    pointer.id = 'cursor';
    pointer.innerHTML = this.skin.normal;
    this.div.appendChild(pointer);
    this.pointer = pointer;
    this.followMouse();
};
Viewfinder.prototype.followMouse = function() {
    const _this = this;
    window.addEventListener('mousemove', moveClip);
    var x = _this.pointer.offsetWidth / 2;
    var y = _this.pointer.offsetHeight / 2;
    window.addEventListener("deactivate", stop);
    window.addEventListener("stop", stop);

    function stop() {
        window.removeEventListener("mousemove", moveClip);
        _this.div.style.cursor = 'auto';
        _this.div.style.clipPath = 'none';
        window.removeEventListener("deactivate", stop);
    }

    function moveClip(e) {
        let pos = 'at ' + e.clientX + 'px ' + e.clientY + 'px';
        _this.div.style.clipPath = 'circle(' + _this.size + 'px ' + pos + ')';
        _this.pointer.style.top = (e.clientY - y) + 'px';
        _this.pointer.style.left = (e.clientX - x) + 'px';
    }
};
Viewfinder.prototype.updateSkin = function(skin) {
    this.pointer.innerHTML = this.skin[skin];
};
Viewfinder.prototype.deactivate = function(skin) {
    window.dispatchEvent(new Event("deactivate"));
    this.div.removeChild(this.pointer);
};
