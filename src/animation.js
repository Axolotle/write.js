import { Tag } from "./parser/parser.js";
import { sleep } from "./utils.js";

export async function animate(txt, display, split="", speed=40, startX=0, startY=0) {
    var domNodes = document.getElementById(display.nodeName).children;
    startY += display.padding.y;
    startX += display.padding.x;
    console.log(domNodes);
    var nodes = [];
    nodes.last = () => {
        return this[this.length - 1];
    };

    for (let l = 0, txtLen = txt.length; l < txtLen; l++) {
        let prevTxt = domNodes[l+startY].textContent;
        let doc = document.createElement("p");
        let rest = document.createTextNode(prevTxt.slice(startX, prevTxt.length - display.padding.x));
        var receiver = document.createElement("span");


        doc.appendChild(document.createTextNode(prevTxt.slice(0, startX)));
        doc.appendChild(receiver);
        doc.appendChild(rest)
        doc.appendChild(document.createTextNode(prevTxt.slice(prevTxt.length - display.padding.x)));
        domNodes[l+startY].replaceWith(doc);

        let line = txt[l].nodes;
        var actualDomNode;


        await displayContent(txt[l], receiver, rest);

    }
}

export function displayContent(emitter, receiver, rest) {
    return new Promise (async (resolve) => {
        for (let node of emitter.nodes) {
            if (node instanceof Tag) {
                let newReceiver = document.createElement(node.nodeName);
                receiver.appendChild(newReceiver);
                await displayContent(node, newReceiver, rest);
            } else if (typeof node === "object") {
                if (node.pause) {
                    await sleep(node.pause * 1000);
                }
            } else {
                let sentence = node.split("");
                let newReceiver = document.createTextNode("");
                receiver.appendChild(newReceiver);
                for (let glyph of sentence) {
                    receiver.textContent += glyph;
                    rest.textContent = rest.textContent.slice(1);
                    await sleep(40);
                }
            }
        }
        resolve();
    });
}


// prevoir sur tag/line/etc. des fonction remove first/remove n
