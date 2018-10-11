import { Tag } from "./parser/objects.js";
import { sleep, has } from "./utils.js";

export async function animate(txt, display, split="", speed=70, startX=0, startY=0) {
    var prevLines = display.lines;

    for (let line of txt) {
        let prevLine = prevLines[startY];
        let rest = Array.from(prevLine.childNodes);
        rest.first = function () {
            for (let node of this) {
                if (node.textContent !== "") return node;
            }
        }
        rest.removeGlyph = function () {
            let t = this.textNode.textContent;
            if (t.length > 0) {
                this.textNode.textContent = t.slice(1);
            } else {
                let parent = this.textNode.parentNode;
                this.textNode.remove();
                this.textNode = getTextNode(parent, rest);
                this.removeGlyph();
            }
        }
        rest.textNode = getTextNode(rest[0], rest);

        for (let node of line) {
            if (node instanceof Tag) {
                let newReceiver = node.emptyElement;
                prevLine.insertBefore(newReceiver, rest[0]);
                speed = await displayContent(node, newReceiver, rest, speed);
            } else if (typeof node === "object") {
                if (has(node, "pause")) {
                    await sleep(node.pause * 1000);
                } else if (has(node, "speed")) {
                    speed += node.speed * -10;
                }
            } else {
                let sentence = node.split("");
                let newReceiver = document.createTextNode("");
                prevLine.insertBefore(newReceiver, rest[0]);
                for (let glyph of sentence) {
                    newReceiver.textContent += glyph;
                    rest.removeGlyph();
                    await sleep(speed);
                }
            }
        }

        startY++;
    }
}

export function displayContent(emitter, receiver, rest, speed) {
    return new Promise (async (resolve) => {
        for (let node of emitter.nodes) {
            if (node instanceof Tag) {
                let newReceiver = node.emptyElement;
                receiver.appendChild(newReceiver);
                speed = await displayContent(node, newReceiver, rest, speed);
            } else if (typeof node === "object") {
                if (has(node, "pause")) {
                    await sleep(node.pause * 1000);
                } else if (has(node, "speed")) {
                    speed += node.speed * -10;
                }
            } else {
                let sentence = node.split("");
                let newReceiver = document.createTextNode("");
                receiver.appendChild(newReceiver);
                for (let glyph of sentence) {
                    newReceiver.textContent += glyph;
                    rest.removeGlyph();
                    await sleep(speed);
                }
            }
        }
        resolve(speed);
    });
}

function getTextNode(node, rest) {
    if(node.constructor === Text) {
        return node;
    } else if (!node.hasChildNodes()) {
        let next;
        if (node.nextSibling) {
            next = node.nextSibling;
        } else {
            next = node.parentNode;
        }
        node.remove()
        return getTextNode(next, rest);
    } else {
        if (node.classList.contains("line")) {
            return getTextNode(rest.first(), rest);
        } else {
            return getTextNode(node.firstChild, rest);
        }

    }
}

export async function animatedClean(display, glyph=" ", speed=50) {
    var prevLines = display.lines;
    let width = display.width;

    for (let prevLine of prevLines) {
        let rest = Array.from(prevLine.childNodes);
        rest.first = function () {
            for (let node of this) {
                if (node.textContent !== "") return node;
            }
        }
        rest.removeGlyph = function () {
            let t = this.textNode.textContent;
            if (t.length > 0) {
                this.textNode.textContent = t.slice(1);
            } else {
                let parent = this.textNode.parentNode;
                this.textNode.remove();
                this.textNode = getTextNode(parent, this);
                this.removeGlyph();
            }
        }
        rest.textNode = getTextNode(rest[0], rest);
        let receiver = document.createTextNode("");
        prevLine.insertBefore(receiver, rest[0]);
        for (let i = 0; i < width; i++) {
            receiver.textContent += glyph;
            rest.removeGlyph();
            await sleep(speed);
        }

    }
}
