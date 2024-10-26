//Everything related to gameplay itself such as start menu, game over, etc
import {createState} from "../framework/state.js";
import {button, div, h1, input, label, p} from "../framework/elements.js";
import {children, GAME_ID, gamestate, PLAYER_ID, players} from "./bomberman.js";
import {sendMessage} from "./sockets.js";
import {Chat} from "./chat.js";

export function jumpToGameOver() {
    navigationState.set("gameOver")
}

let nickname = ""
let joinId = ""
//main menu container
const menuItemState = createState("start") //can be start or join
const showError = createState(null) //show the error when invite code was not found, value is the message to show. if null dont show
export const navigationState = createState("game") //controls screens can be game or lobby or gameOver

//creates a new game and starts the countdown
function createNewGame() {
    console.log(nickname)
    sendMessage({type: "join_game", inviteCode: "", id: PLAYER_ID, nickname: nickname})
}

export function Menu() {
    const menuItems = div({id: "menuItems"},
        h1({id: "gameTitle"}),
        () => {
            if (menuItemState.get() === "start") {
                return [...StartMenu()]
            }
            return menuItemState.get() === "start" ? [...StartMenu()] : [...JoinMenu()];
        })
    const element = div({id: "startMenu"},
        menuItems)
    menuItemState.subscribe(menuItems)
    showError.subscribe(menuItems)
    return element
}

export function StartMenu() {
    return [nicknameLabel,
        MenuButton("Create game", () => {
            createNewGame();
        }),
        MenuButton("Join Game", () => menuItemState.set("join"))]
}

export function MenuButton(title, onclick) {
    return button({class: "menuButton", onclick}, title)
}

//This menu will be shown when player gets killed. Game over
export function GameoverMenu() {
    return div({id: "startMenu"}, div({
            id: "menuItems"
        },
        h1({style: "color: white;"}, "Game over"),
        MenuButton("Go to main menu", () => {
            //we reset all the game values here
            window.location.reload()
            //navigationState.set("game") //set back to game from game over
            //menuItemState.set("start") //reset menu items state to start
            //gamestate.paused.set(true) //set to the main pause menu
        })
    ))
}

//This will be shown when player has joined a lobby and is awaiting game
export function LobbyMenu() {
    const timeLabel = label({id: "counter", "data-value": () => gamestate.counter.get().toString()}, () => {
        if (gamestate.counter.get() !== 0) return gamestate.counter.get().toString()
    })
    const playerList = div({id: "playerCounter"}, () => Object.values(players).length.toString())
    const inviteCodeLabel = label({id: "inviteCode"}, GAME_ID)

    const element = div({id: "lobby"},
        "Time left:", timeLabel,
        "Player count:", playerList,
        "Invite code:", inviteCodeLabel,
        Chat()
    )
    children.subscribe(playerList)
    gamestate.counter.subscribe(timeLabel)
    return element
}

export const nicknameState = createState("")
const nicknameLabel = label({id: "inviteLabel"},
    div({class: "flex-row"},
        p({}, "Nickname: "),
        input({
            id: "nickname", onchange: function (event) {
                nickname = event.target.value
                nicknameState.set(nickname)
            }
        }))
)

//Menu displayed when clicking join game
export function JoinMenu() {
    const inviteErrorElement = p({id: "error"}, showError.getter())
    const nicknameErrorElement = p({id: "error"},)
    const inviteLabel = label({id: "inviteLabel"},
        div({class: "flex-row"},
            p({}, "Invite code: "),
            input({
                id: "gameId", onchange: function (event) {
                    joinId = event.target.value
                }
            })),
        () => showError.get() ? inviteErrorElement : null)
    showError.subscribe(inviteLabel)
    return [inviteLabel, MenuButton("Join", () => {
        //this will send invite code to the server to request join
        sendMessage({type: "join_game_invite", inviteCode: joinId, id: PLAYER_ID, nickname: nickname})
    }), MenuButton("Back", () => menuItemState.set("start"))]
}


//sets the showError
export function setError(message) {
    showError.set(message)
}
