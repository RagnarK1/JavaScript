import {div, p} from "../framework/elements.js";
import {Fw} from "../framework/page.js";
import {createState} from "../framework/state.js";
import {Board, generateBoard} from "./board.js";
import {Chat} from "./chat.js";
import {Player, removePlayer, VirtualPlayer} from "./mechanics.js";
import {sendMessage} from "./sockets.js";
import {GameoverMenu, jumpToGameOver, LobbyMenu, Menu, navigationState, nicknameState} from "./gameplay.js";

export let BOMB_TIME = 2
export let PLAYER_ID = 0


export function setPlayerId(value) {
    PLAYER_ID = value
}

//this houses the stats for player

//controls settings for local player only
export const gamestate = {
    livesState: createState(3),
    setLives: function (newCount) {
        sendMessage({type: "life_count", value: newCount, id: PLAYER_ID})
        //update the server as well via websockets
    },
    countHit: function () {
        const currentLives = gamestate.livesState.get()
        gamestate.livesState.set(currentLives - 1)
        if (currentLives - 1 === 0) {
            //game over
            sendMessage({type: "player_killed", id: PLAYER_ID})
            removePlayer(PLAYER_ID)
            jumpToGameOver()
        }
    },
    chatActive: false,
    currentBombs: 0,
    allowedBombs: 1,
    increment: 5,
    speedMultiplier: 0.5,
    seed: createState(""),
    bombrangeBoost: 1, // each powerup increases by one
    increasedMovementSpeed: false,
    paused: createState(true), //pause menu
    over: createState(false), //game over
    counter: createState(0),
    counterInterval: null
}

export const positionX = createState(40)
export const positionY = createState(40)
export const row = createState(1)
export const col = createState(1)
export const moveInProgress = createState(false)
export const children = createState([])
let rectCache = {};
let cachedBoard = {}; //builds the cache, cheaper to query object than search every time
export const frames = [] //functions of actions to complete in every frame. executes whatever is pushed here at every animation frame
export const players = {}
export const moveQueue = {};


//Main UI
const Main = (...c) => {
    const app = div({id: "app"}, () => {
        if (gamestate.paused.get()) {
            if (navigationState.get() === "lobby") {
                return LobbyMenu()
            }
            return Menu()
        } else {
            if (navigationState.get() === "gameOver") {
                return GameoverMenu()
            } else if (navigationState.get() === "lobby") {
            }
            return c
        }
    })
    gamestate.paused.subscribe(app)
    navigationState.subscribe(app)
    return app
}

const SideBar = (...children) => {
    return div({id: "sidebar"}, ...children)
}

const Stats = () => {
    const elem = div({id: "stats"},
        () => {
            return gamestate.paused.get() ? null :
                [StatsItem("Player id: ", PLAYER_ID.toString()),
                    LivesItem(),
                    StatsItem("Nickname: ", nicknameState.getter())]
        },
    )
    gamestate.paused.subscribe(elem)
    nicknameState.subscribe(elem)
    return elem
}

const LivesItem = () => {
    const item = p({}, () => gamestate.livesState.get().toString())
    gamestate.livesState.subscribe(item)
    return div({class: "statsItem"}, p({}, "Lives: "), item)
}
const StatsItem = (name, value) => {
    return div({class: "statsItem"}, p({}, name), p({}, value))
}

export function setGameId(id) {
    GAME_ID = id
}

export let GAME_ID = ""

//Start the game based on WS object
export function start(json) {
    gamestate.paused.set(false)
    generateBoard();
    for (let i = 0; i < Object.keys(players).length; i++) {
        const p = Object.values(players)[i]
        if (p.id === PLAYER_ID) {
            const mainPlayer = Player(p.id, p.corner)
            children.get().push(mainPlayer)
            players[p.id].element = mainPlayer.element
            continue
        }
        const newPlayer = VirtualPlayer(p.corner, p.id)
        players[p.id].element = newPlayer.element
        children.get().push(newPlayer)
    }
    children.set(children.get())
}

const CACHE = false

//query cell by its row and col
export function queryCell(row, col) {
    const selector = `[data-row='${row}'][data-col='${col}']`
    if (!CACHE) {
        try {
            return [document.querySelector(selector), document.querySelector(selector).getBoundingClientRect()]
        } catch {
            return [undefined, undefined]
        }
    }
    const cached = cachedBoard[selector]
    const rectCached = rectCache[selector]
    if (cached) return [cached, rectCached]
    const currentElement = document.querySelector(selector)
    if (currentElement) {
        cachedBoard[selector] = currentElement
        buildCellRectCache(selector, currentElement)
        return [currentElement, rectCache[selector]]
    }
}


window.addEventListener("load", () => {
    buildCellCache()
})

//caches cells into object
function buildCellCache() {
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            queryCell(row, col)
        }
    }
}

function buildCellRectCache(selector, element) {
    rectCache[selector] = element.getBoundingClientRect()
}

async function gameloop() {
    if (!document.hidden) {
        const func = frames.pop()
        if (func) func()
    }
    requestAnimationFrame(gameloop)
}

requestAnimationFrame(gameloop)
window.addEventListener('resize', function () {
    // Code to handle the resize event
    // Update your cached clientBoundRects here
    rectCache = {}
    cachedBoard = {}
    buildCellCache()
});
Fw.loadCss("src/styles.css")
Fw.registerRoute("/", () => {
    const board = Board()
    const main = Main(SideBar(Chat(), Stats()), board)
    gamestate.seed.subscribe(main)
    return main
})
Fw.init()
