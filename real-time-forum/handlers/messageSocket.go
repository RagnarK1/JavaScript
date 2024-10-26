package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"real-time-forum/database"

	"github.com/gorilla/websocket"
)

var messageClients = make(map[*websocket.Conn]bool)

func PrivateMessageWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error during connection upgradation:", err)
		return
	}
	defer conn.Close()

	messageClients[conn] = true

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			delete(messageClients, conn)
			break
		}

		var receivedMessage database.PrivateMessage
		if err := json.Unmarshal(msgBytes, &receivedMessage); err != nil {
			fmt.Println("Error parsing received message:", err)
			continue
		}

		err = savePrivateMessageToDatabase(receivedMessage)
		if err != nil {
			fmt.Println("Error saving private message:", err)
		}

		broadcastPrivateMessage(msgBytes)
	}
}

func savePrivateMessageToDatabase(message database.PrivateMessage) error {
	err := database.InsertPrivateMessage(message.Sender, message.Receiver, message.Content, message.Timestamp)
	if err != nil {
		return err
	}

	return nil
}

func broadcastPrivateMessage(message []byte) {
	for client := range messageClients {
		if err := client.WriteMessage(websocket.TextMessage, message); err != nil {
			fmt.Println("Error sending message to client:", err)
			delete(messageClients, client)
		}
	}
}
