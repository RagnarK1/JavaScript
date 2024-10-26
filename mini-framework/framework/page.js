import { getter } from "./component.js"

class Framework {
    routes = {}
    navigate(path) {
        window.history.pushState({}, "", path);
        this.render(path);
    }

    loadCss(path) {
        const addedLink = document.createElement("link")
        addedLink.rel = 'stylesheet';
        addedLink.type = 'text/css';
        addedLink.href = path;
        document.head.appendChild(addedLink)
        document.head.insertBefore(addedLink, document.head.firstChild)
    }

    registerRoute(pathname, view) {
        this.routes[pathname] = view
    }

    render(path) {
        const existing = this.routes[path]
        if (existing) {
            document.body.innerHTML = ""
            document.body.appendChild(getter(existing()))
        }
    }

    init() {
        document.addEventListener("DOMContentLoaded", this.render(window.location.pathname))
        window.addEventListener("popstate", () => this.render(window.location.pathname))
        document.addEventListener('click', () => {
            if (event.target.matches("[data-link]")) {
                event.preventDefault();
                var href = event.target.getAttribute('href');
                this.navigate(href)
            }
        });
    }
}


export class Route {
    pathname = null
    view = null
    constructor(pathname, view) {
        this.pathname = pathname
        this.view = view
    }
}

export const Fw = new Framework()
