function Anim(obj, box) {
    this.txt = [];
    this.delay = 0;
    this.speed = 50;
    this.box = box;
    this.n = obj.n;



    this.init(obj);

}
Anim.prototype.init = function(obj) {
    this.txt = this.formatStringsToIndieChar(obj.txt);
    this.delay = obj.delay*1000;
    this.startAt = obj.startAt;
    this.endAt = obj.endAt;
    this.cleanAt = obj.cleanAt;

    // obj.txtDecal = [[animObj, animObj.txt], [...], ...]
    this.txtDecal = obj.txtDecal;



};
Anim.prototype.formatStringsToIndieChar = function(sentences) {

    var t = sentences.map(function(sentence) {
        return sentence.split("");
    });

    return t;

};
Anim.prototype.writeText = function(lineStart, indexStart, callback) {
    var line = lineStart || 0;
    var index = indexStart || 0;

    var l = 0;
    var i = 0;


    var writing = setInterval(function() {
        var shift = this.txt[l].shift();

        if (shift == undefined) {
            if (l >= this.txt.length - 1) {

                clearInterval(writing);
                if (callback) {
                    callback();
                }
            }
            else {
                this.cleanLine(line, index, " ");
                line++;
                l++;
                index = 0;
            }

            return;
        }
        if (shift == "#") {
            if (index == 0) {
                return;
            }
            else {
                shift = " ";
            }
        }

        this.box.printChar(line, index, shift);

        index++;



    }.bind(this), this.speed);

};
Anim.prototype.cleanLine = function(line, index, char) {
    var cleaning = setInterval(function() {
        if (index >= this.box.x - this.box.marginX*2) {
            clearInterval(cleaning);
            return;
        }
        this.box.printChar(line, index++, char);
    }.bind(this), this.speed/2);

};
Anim.prototype.cleanPage = function(start, end, char, callback) {

    let line = start[0];
    let index = start[1];
    this.box.printChar(line, index++, " ");

    var cleaningPage = setInterval(function() {
        if (line >= end[0] && index >= end[1]) {
            clearInterval(cleaningPage);
            if (callback)
                callback();
        }
        else if (index >= this.box.x - this.box.marginX*2) {
            line++;
            index = 0;
        }
        else {
            this.box.printChar(line, index++, char);
        }


    }.bind(this), this.speed/2);

}
Anim.prototype.cleanPageSAVE = function(line, index, char, callback) {

    var cleaningPage = setInterval(function() {
        if (line >= this.box.y - this.box.marginY*2) {
            clearInterval(cleaningPage);
            if (callback)
                callback();
        }
        else if (index >= this.box.x - this.box.marginX*2) {
            line++;
            index = 0;
        }
        else {
            this.box.printChar(line, index++, char);
        }


    }.bind(this), this.speed/2);

}
Anim.prototype.startWritting = function(callback) {
    this.writeText(this.startAt[0][0],this.startAt[0][1], callback);


};
Anim.prototype.t = function() {


};
