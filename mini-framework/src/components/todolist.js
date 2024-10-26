import { ul } from "../../framework/elements.js"

export function ToDoList(allTodos, currentView) {
    const todoList = ul({
        class: "todo-list"
    }, function () {
        console.log("filtering")
        const todos = allTodos.get()
        if (currentView.get() === "Active") {
            return todos.filter(todo => !todo.isDone).map(todo => todo.component)
        } else if (currentView.get() === "Completed") {
            return todos.filter(todo => todo.isDone).map(todo => todo.component)
        }
        else {
            return todos.map(todo => todo.component)
        }
    })
    currentView.subscribe(todoList)
    allTodos.subscribe(todoList)
    return todoList
}