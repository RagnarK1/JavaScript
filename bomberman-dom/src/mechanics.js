/* eslint-disable no-unused-vars */
import {div} from "../framework/elements.js"
import {createState} from "../framework/state.js"
import {createPosition} from "./board.js"
import {
    BOMB_TIME,
    children,
    col,
    frames, GAME_ID,
    gamestate,
    moveInProgress,
    moveQueue,
    PLAYER_ID,
    players,
    positionX,
    positionY,
    queryCell,
    row, start
} from "./bomberman.js"
import {sendMessage} from "./sockets.js"
import {capturePowerup, createPowerup} from "./powerups.js";

export const processQueue = []

// // Listen for visibility change events
// document.addEventListener("visibilitychange", function () {
//     if (!document.hidden) {
//         //process the queue
//         for (let q of processQueue) {
//             q()
//         }
//     }
// });

//player object for moving team member elements. movement is based on websocket messages
export function VirtualPlayer(corner, id) {
    return div({class: "player", id: id, style: () => createPosition(corner)})

}

//set them true to move player in direction
let movingDown = false
let movingUp = false
let movingLeft = false
let movingRight = false


export function Player(id, corner = "bottomright") {
    const playerElem = div({
        class: "player", id: id, style: () => createPosition(corner, true)
    })

    //Animates a smooth movement calculation
    function animate() {
        if (!moveInProgress.get()) {
            if (movingDown) {
                moveDown()
            } else if (movingUp) {
                moveUp()
            } else if (movingLeft) {
                moveLeft()
            } else if (movingRight) {
                moveRight()
            }
        }
        requestAnimationFrame(animate)
    }

    animate()

    // function sync() {
    //     const top = playerElem.element.style.top
    //     const left = playerElem.element.style.left
    //     sendMessage({"type": "sync", "left": left, top: top, id: PLAYER_ID, inviteCode: GAME_ID})
    // }

    function sync() {
        setTimeout(function () {
            const top = playerElem.element.style.top
            const left = playerElem.element.style.left
            // sendMessage({"type": "sync", "left": left, top: top, id: PLAYER_ID, inviteCode: GAME_ID})
            sendMessage({"type": "sync", "left": left, "top": top, id: PLAYER_ID, inviteCode: GAME_ID})
            console.log('sync delayed')
        }, 30);
    }

    function throttle(func, delay) {
        let throttling = false;

        return function () {
            if (!throttling) {
                throttling = true;
                func.apply(this, arguments);
                setTimeout(function () {
                    throttling = false;
                }, delay);
            }
        };
    }

    function insideFlame(current) {
        if (current.querySelector(".flame")) {
            console.log("inside flame")
            hitPlayer(playerElem.element)
        }
    }

    const throttled = throttle(sync, 1000)

    function moveDown() {
        const increment = gamestate.increment //how man pixels to move each time
        let newPosition = positionY.get() + increment
        //get the element down, if it's a blocking then don't allow to move any further
        const [element, rects] = queryCell(row.get() + 1, col.get())
        const [current, currentRects] = queryCell(row.get(), col.get())
        const playerRects = playerElem.element.getBoundingClientRect()
        const isBlocked = ifBlocked(element)
        capturePowerup(current)
        insideFlame(current)
        if (isInside(playerRects, currentRects)) {
            if (isBlocked) {
                //check if rects collide
                if (playerRects.bottom + increment > rects.top) {
                    // throttled()
                    return
                }
            }
        } else {
            //check whether next step would cross over the top of bottom block or not
            if (isBlocked) {
                if (playerRects.bottom + increment > rects.top) {
                    return
                }
            } else {
                //check if it collides with something on the side
                if (isBottom(playerRects, currentRects)) {
                    if (playerRects.right > rects.right) {
                        moveLeft()
                    } else {
                        moveRight()
                    }
                    return
                }
            }
        }
        const xPos = Math.floor((newPosition + 20) / 40)
        row.set(xPos)
        positionY.set(newPosition)
        move("down", playerElem, increment, true, gamestate.speedMultiplier)
    }

    function moveUp() {
        const increment = gamestate.increment //how man pixels to move each time
        const newPosition = positionY.get() - increment
        const [element, rects] = queryCell(row.get() - 1, col.get())
        const [current, currentRects] = queryCell(row.get(), col.get())
        const playerRects = playerElem.element.getBoundingClientRect()
        const isBlocked = ifBlocked(element)
        capturePowerup(current)
        insideFlame(current)
        if (isInside(playerRects, currentRects)) {
            if (isBlocked) {
                //check if rects collide
                if (Math.ceil(playerRects.top) - increment < rects.bottom) {
                    // throttled()
                    return
                }
            }
        } else {
            //check whether next step would cross over the top of bottom block or not
            if (isBlocked) {
                if (playerRects.top - increment < Math.ceil(rects.bottom)) {
                    return
                }
            } else {
                if (isTop(playerRects, currentRects)) {
                    //move it up or down until player fits into the gap
                    //determine which direction to go towards
                    //if player top is > current cell middle point, move up otherwise down
                    if (playerRects.right > rects.right) {
                        moveLeft()
                    } else {
                        moveRight()
                    }
                    return
                }
            }
        }
        const xPos = Math.floor((newPosition + 20) / 40)
        row.set(xPos)
        move("up", playerElem, increment, true, gamestate.speedMultiplier)
        positionY.set(newPosition < 40 ? 40 : newPosition)
    }

    function moveLeft() {
        const increment = gamestate.increment //how man pixels to move each time
        const newPosition = positionX.get() - increment
        const [currentElement, currentRects] = queryCell(row.get(), col.get())
        const [element, blockRects] = queryCell(row.get(), col.get() - 1)
        const playerRects = playerElem.element.getBoundingClientRect()
        const isBlocked = ifBlocked(element)
        capturePowerup(currentElement)
        insideFlame(currentElement)
        if (isInside(playerRects, currentRects)) {
            if (isBlocked) {
                //check if rects collide
                if (playerRects.left - increment < blockRects.right) {
                    // throttled()
                    return
                }
            }
        } else {
            //check whether next step would cross over the top of bottom block or not
            if (isBlocked) {
                if (playerRects.left - increment < blockRects.right) {
                    return
                }
            } else {
                if (isLeft(playerRects, currentRects)) {
                    //move it up or down until player fits into the gap
                    //determine which direction to go towards
                    //if player top is > current cell middle point, move up otherwise down
                    if (playerRects.bottom < blockRects.bottom) {
                        moveDown()
                    } else {
                        moveUp()
                    }
                    return
                }
            }
        }
        const xPos = Math.floor((newPosition + 10) / 40)
        col.set(xPos)
        move("right", playerElem, increment, true, gamestate.speedMultiplier)
        positionX.set(newPosition < 40 ? 40 : newPosition)
        console.log('pos......', xPos, newPosition)
    }

    function moveRight() {
        const increment = gamestate.increment //how man pixels to move each time
        const newPosition = positionX.get() + increment
        const [currentElement, currentRects] = queryCell(row.get(), col.get())
        const [element, blockRects] = queryCell(row.get(), col.get() + 1)
        const playerRects = playerElem.element.getBoundingClientRect()
        const isBlocked = ifBlocked(element)
        capturePowerup(currentElement)
        insideFlame(currentElement)
        if (isInside(playerRects, currentRects)) {
            if (isBlocked) {
                //check if rects collide
                if (playerRects.right + increment > blockRects.left) {
                    // throttled()
                    return
                }
            }
        } else {
            //check whether next step would cross over the top of bottom block or not
            if (isBlocked) {
                if (playerRects.right + increment > blockRects.left) {
                    return
                }
            } else {
                if (isRight(playerRects, currentRects)) {
                    //move it up or down until player fits into the gap
                    //determine which direction to go towards
                    //if player top is > current cell middle point, move up otherwise down
                    if (playerRects.bottom < blockRects.bottom) {
                        moveDown()
                    } else {
                        moveUp()
                    }
                    return
                }
            }
        }
        const xPos = Math.floor((newPosition + 10) / 40)
        col.set(xPos)
        move("left", playerElem, increment, true, gamestate.speedMultiplier)
        positionX.set(newPosition > (40 * 13) + 20 ? (40 * 13) + 20 : newPosition) //calculate the edges, taking into account player widht is 20 px
    }

    window.addEventListener("keyup", function (event) {
        switch (event.key) {
            case "ArrowDown":
                movingDown = false
                sync()
                break
            case "ArrowUp":
                movingUp = false
                sync()
                break
            case "ArrowLeft":
                movingLeft = false
                sync()
                break
            case "ArrowRight":
                movingRight = false
                sync()
                break
        }
    })
    window.addEventListener("keydown", function (event) {
        const increment = gamestate.increment //how man pixels to move each time
        if (moveInProgress.get()) {
            return
        }
        //go over rest of the directions and set to false for smoother movement
        if (event.key === "ArrowDown") {
            movingDown = true
            movingRight = false
            movingLeft = false
            movingUp = false
        } else if (event.key === "ArrowUp") {
            movingDown = false
            movingRight = false
            movingLeft = false
            movingUp = true
        } else if (event.key === "ArrowLeft") {
            movingDown = false
            movingUp = false
            movingRight = false
            movingLeft = true
        } else if (event.key === "ArrowRight") {
            movingLeft = false
            movingUp = false
            movingRight = true
            movingDown = false
        } else if (event.code === "Space") {
            if (gamestate.chatActive) {
                return
            }
            //add bomb to gamestate and check whether it's over limit
            if (gamestate.currentBombs === gamestate.allowedBombs) {
                //cant drop a bomb
                return
            }
            gamestate.currentBombs = gamestate.currentBombs + 1
            const arr = children.get()
            const bomb = Bomb(playerElem)
            arr.push(bomb)
            children.set(arr)
        }
    })
    return playerElem
}

//bomb created by other players, use it to spawn from websocket messages
function VirtualBomb(row, col, left, top, id, bombRange) {
    console.log("vbobm")
    const timeleft = createState(BOMB_TIME)
    const bomb = div({
        "data-row": row,
        "data-col": col,
        id: id,
        class: "bomb",
        style: `left: ${left + "px"}; top:${top + "px"}`
    }, () => `${timeleft.get()}`)
    const interval = setInterval(() => {
        timeleft.set(timeleft.get() - 1)
        if (timeleft.get() === 0) {
            //clear blocks which are in blast radius
            //max destroy 1 blocks in one direction, but if no blocks move 2 blocks in one direction
            frames.push(() => {
                ((_row, _col, _range) => {
                    shootDown(_row, _col, _range, true)
                    shootLeft(_row, _col, _range, true)
                    shootRight(_row, _col, _range, true)
                    shootUp(_row, _col, _range, true)
                })(row, col, bombRange)
                bomb.destroy()
                const childrenArr = children.get()
                //remove the bomb from children
                const filteredArr = childrenArr.filter(child => child.element.id !== id)
                children.set(filteredArr)
            })
            clearInterval(interval)
        }
    }, 1000)
    timeleft.subscribe(bomb)
    return bomb
}

//tracks whether player already received a hit in single bomb explosion
let hit = false

//Creates a bomb on current player position.
function Bomb() {
    const timeleft = createState(BOMB_TIME)
    const id = `${Math.random()}`
    const currentRow = row.get()
    const currentCol = col.get()
    const bomb = div({
        "data-row": currentRow,
        "data-col": currentCol,
        id: id,
        class: "bomb",
        style: `left: ${positionX.get() + "px"}; top:${positionY.get() + "px"}`
    }, () => `${timeleft.get()}`)
    const interval = setInterval(() => {
        timeleft.set(timeleft.get() - 1)
        if (timeleft.get() === 0) {
            //clear blocks which are in blast radius
            //max destroy 1 blocks in one direction, but if no blocks move 2 blocks in one direction
            frames.push(() => {
                ((_row, _col, _range) => {
                    shootDown(_row, _col, _range)
                    shootLeft(_row, _col, _range)
                    shootRight(_row, _col, _range)
                    shootUp(_row, _col, _range)
                    hit = false
                })(currentRow, currentCol, gamestate.bombrangeBoost)
                bomb.destroy()
                gamestate.currentBombs--
                const childrenArr = children.get()
                //remove the bomb from children
                const filteredArr = childrenArr.filter(child => child.element.id !== id)
                children.set(filteredArr)
            })
            clearInterval(interval)
        }
    }, 1000)
    timeleft.subscribe(bomb)
    sendMessage({
        type: "bomb",
        bombRange: gamestate.bombrangeBoost,
        row: currentRow,
        col: currentCol,
        left: positionX.get(),
        top: positionY.get(),
        bombId: id,
        clientId: PLAYER_ID
    })
    return bomb
}

//Whenever a player gets hit by a bomb
function hitPlayer(player) {
    if (hit) {
        return
    }
    hit = true
    if (player.id === PLAYER_ID.toString()) {
        gamestate.countHit()
    } else {
        //hit someone else, send the hit via websockets because local flame on other players computer won't recognize hit if it was placed from someone else
        //could be optimized, but it already works
        sendMessage({type: "player_hit", targetId: parseInt(player.id), id: PLAYER_ID})
    }
}

//Shoot flames up
function shootUp(row, col, range, virtual = false) {
    // Loop through each cell in the range above the bomb
    const [explodedCells, explodedRects] = [[], []]
    for (let i = 1; i <= range; i++) {
        const [cell, rects] = queryCell(row - i, col); // Get the cell at the current range step
        if (checkBombrangeCell(cell, explodedRects, explodedCells, rects, virtual)) break
    }
    if (virtual) return
    if (explodedCells.length === 0) {
        return
    }
    //get top and bottom cells
    const bottom = explodedRects[0]
    const top = explodedRects[explodedCells.length - 1]
    const playerElems = Array.from(document.querySelectorAll(".player"))
    for (let player of playerElems) {
        const playerRects = player.getBoundingClientRect()
        if (playerRects.top <= bottom.bottom) {
            if (playerRects.bottom >= top.top) {
                if (playerRects.left >= top.left && playerRects.right <= top.right) {
                    hitPlayer(player)
                    return
                }
            }
        }
    }
}


function shootRight(row, col, range, virtual = false) {
    // Loop through each cell in the range to the right of the bomb
    const [explodedCells, explodedRects] = [[], []]
    for (let i = 1; i <= range; i++) {
        const [cell, rects] = queryCell(row, col + i); // Get the cell at the current range ste
        if (checkBombrangeCell(cell, explodedRects, explodedCells, rects, virtual)) break
    }
    if (virtual) return
    if (explodedCells.length === 0) {
        return
    }
    //get top and bottom cells
    const left = explodedRects[0]
    const right = explodedRects[explodedCells.length - 1]
    const playerElems = Array.from(document.querySelectorAll(".player"))
    for (let player of playerElems) {
        const playerRects = player.getBoundingClientRect()
        if (playerRects.right >= left.left) {
            if (playerRects.left <= right.right) {
                if (playerRects.top >= right.top && playerRects.bottom <= right.bottom) {
                    hitPlayer(player)
                    return
                }
            }
        }
    }
}

function shootLeft(row, col, range, virtual = false) {
    // Loop through each cell in the range to the left of the bomb
    const [explodedCells, explodedRects] = [[], []]
    for (let i = 1; i <= range; i++) {
        const [cell, rects] = queryCell(row, col - i); // Get the cell at the current range step
        if (checkBombrangeCell(cell, explodedRects, explodedCells, rects, virtual)) break
    }
    if (virtual) return
    //get top and bottom cells
    if (explodedRects.length === 0) {
        return
    }
    const right = explodedRects[0]
    const left = explodedRects[explodedCells.length - 1]
    const playerElems = Array.from(document.querySelectorAll(".player"))
    for (let player of playerElems) {
        const playerRects = player.getBoundingClientRect()
        if (playerRects.right >= left.left) {
            if (playerRects.left <= right.right) {
                if (playerRects.top >= right.top && playerRects.bottom <= right.bottom) {
                    hitPlayer(player)
                    return
                }
            }
        }
    }
}


function shootDown(row, col, range, virtual = false) {
    //Creates explosion in passed cell
    // Loop through each cell in the range below the bomb
    const [explodedCells, explodedRects] = [[], []]
    console.log("range: ", range)
    for (let i = 1; i <= range; i++) {
        const [cell, rects] = queryCell(row + i, col); // Get the cell at the current range step
        if (checkBombrangeCell(cell, explodedRects, explodedCells, rects, virtual)) break
    }
    if (explodedRects.length === 0) {
        return
    }
    if (virtual) return
    //get top and bottom cells
    const top = explodedRects[0]
    const bottom = explodedRects[explodedCells.length - 1]
    const playerElems = Array.from(document.querySelectorAll(".player"))
    for (let player of playerElems) {
        const playerRects = player.getBoundingClientRect()
        if (playerRects.bottom > top.top) {
            if (playerRects.top < bottom.bottom) {
                if (playerRects.left >= top.left && playerRects.right <= top.right) {
                    hitPlayer(player)
                    return
                }
            }
        }
    }
}

//Checks whether cell is in the bomb range or not and performs explosion if needed
function checkBombrangeCell(cell, explodedRects, explodedCells, rects, virtual = false) {
    if (!cell) {
        return
    }
    if (cell.classList.contains("wall")) {
        // If it's a wall, stop the explosion in this direction
        return true
    } else if (cell.classList.contains("block")) {
        createExplosion(cell, explodedRects, explodedCells, rects, virtual)
        return true
    } else {
        // If it's an empty cell, continue the explosion in this direction
        createExplosion(cell, explodedRects, explodedCells, rects, virtual)
        return false
    }
}

//Creates a flame element on the impacted cell, and adds a random powerup
function Flame(cell, virtual = false) {
    const element = div({class: "flame"})
    setTimeout(() => element.destroy(), 1000)
    const isBlock = cell.classList.contains("block")
    if (isBlock) {
        if (!virtual) {
            const powerup = createPowerup(parseInt(cell.getAttribute("data-row")), parseInt(cell.getAttribute("data-col")))
            if (powerup) {
                cell.appendChild(powerup.element)
            }
        }
    }
    cell.appendChild(element.element)
}

function createExplosion(cell, explodedRects, explodedCells, rects, virtual = false) {
    Flame(cell, virtual)
    // If it's a block, destroy it and stop further explosion
    cell.className = "cell";
    explodedCells.push(cell)
    explodedRects.push(rects)
}


//creates the bomb planted by other users
export function createBomb(json) {
    const virtualBomb = VirtualBomb(json.row, json.col, json.left, json.top, json.bombId, json.bombRange)
    children.get().push(virtualBomb)
    children.set(children.get())
}

//add new player to the map, based on WS object
export function newPlayer(json) {
    function clearCounterInterval() {
        if (gamestate.counterInterval) {
            clearInterval(gamestate.counterInterval);
            gamestate.counterInterval = null;
        }
    }

    function counter10() {
        clearCounterInterval();
        gamestate.counter.set(10);
        gamestate.counterInterval = setInterval(() => {
            gamestate.counter.set(gamestate.counter.get() - 1);
            if (gamestate.counter.get() === 0) {
                start(json);
                clearCounterInterval();
            }
        }, 1000);
    }

    function counter20() {
        clearCounterInterval();
        gamestate.counter.set(20);
        gamestate.counterInterval = setInterval(() => {
            gamestate.counter.set(gamestate.counter.get() - 1);
            if (gamestate.counter.get() === 0) {
                sendMessage({type: "game_locked", inviteCode: GAME_ID});
                counter10();
            }
        }, 1000);
    }

    players[json.id] = {
        corner: json.corner,
        id: json.id,
        nickname: json.nickname
    }
    //update the player counter in lobby
    document.querySelector("#playerCounter").textContent = Object.keys(players).length.toString()
    //counter is set to 20 seconds
    if (Object.keys(players).length === 2) {
        //players can still join during the 20 seconds
        counter20()
    } else if (Object.keys(players).length === 4) {
        //start the 10 seconds counter immediately
        counter10()
    } else if (Object.keys(players).length === 3) {
        //adidional player joined reset timer to 20
        counter20()
    }
}

//Removes the player from game, after disconnect
export function removePlayer(id) {
    try {
        const playerElem = document.querySelector(`[id='${id.toString()}']`)
        playerElem.remove()
        const player = players[id]
        if (player) {
            delete players[id]
        }
        const newChildren = children.get().filter(child => child.element.id !== id.toString())
        children.set(newChildren)
    } catch (e) {
        console.log("Failed to remove player")
    }
}


export function isBottom(playerRects, blockRects) {
    return playerRects.bottom === blockRects.bottom;
}

export function isTop(playerRects, blockRects) {
    return playerRects.top === blockRects.top;
}


export function isLeft(playerRects, blockRects) {
    return playerRects.left === blockRects.left;

}

export function isRight(playerRects, blockRects) {
    return playerRects.right === blockRects.right;

}

export function isInside(playerRects, blockRects) {
    if ((playerRects.left >= blockRects.left) && (playerRects.right <= blockRects.right)) {
        return (playerRects.top >= blockRects.top) && (playerRects.bottom <= blockRects.bottom);
    }
    return false
}


export function ifBlocked(element) {
    return element?.classList.contains("wall") || element?.classList.contains("block")
}

function move(direction, player, increment = 5, isPlayer = false, multiplier = 1) {
    if (isPlayer) {
        if (moveInProgress.get()) {
            return
        }
        moveInProgress.set(true)
    }
    const startTime = performance.now();
    const duration = 20 * multiplier;
    const startPos = parseFloat(player.element.style["top"])
    const startPosLeft = parseFloat(player.element.style["left"])

    function animate() {
        const currentTime = performance.now();
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const result = Math.round(increment * progress);

        if (direction === "down") {
            player.element.style["top"] = startPos + result + "px";
        } else if (direction === "up") {
            player.element.style["top"] = startPos - result + "px";
        } else if (direction === "right") {
            player.element.style["left"] = startPosLeft - result + "px"
            console.log('style move LEFT:::', startPosLeft, result, startPosLeft-result)
            player.element.style["left"] = startPosLeft - result + "px";
        } else if (direction === "left") {
            player.element.style["left"] = startPosLeft + result + "px";
        }

        // for animations
        if (direction === "up" && player.element.style.animation !== 'moveUp 0.1s steps(2) forwards') {
            player.element.style.animation = 'moveUp 0.1s steps(2) forwards';
        } else if (direction === "down" && player.element.style.animation !== 'moveDown 0.1s steps(2) forwards') {
            player.element.style.animation = 'moveDown 0.1s steps(2) forwards';
        } else if (direction === "left" && player.element.style.animation !== 'moveLeft 0.1s steps(2) forwards') {
            player.element.style.animation = 'moveLeft 0.1s steps(2) forwards';
        } else if (direction === "right" && player.element.style.animation !== 'moveRight 0.1s steps(2) forwards') {
            player.element.style.animation = 'moveRight 0.1s steps(2) forwards';
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (isPlayer) {
                moveInProgress.set(false);
            }
        }
    }

    if (isPlayer) {
        sendMessage({type: "move", id: PLAYER_ID, direction: direction, increment: increment, multiplier: multiplier})
    }
    requestAnimationFrame(animate)
}


export function processNextMove(playerId) {
    if (document.hidden) {
        //pause movements because document is on the background
        return
    }
    if (moveQueue[playerId].length > 0 && moveQueue[playerId].length < 2) {
        const nextMove = moveQueue[playerId].shift();
        move(nextMove.direction, players[playerId], nextMove.increment, false, nextMove.multiplier);
    }
    if (moveQueue[playerId].length > 1) {
        const moves = {
            "left": 0,
            "right": 0,
            "up": 0,
            "down": 0
        }
        while (moveQueue[playerId].length > 0) {
            const nextMove = moveQueue[playerId].shift();
            if (nextMove.direction === "up") {
                moves["up"] += nextMove.increment
            }
            if (nextMove.direction === "down") {
                moves["up"] += -nextMove.increment
            }
            if (nextMove.direction === "right") {
                moves["left"] += -nextMove.increment
            }
            if (nextMove.direction === "left") {
                moves["left"] += nextMove.increment
            }
        }
        if (moves.left !== 0) {
            move("left", players[playerId], moves.left, false, 0);
        }
        if (moves.up !== 0) {
            move("up", players[playerId], moves.up, false, 0);
        }
    }
}

