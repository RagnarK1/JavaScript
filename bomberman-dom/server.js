/* eslint-disable no-undef */
const {generateMapseed} = require("./game.js");
const express = require("express");
const path = require('path');
const {disconnect} = require("process");
const WebSocket = require('ws');
const {createGame, games} = require("./game.js");

const app = express();

// Serve files from 'framework' directory
app.use("/framework", express.static(path.join(__dirname, "framework")));

// Serve files from 'src' directory
app.use("/src", express.static(path.join(__dirname, "src")));

// Catch-all route for all other requests, serves 'index.html'
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(4000, () => {
    console.log(`Listening on port 4000`);
    console.log(`http://localhost:4000`);
});


const TEST = true

const wss = new WebSocket.Server({port: 8080});
let clientId = 0; // A simple counter to assign unique IDs

let chat = []

function newPlayerJoined(ws) {
    clientId++
    return {nickname: "", id: clientId, corner: "bottomright", ws: ws, ready: false}
}

const unassignedPlayers = []


let game
wss.on('connection', function connection(ws) {
    function handleDisconnect(disconnectedWs) {
        // Find the disconnected client
        let game = games.find(game => game.players.find(player => player.ws === disconnectedWs))
        if (!game) {
            return
        }
        const disconnectedPlayer = game?.players.find(player => player.ws === disconnectedWs)
        console.log(disconnectedPlayer)
        if (disconnectedPlayer) {
            console.log("Player " + disconnectedPlayer.id + " has disconnected");
            game.corners.push(disconnectedPlayer.corner)
            // Remove the player from the players array
            game.players = game.players.filter(player => player.ws !== disconnectedWs);
            game.broadcast({type: "player_disconnected", id: disconnectedPlayer.id})
        }
    }

    const newPlayer = newPlayerJoined(ws)
    unassignedPlayers.push(newPlayer)
    //send the id back to player
    ws.send(JSON.stringify({type: "init", id: newPlayer.id}))
    ws.on("close", function () {
        handleDisconnect(ws)
    })

    ws.on('message', function incoming(message) {
        const json = JSON.parse(message)
        console.log(json)
        let game = games.find(game => game.inviteCode === json.inviteCode)
        if (json.type !== "join_game" && !game) {
            return
        }
        if (game && game.locked && json.type === "join_game_invite") {
            //game is already locked, cannot join anymore
            ws.send(JSON.stringify({type: "game_locked", inviteCode: game.inviteCode}))
            return
        }
        let player = game?.players.find(player => player.id === json.id)

        function joinGame() {
            if (!player) {
                const playerIndex = unassignedPlayers.findIndex(p => p.id === json.id);
                if (playerIndex !== -1) {
                    // Found the player, now remove from unassignedPlayers
                    player = unassignedPlayers.splice(playerIndex, 1)[0];
                }
            }
            if (!game) {
                //means game was created not joined
                game = createGame()
            }
            game.players.push(player)
            player.corner = game.corners.pop()
            player.nickname = json.nickname
            //new player has connected, but only send the broadcast, when player inputs the nickname and joins the game
            const obj = JSON.stringify({
                type: "join_success",
                corner: player.corner,
                id: player.id,
                seed: game.mapSeed,
                nickname: player.nickname,
                inviteCode: game.inviteCode
            })
            console.log(obj)
            player.ws.send(obj)
            //send new_player to rest of the clients

            game.broadcast({
                type: "new_player",
                corner: player.corner,
                id: player.id,
                nickname: player.nickname,
                seed: game.mapSeed
            }, player.id,)
            console.log("Player " + player.id + " has joined")
            //send old players to new player
            game.players.forEach(p => {
                if (p.id !== player.id) {
                    player.ws.send(JSON.stringify({
                        nickname: p.nickname,
                        type: "new_player",
                        corner: p.corner,
                        id: p.id,
                        seed: game.mapSeed
                    }))
                }
            })
            games.push(game)
        }

        switch (json.type) {
            case "game_locked":
                game.locked = true
                break
            case "bomb":
                game.broadcast(json, json.clientId)
                break;
            case "move":
            case "life_count":
            case "powerup_capture":
            case "powerup_created":
                game.broadcast(json, json.id)
                break
            case "player_ready":
                game.setPlayerReady(json.id)
                break
            case "player_killed":
                game.broadcast(json, json.id);
                game.broadcast({
                    type: "chat_message",
                    id: "Server",
                    nickname: "Server",
                    message: `${json.id} has been killed`
                })
                break;
            case "chat_message":
                chat.push({sender: json.id, message: json.message, nickname: player.nickname});
                game.broadcast({...json, nickname: player.nickname}, json.id);
                break;
            case "player_hit":
                //find the target player
                const result = game.players.find(player => player.id === json.targetId)
                if (result) {
                    result.ws.send(JSON.stringify(json))
                }
                break
            case "sync":
                game.broadcast(json, json.id)
                break
            case "join_game_invite":
                if (!game) {
                    ws.send(JSON.stringify({
                        type: "join_failed",
                        message: "No such game found",
                        inviteCode: json.inviteCode
                    }))
                } else {
                    joinGame()
                }
                break
            case "join_game":
                joinGame()
                //get the nickname and game invite
                break
            default:
                // Handle any other cases or do nothing
                game.broadcast(json, json.id)
                break;
        }
    });
});

