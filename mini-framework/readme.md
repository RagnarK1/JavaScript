Implementation of the `mini-framework` project.
# About
 
# How to use FW

## 1. Simple counter example

```javascript
import { button, div, p, section } from "../framework/elements.js";
import { Fw } from "../framework/page.js";
import { createState } from "../framework/state.js";

function Home() {
    const counter = createState(0)
    const CounterDisplay = p({ id: "counter" }, () => `Counter: ${counter.get()}`)
    const Section = section({
        class: "counter-section"
    },
        div({
            class: "counter-container"
        },
            button({
                id: "counter-button",
                onclick: () => counter.set(counter.get() + 1)
            }, "Increment"),
            CounterDisplay
        )
    )
    counter.subscribe(CounterDisplay)
    return Section
}


Fw.loadCss("src/styles.css")
Fw.registerRoute("/", Home)

Fw.init()

```

## 2. How to use components
You can create custom components by creating a function which returns variable of `Component` type. Fw provides pre defined components for most of the HTML elements. To create a div, you just import `div` from elements and call it by `div({class: "classname here"}, child components here)`. Example of creating a a reusable component, which has its own state and functions: 
```javascript

import { div, section } from "../framework/elements.js";
import { Fw } from "../framework/page.js";
import { createState } from "../framework/state.js";

function Home() {
    return section({
        class: "main-area"
    }, () => Array.from({ length: 100 }, (_, i) => Item(i)))
}


function Item(index) {
    const randomNumber = createState(0)
    setInterval(() => randomNumber.set(Math.random()), 1000)
    const updateText = () => `Number now: ${randomNumber.get()}`
    const Container = div({
        class: "container",
        id: `index-${index}`
    }, updateText)
    randomNumber.subscribe(Container)
    return Container
}


Fw.loadCss("src/styles.css")
Fw.registerRoute("/", Home)

Fw.init()

```
## 3. How to use states

You can create state with `createState(defaultValue)` function which returns a `State` object. In order to access current state value you can use `State.get()`, to set new state use `State.set()`. State component needs to be subscribed to the target component with `State.subscribe(component)`. In order to automatically update component based on state changes, you need to pass the state value as function, to either attributes or children.
<br>

How to use state: 
```javascript
    function MyComponent() {
        const counterState = createState(0)
        const textComponent = p({
            class: "text"
        }, ()=>`Counter is: ${counterState.get()}`, //Pass in function with return value when you need data to change dynamically after updates. You can use it in attributes and children.
            button({
                id: "incrementer"
        }, "Increment"))
        counterState.subscribe(textComponent) //Subscribe component to the state updates
        return textComponent
    }
```

## 4. How to navigate
When navigating inside your web app, you have to use `data-link` property for the `<a/>` tags. Example: 
```javascript
import { a } from "../framework/elements.js";
const link = a({
    href: "/",
    "data-link": true
}, "Visit homepage")
```
You can then navigate without reloading the page. Alternatively, you can navigate using `Fw.navigate(path)`.


## 5. Structure and how to run your app
Your app structure has to be placed into the `src/` folder. Main entry file is named `main.js`, this is where you place your start files.
Requirements: Node.js

First install the required modules by running ``npm install``.
You can now launch your FW app by running ``npm run start``.

# TODO MVC

Example has been uploaded to [Vercel](https://mini-framework-chi.vercel.app/)
