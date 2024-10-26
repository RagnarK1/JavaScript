import { a, button, div, footer, h1, header, input, label, li, p, section, span } from "../framework/elements.js";
import { Fw } from "../framework/page.js";
import { createState } from "../framework/state.js";
import { Filters } from "./components/filters.js";
import { ToDoList } from "./components/todolist.js";

Fw.loadCss("src/styles.css")

let index = 0 //for counting the id of todos

const allTodos = createState([]) //ToDo objects
const currentView = createState("All")

//Class to hold info about the todo
class ToDo {
    isDone = false
    component = null //Component class
    constructor(isDone, component) {
        this.isDone = isDone
        this.component = component
    }
    setDone(isDone) {
        this.isDone = isDone
    }
}


function Home() {
    //Create a todo based on the title
    function createToDo(title) {
        index++
        const editMode = createState(false) //whether edit mode is active
        const completed = createState(false) //whether its marked as completed
        const titleState = createState(title) //title, needed for editing
        const EditElem = input({
            id: "edit", class: "edit", value: titleState.get(), onload: function (event) {
                event.target.focus()
            }, onkeyup: function (event) {
                titleState.set(event.target.value)
            }
        })
        const LabelElem = label({
            ondblclick: function () {
                editMode.set(!editMode.get())
            },
        }, titleState.getter())
        document.addEventListener("click", function () {
            if (editMode.get() && !EditElem.element.contains(event.target)) {
                editMode.set(false)
            }
        })
        const Container = div({
            class: "view"
        },
            input({
                class: "toggle",
                type: "checkbox",
                onchange: function () {
                    const existing = allTodos.get().find(i => i.component.id === ListItem.id)
                    existing.setDone(!completed.get())
                    completed.set(!completed.get())
                    allTodos.set(allTodos.get())
                }
            }),
            LabelElem,
            button({
                class: "destroy",
                onclick: function () {
                    const currentArray = allTodos.get()
                    const newArray = currentArray.filter(i => i.component.id !== ListItem.id)
                    allTodos.set(newArray)
                }
            }))
        const ListItem = li({
            id: `todo-${index}`,
            class: () => `${editMode.get() ? "editing " : ""}${completed.get() ? "completed" : ""}`
        }, Container, () => editMode.get() ? EditElem : null
        )
        editMode.subscribe(ListItem)
        completed.subscribe(ListItem)
        titleState.subscribe(LabelElem)
        return ListItem
    }
    const Counter = span({
        class: "todo-count"
    }, function () {
        const todos = allTodos.get()
        const filtered = todos.filter(item => !item.isDone)
        const count = filtered.length
        return `${count} items left`
    })
    const FooterElem = footer({
        class: "footer"
    },
        Counter,
        () => Filters(currentView),
        () => {
            return allTodos.get().filter(item => item.isDone).length > 0 ?
                button({
                    class: "clear-completed",
                    onclick: function () {
                        const todos = allTodos.get()
                        const newArray = todos.filter(todo => !todo.isDone)
                        allTodos.set(newArray)
                    }
                }, "Clear Completed") : null
        }
    )
    const Section = section({
        class: "todoapp"
    },
        header({
            class: "header"
        },
            h1({

            }, "todos"),
            input({
                class: "new-todo",
                placeholder: "What needs to be done?",
                autofocus: true,
                onkeydown: function (event) {
                    if (event.key === 'Enter' || event.keyCode === 13) {
                        if (event.target.value.length !== 0) {
                            const newElem = createToDo(event.target.value)
                            const newTodo = new ToDo(false, newElem)
                            const currentArray = allTodos.get()
                            currentArray.push(newTodo)
                            allTodos.set(currentArray)
                            event.target.value = ""
                        }
                    }
                }
            })
        ),
        section({
            class: "main"
        },
            input({
                id: "toggle-all",
                class: "toggle-all",
                type: "checkbox",
                onchange: function () {
                    const todos = allTodos.get()
                    todos.map(item => item.isDone = true)
                    allTodos.set(todos)
                }
            }),
            label({
                for: "toggle-all"
            }, "Mark all as complete"),
            () => ToDoList(allTodos, currentView)
        ),
        () => allTodos.get().length > 0 ? FooterElem : null
    )
    const MainApp = div({
        id: "app",
    }, Section, footer({
        class: "info"
    },
        p({}, "Double click to edit a todo"),
        p({}, "Created by ", a({
            href: "https://01.kood.tech/git/martinilbi"
        }, "Martin Ilbi, "), a({
            href: "https://01.kood.tech/git/Ragnar"
        }, "Ragnar, "), a({href: "https://01.kood.tech/git/hraudberg"}, "Herald Raudberg"))
    )
    )
    allTodos.subscribe(Counter)
    allTodos.subscribe(FooterElem)
    allTodos.subscribe(Section)
    return MainApp
}

Fw.registerRoute("/", Home)

Fw.init()
