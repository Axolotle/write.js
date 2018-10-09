export class Txt extends Array {
    constructor(...lines) {
        super(...lines);
    }

    push(line) {
        if (!line instanceof Line)
            throw new TypeError("Argument 'line' is not a Line instance.")
        super.push(line);
    }
}

export class Line extends Array {
    constructor(...items) {
        super(...items);
    }

    get HTMLString() {
        return this.reduce((str, item) => {
            if (item instanceof Tag) {
                return str + item.HTMLString;
            } else if (typeof item == "string") {
                return str + item;
            } else {
                return str;
            }
        }, "");
    }

    get textLength() {
        return this.reduce((sum, item) => {
            if (item instanceof Tag || typeof item == 'string') {
                return sum + item.length;
            } else {
                return sum;
            }
        }, 0);
    }
}

export class Tag {
    constructor(nodeName, attrs) {
        this.nodeName = nodeName;
        this.nodes = [];
        this.attrs = attrs;
    }

    get length() {
        return this.nodes.reduce((sum, node) =>{
            if (node instanceof Tag || typeof node == 'string') {
                return sum + node.length;
            } else {
                return sum;
            }
        }, 0);
    }

    get attrStr() {
        var str = "";
        for (let name in this.attrs) {
            str += ` ${name}="${this.attrs[name]}"`;
        }
        return str;
    }

    get emptyElement() {
        var element = document.createElement(this.nodeName);
        for (let name in this.attrs) {
            element.setAttribute(name, this.attrs[name]);
        }
        return element;
    }

    get HTMLString() {
        var str = `<${this.nodeName + this.attrStr}>`;
        for (let node of this.nodes) {
            if (node instanceof Tag) {
                str += node.HTMLString;
            } else if (typeof node === "string") {
                str += node;
            }
        }
        return str + `</${this.nodeName}>`;
    }

    push(node) {
        this.nodes.push(node);
    }

    init(parent) {
        var child = this.emptyElement;
        parent.appendChild(child);
        return child;
    }
}
