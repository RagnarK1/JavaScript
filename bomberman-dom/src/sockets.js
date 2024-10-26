import {
    children,
    GAME_ID,
    gamestate,
    moveQueue,
    PLAYER_ID,
    players,
    setGameId,
    setPlayerId,
    start
} from "./bomberman.js";
import {newMessage} from "./chat.js";
import {processNextMove, createBomb, newPlayer, processQueue, removePlayer, Player} from "./mechanics.js";
import {createPowerup, removePowerup} from "./powerups.js";
import {navigationState, setError} from "./gameplay.js";


const socket = new WebSocket('ws://localhost:8080');

socket.onopen = function (event) {
    console.log("Connected to the WebSocket server");
};
socket.onmessage = function (event) {
    const json = JSON.parse(event.data)
    switch (json.type) {
        case "init":
            setPlayerId(json.id)
            break
        case "game_locked":
            //game has been locked, display error message
            setError("Game is no longer available")
            break
        case "join_failed":
            break
        case "join_success":
            //player joined successfully, now add it to the players
            players[json.id] = {
                corner: json.corner,
                id: json.id,
                nickname: json.nickname
            }
            setGameId(json.inviteCode)
            gamestate.seed.set(json.seed)
            //setting current player id to global variable for easy access
            navigationState.set("lobby")
            break
        case "move":
            const {direction, id, increment, multiplier} = json;
            moveQueue[id] = moveQueue[id] || [];
            moveQueue[id].push({direction, increment, multiplier});
            if (document.hidden) {
                // processQueue.push(() => processNextMove(id));
            } else {
                processNextMove(id);
            }
            break;

        case "life_count":
            // update live count based on client id
            break;

        case "start":
            //start(json);
            break;

        case "new_player":
            newPlayer(json);
            break;

        case "bomb":
            createBomb(json);
            break;

        case "chat_message":
            newMessage(json);
            break;

        case "player_disconnected":
            removePlayer(json.id);
            if (Object.keys(players).length === 1) {
                const winner = document.createElement("h1")
                winner.textContent = "WINNER"
                winner.id = "winnertag"
                document.querySelector("#app").appendChild(winner)
            }
            break;

        case "powerup_capture":
            removePowerup(json.powerupId);
            break;

        case "powerup_created":
            const targetCell = document.querySelector(`[data-row='${json.x}'][data-col='${json.y}']`);
            const powerup = createPowerup(undefined, undefined, json.powerupId, false, json.powerup);
            targetCell.appendChild(powerup.element);
            break;

        case "player_killed":
            removePlayer(json.id);
            if (Object.keys(players).length === 1) {
                const winner = document.createElement("h1")
                winner.id = "winnertag"
                winner.textContent = "WINNER"
                document.querySelector("#app").appendChild(winner)
            }
            break;
        case "player_hit":
            // when another player hits you
            //remove 1 life
            gamestate.countHit()
            break;
        case "player_ready":
            // update the ready players count
            break;
        case "sync":
            //sync the player correctly
            const player = players[json.id]
            if (player) {
                console.log("Setting ", json)
                player.element.style.top = json.top
                player.element.style.left = json.left
            }
            break
        default:
            // Optional: code to run if none of the above cases are matched
            break;
    }
    console.log("Message from server:", event.data);
    // Handle game state updates here
};

//message object
export function sendMessage(message) {
    if (!message.inviteCode) {
        message.inviteCode = GAME_ID
    }
    socket.send(JSON.stringify(message))
}
