export function C(tag, attributes, ...children) {
    const component = new Component(tag, attributes, children)
    return component
}

class Component {
    tag = null
    attributes = {}
    children = null
    element = null
    id = null
    constructor(tag, attributes, children) {
        this.tag = tag
        this.attributes = attributes
        this.children = children
        this.element = this.render()
        this.id = crypto.randomUUID();
    }
    getId() {
        return this.id
    }
    refresh() {
        const newElement = this.render()
        replaceElementWithNew(this.element, newElement)
        this.element = newElement
    }

    render() {
        console.log("rendering ", this.tag)
        const element = document.createElement(this.tag);
        // Set attributes and event listeners
        for (let [key, value] of Object.entries(this.attributes)) {
            if (key.startsWith('on') && typeof value === 'function') {
                element[key] = value; // Assign event listeners directly
            } else {
                if (typeof value === "function") {
                    value = value()
                }
                element.setAttribute(key, value); // Set other attributes as usual
            }
        }
        // Append children
        this.children.forEach(child => {
            if (typeof child === 'function') {
                const result = child()
                if (typeof result == "string") {
                    element.appendChild(document.createTextNode(result));
                } else {
                    if (result instanceof Component) {
                        element.appendChild(getter(result)); // Child as a function
                    } else if (Array.isArray(result)) {
                        for (let item of result) {
                            if (item instanceof Component) {
                                element.appendChild(getter(item))
                            }
                        }
                    }
                    else {
                        if (result) {
                            element.appendChild(result)
                        }
                    }
                }
            } else if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            } else if (child instanceof Component) {
                element.appendChild(getter(child))
            }
        });
        return element;
    }

    getElement() {
        return this.element
    }

    destroy() {
        this.element.remove()
    }
}

function replaceElementWithNew(oldElement, newElement) {
    oldElement.replaceWith(newElement)
}

export function getter(component) {
    return component.getElement()
}