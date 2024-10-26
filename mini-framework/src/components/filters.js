import { a, li, ul } from "../../framework/elements.js";

function FilterLink(title, currentView) {
    const link = a({
        href: `/${title.toLowerCase()}`, 
        "data-link": true,
        onclick: () => {
            currentView.set(title);
            Fw.navigate(`/${title.toLowerCase()}`); 
        },
        class: () => currentView.get() === title ? "selected" : ""
    }, title);

    const listItem = li({}, link);
    currentView.subscribe(link);

    return listItem;
}

export function Filters(currentView) {
    const elem = ul({
        class: "filters"
    },
        FilterLink("All", currentView),
        FilterLink("Active", currentView),
        FilterLink("Completed", currentView),
    );

    return elem;
}
