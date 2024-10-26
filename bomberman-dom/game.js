let games = []

function startGame(startPlayer) {
    const game = createGame(startPlayer)
}

//Create a new game
function createGame() {
    return {
        mapSeed: generateMapseed(),
        players: [],
        corners: ["topleft", "topright", "bottomleft", "bottomright"],
        powerups: [],
        locked: false,
        inviteCode: generateRandomString(6),
        broadcast: function (message, id = undefined) {
            //broadcast to all the members of game, except for id, if specified
            message = JSON.stringify(message)
            this.players.forEach(p => {
                if (id) {
                    if (p.ws.OPEN && (p.id !== id)) {
                        p.ws.send(message)
                    }
                } else {
                    if (p.ws.OPEN) {
                        p.ws.send(message)
                    }
                }
            })
        },
        setPlayerReady: function (playerId) {
            //not needed?
            const existing = this.players.find(player => player.id === playerId)
            if (existing) {
                existing.ready = true
                //send the status to everyone else
                this.broadcast({
                    type: "player_ready",
                    count: this.players.filter(player => player.ready).length
                }, playerId)
            }
            if (this.players.filter(player => player.ready).length === this.players.length) {
                //start the final countdown
                this.broadcast({type: "start_countdown"})
                //countdown of 20 seconds
                setTimeout(() => this.broadcast({type: "countdown_done"}), 20000)
            }
        }
    }
}


function generateMapseed() {
    const seed = []
    for (let index = 0; index < 50; index++) {
        const ran = Math.floor(Math.random() * 6)
        seed.push(ran)
    }
    return seed
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

//joins an existing game by invite code
function joinExistingGame(player, inviteCode) {
    //find the existing game
    const result = games.find(game => game.inviteCode === inviteCode)
    if (result) {
        if (result.players.length < 4) {
            //send success back and join the lobby
            player.ws.send(JSON.stringify({type: "joinSuccess", id: player.id}))
        } else {
            //game is already full
            player.ws.send(JSON.stringify({type: "joinError", message: "Game is already full", id: player.id}))
        }
    } else {
        player.ws.send(JSON.stringify({type: "joinError", message: "No such game exists", id: player.id}))
    }
}

module.exports = {generateMapseed, createGame, games}
