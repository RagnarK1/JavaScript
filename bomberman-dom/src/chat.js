import {button, div, input, p} from "../framework/elements.js";
import {createState} from "../framework/state.js";
import {GAME_ID, gamestate, PLAYER_ID, players} from "./bomberman.js";
import {sendMessage} from "./sockets.js";

const messages = createState([])
let message = ""

export function Chat() {
    const messagesContainer = div({class: "messages"}, () => messages.get().map(message => Message(message.message, message.nickname)))
    const chatInput = input({
        id: "chat-input",
        placeholder: "Your message here",
        onchange: (event) => message = event.target.value,
    })
    chatInput.element.addEventListener("blur", () => {
        gamestate.chatActive = false
    })
    chatInput.element.addEventListener("focus", () => {
        gamestate.chatActive = true
    })
    const element = div({class: "chat"},
        div({style: "height: 20%; display: flex; flex-direction: row;"}, chatInput,
            button({
                id: "sendMessage",
                onclick: () => {
                    if (message.length === 0) {
                        return
                    }
                    newMessage({message: message, id: PLAYER_ID, nickname: players[PLAYER_ID].nickname})
                    sendMessage({
                        type: "chat_message",
                        message: message,
                        id: PLAYER_ID,
                        inviteCode: GAME_ID
                    })
                    chatInput.element.value = ""
                    message = ""
                }
            }, "Send")), messagesContainer)
    messages.subscribe(messagesContainer)
    return element
}


function Message(text, sender) {
    return div({class: `message ${sender === PLAYER_ID ? 'message-right' : ""}`}, p({}, `${sender}: ${text}`))
}

//add new message from WS
export function newMessage(json) {
    messages.get().push(json)
    messages.set(messages.get())
}
