package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"real-time-forum/database"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var userClients = make(map[*websocket.Conn]bool)

func UsersWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error during connection upgradation:", err)
		return
	}
	defer conn.Close()

	userClients[conn] = true

	broadcastUpdatedUsers()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			delete(userClients, conn)
			break
		}
	}
}

func broadcastUpdatedUsers() {
	users, _ := database.GetAllUsersAndOnlineStatuses()

	data, err := json.Marshal(users)
	if err != nil {
		fmt.Println("Error encoding user table:", err)
		return
	}

	for client := range userClients {
		if err := client.WriteMessage(websocket.TextMessage, data); err != nil {
			fmt.Println("Error sending message to client:", err)
			delete(userClients, client)
		}
	}
}
