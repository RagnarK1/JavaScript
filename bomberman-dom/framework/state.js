
class State {
    value = null;
    subscribedComponents = [];

    constructor(initialValue) {
        this.value = initialValue;
        this.set = this.set.bind(this); // Bind 'this' to the set method
        this.subscribe = this.subscribe.bind(this);
    }

    get() {
        return this.value
    }
    getter() {
        return () => this.value
    }

    set(newValue) {
        this.value = newValue;
        this.subscribedComponents.forEach(element => {
            element.refresh()
        });
    }

    subscribe(component) {
        this.subscribedComponents.push(component)
    }
}

export function useState(initialValue) {
    const state = new State(initialValue);
    return [(() => state.get())(), state.set, state.subscribe];
}

export function createState(initialValue) {
    return new State(initialValue);
}