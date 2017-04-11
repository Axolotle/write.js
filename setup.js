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




function Box(jsonObj, longestText, sizeOfLongestWord, divName) {
    // Define the dimension and create the box

    this.marginX = 3;
    this.marginY = 2;
    this.x = 0;
    this.y = 0;
    this.spans = [];

    this.init(jsonObj, longestText, sizeOfLongestWord, divName);
}
Box.prototype.init = function(jsonObj, longestText, sizeOfLongestWord, divName) {
    // Define the box dimension, setup and append it to the user window

    this.defineBoxDimension(jsonObj, longestText, sizeOfLongestWord);

    this.spans = this.setupBox(this.x, this.y);
    this.displayBox(this.spans, divName);

};
Box.prototype.defineBoxDimension = function(jsonObj, longestText, sizeOfLongestWord) {
    // Define the box dimensions (x, y) from window and texts informations

    function getCharaSize() {
        // Create an span element, return the height and the width of one character
        // and delete it
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

        if (pageW > pageH) {
            if (maxW > 60) {
                this.x = 60;
                //use methods of TxtManager class to define y
                var test = new AdaptJSON(longestText, jsonObj,
                    {"x":this.x, "marginX": this.marginX});
                this.y = test.txt.length + this.marginY*2;


                while (this.y > maxH) {
                    this.x++;

                    test = new AdaptJSON(longestText, jsonObj,
                        {"x":this.x, "marginX": this.marginX});
                    this.y = test.txt.length + this.marginY*2;

                    if (this.x > maxW) {
                        console.log("SCREEN TO SMALL");
                        this.x=0;
                        this.y=0;
                        return
                    }
                }
            }
        }
        else {

        }
    }
};
Box.prototype.setupBox = function(x,y) {
    // Draw the box and display it on window

    function createLine(c1, c2, c3) {
        // Create a line of 'x' elements

        var span = c1;
        for(let i = 0; i < x -2; i++)
            span += c2;
        span += c3;

        return span;
    }

    let spans = [];

    for (let n = 0; n < y; n++) {
        let elem = document.createElement("span");
        if (n == 0) {
            elem.innerHTML = createLine("┌","─","┐</br>");
        }
        else if (n == y-1)
        elem.innerHTML = createLine("└","─","┘</br>");
        else
        elem.innerHTML = createLine("│"," ","│</br>");

        spans.push(elem);
    }

    return spans;

};
Box.prototype.displayBox = function(spans, divName) {
    // Append the box to a html element

    div = document.getElementById(divName);

    spans.forEach(function(line) {
        div.appendChild(line);
    });

};
Box.prototype.printChar = function(line, index, char) {
    function setCharAt(str, i, chr) {
        //if(index > str.length-1) return str;
        return str.substr(0,i) + chr + str.substr(i+1);
    }

    var str = this.spans[line+this.marginY].innerHTML;
    this.spans[line+this.marginY].innerHTML = setCharAt(str, index+this.marginX, char);
}











function AdaptJSON(obj, jsonObj, box) {
    // Reformating json Obj

    this.txt = [];
    this.delay = 0;
    this.startAt = [];
    this.endAt = [];
    this.init(obj, jsonObj, box);

}
AdaptJSON.prototype.init = function(obj, jsonObj, box) {

    this.delay = obj.delay;
    this.n = obj.n;

    //console.log(jsonObj);
    var splitted = this.splitInWords(obj.txt);



    var x = box.x - box.marginX * 2;


    if (obj.clean == true) {
        this.cleanAt = [];
        console.log(obj.cleanDecal);

        obj.cleanDecal.forEach(function(decal, i) {
            let start = jsonObj[decal[0]].startAt[decal[1]];
            let end;
            if (decal[3] == "end") {
                end = [box.y-box.marginY*2, box.x-box.marginX*2];
            }
            else {
                end = jsonObj[decal[0]].endAt[decal[1]];
            }
            let char = decal[2];
            this.cleanAt.push([start, end, char]);
        }.bind(this));
        // this.cleanAt = jsonObj[obj.cleanDecal[0][0]].startAt[1];
        // this.char = obj.cleanDecal[0][2];
    }

    if (obj.decal == true) {
        let start = jsonObj[obj.txtDecal[0]].startAt[1];
        this.txt = this.defineSentences(splitted, x, start[0], start[1]);
    }
    else {
        this.txt = this.defineSentences(splitted, x);
    }



};
AdaptJSON.prototype.splitInWords = function(txts) {

    var splitted = txts.map(function(elem){
            return elem.split(" ");
    });
    //console.log("SPLIT : array of array :", splitted);

    return splitted; // [["word1", "word2", ...], ["word1", "word2", ...], ...]

};
AdaptJSON.prototype.defineSentences = function(splittedTxts, x, l, i) {
    var line = l || 0;
    var index = i || 0;

    var sentence = [];
    var sentences = [];
    var txts = [];

    var dontEscape = ["?", "!", ":", ";", "-"];
    var charaAlone = [".", ","];

    splittedTxts.forEach(function(wordsArray, i) {
        this.startAt.push([line,index]);

        wordsArray.forEach(function(word) {
            var width = index + 1 + word.length;

            if (charaAlone.indexOf(word) == 1) {
                var lastword = sentence.pop();
                sentence.push(lastword+word);
                index += word.length;
            }
            else if (width <= x) {
                sentence.push(word);

                index += 1 + word.length;
            }
            else if (dontEscape.indexOf(word) === -1) {
                sentences.push(sentence);

                sentence = [word];
                line++;
                index = word.length;
            }
            else {
                var lastword = sentence.pop();
                sentences.push(sentence);

                sentence = [lastword, word];
                index = lastword.length + 1 + word.length;
            }
        });

        this.endAt.push([line, index]);

    }.bind(this));
    sentences.push(sentence);

    return this.wordsArrayToStringArray(sentences);

};
AdaptJSON.prototype.wordsArrayToStringArray = function(wordsArray) {
    var sentences = wordsArray.map(function(words) {
        return words.join(" ");
    });
    //console.log(sentences);
    return sentences;

};
AdaptJSON.prototype.getStartInfo = function(decalArray, jsonObj) {


};
