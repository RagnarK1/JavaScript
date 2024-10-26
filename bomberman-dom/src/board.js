import {div} from "../framework/elements.js";
import {children, col, gamestate, positionX, positionY, row} from "./bomberman.js"

export function generateBoard() {
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            if (row === 0 || row === 14 || col === 0 || col === 14) {
                children.get().push(Block(row, col, "wall"))
                continue
            }
            if (row % 2 === 0) {
                if (col % 2 === 0) {
                    children.get().push(Block(row, col, "wall"))
                    continue
                }
            }
            if ((row === 1 && col === 1) || (row === 1 && col === 2) || (row === 2 && col === 1) ||
                (row === 13 && col === 1) || (row === 13 && col === 2) || (row === 12 && col === 1) ||
                (row === 13 && col === 12) || (row === 13 && col === 13) || (row === 12 && col === 13) ||
                (row === 1 && col === 12) || (row === 1 && col === 13) || (row === 2 && col === 13)
            ) {
                children.get().push(Block(row, col))
                continue
            }
            //now fill the blocks
            //based on random number blocks are filled
            if (gamestate.seed.get().pop() === 1) {
                children.get().push(Block(row, col))
                continue
            }
            children.get().push(Block(row, col, "block"))
        }
    }
}


export function Board() {
    const board = div({class: "board", id: "game-board"}, () => {
        return [...children.get()]
    })
    children.subscribe(board)
    return board
}


function Block(row, col, type) {
    return div({class: `cell ${type}`.trim(), "data-row": row, "data-col": col})
}


export function createPosition(corner, set = false) {
    switch (corner) {
        case "topright": {
            if (set) {
                positionX.set(40 + (12 * 40))
                col.set(13)
                return `top: ${positionY.get()}px; left: ${positionX.get()}px`
            } else {
                return `left: ${40 + 12 * 40}px; top: 40px`
            }
        }
        case "topleft": {
            if (set) {
                return `top: ${positionY.get()}px; left: ${positionX.get()}px`
            }
            return `top: ${40}px; left: 40px`
        }
        case "bottomleft": {
            if (set) {
                positionY.set(40 + (12 * 40))
                row.set(13)
                return `top: ${positionY.get()}px; left: ${positionX.get()}px`
            }
            return `top: ${40 + 12 * 40}px; left: ${40}px`
        }
        case "bottomright": {
            if (set) {
                col.set(13)
                row.set(13)
                positionX.set(40 + (12 * 40))
                positionY.set(40 + (12 * 40))
                return `top: ${positionY.get()}px; left: ${positionX.get()}px`
            }
            return `top: ${40 + 12 * 40}px; left: ${40 + 12 * 40}px`
        }
    }
}
