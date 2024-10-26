import {sendMessage} from "./sockets.js";
import {gamestate, PLAYER_ID} from "./bomberman.js";
import {div} from "../framework/elements.js";

export function capturePowerup(element) {
    //check if cell includes a powerup as child
    const powerup = element.querySelector(".powerup")
    if (powerup) {
        const powerUpType = powerup.getAttribute("data-powerup")
        powerup.remove() //Removes the powerup after being captured
        sendMessage({type: "powerup_capture", id: PLAYER_ID, powerup_type: powerUpType, powerupId: powerup.id})
        switch (powerUpType) {
            case "flames":
                //increase the bomb range
                gamestate.bombrangeBoost = gamestate.bombrangeBoost + 1
                break
            case "bombs":
                //increases allowed max bombs
                gamestate.allowedBombs = gamestate.allowedBombs + 1
                break
            case "speed":
                //increases the speed
                gamestate.speedMultiplier = Math.max(gamestate.speedMultiplier - 0.1, 0)//nerfed the speed. was 0.5
                break
        }
    }
}

export function removePowerup(id) {
    const powerup = document.querySelector(`.powerup[id='${id}']`)
    if (powerup) {
        powerup.remove()
    }
}

export function createPowerup(x = 0, y = 0, id = undefined, random = true, type = "None") {
    //Check whether cell is
    if (random) {
        if (randomChance()) {
            //now create the bomb
            const randomInt = Math.floor(Math.random() * 3); // 3 because it's exclusive
            const powerups = ["bombs", "flames", "speed"]
            let type = powerups[randomInt]
            let powerupId = Math.floor(Math.random() * 1000)
            sendMessage({id: PLAYER_ID, type: "powerup_created", x: x, y: y, powerup: type, powerupId: powerupId})
            return Powerup(powerupId, type)
        }
    } else {
        return Powerup(id, type)
    }
}

function randomChance() {
    // Generate a random number between 0 and 1
    const randomNumber = Math.random();

    // Return true if the number is less than 0.1, which has a 10% chance of happening
    return randomNumber < 0.5;
}

function Powerup(id = undefined, type = "None") {
    //Choose a new powerup randomly
    const randomInt = Math.floor(Math.random() * 3); // 3 because it's exclusive
    const powerups = ["bombs", "flames", "speed"]
    if (type === "None") {
        type = powerups[randomInt]
    }
    // Create a random powerup id to identify them
    if (!id) {
        id = `${Math.floor(Math.random() * 1000)}`
    }
    //powerups.push(powerUpElement)
    //send the powerup to the server
    return div({id: id, class: `powerup ${type}`, "data-powerup": type})
}
