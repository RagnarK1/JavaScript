package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"main/database"
	"net/http"
	"sync"
	"time"

	"github.com/gofrs/uuid"
	"github.com/gorilla/websocket"
)

type Event struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"` //json object in string
	//
}
type Client struct {
	Conn   *websocket.Conn
	UserId int `json:"userId"`
}

type newMessageData struct {
	Sender         int    `json:"authorId,omitempty"`
	Timestamp      int    `json:"timestamp,omitempty"`
	ConversationId int    `json:"conversationId"`
	Content        string `json:"content"`
	Receivers      []int  `json:"receivers"`
	Firstname      string `json:"firstname,omitempty"`
	Lastname       string `json:"lastname,omitempty"`
}

//this will be sent back to the original client, to send feedback

type responseEvent struct {
}

var clients = make(map[int]*Client)
var clientsMutex sync.Mutex

// WebsocketAuthentication Authentication request to validate websocket connection
func WebsocketAuthentication(w http.ResponseWriter, r *http.Request) {
	authedAccount := GetUserFromCookie(r)
	if authedAccount == nil {
		Unauthorized(w, "Unauthorized")
		return
	}
	session := GenerateWebsocketSession(*authedAccount)
	var responseDict = make(map[string]interface{})
	responseDict["sessionId"] = session
	//bytes, _ := json.Marshal(responseDict)
	Success(w, session)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections by not checking the origin
		return true
	},
}

func WebsocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	// Handle authentication and associate the token with the connection
	token := r.URL.Query().Get("token")
	if token == "" {
		err := conn.Close()
		if err != nil {
			return
		}
		return
	}
	user := ValidateWebsocketSession(token)
	if user != nil {
		clientsMutex.Lock()
		var c = &Client{}
		c.Conn = conn
		c.UserId = user.Id
		clients[user.Id] = c
		clientsMutex.Unlock()
		notifyUserStatusChange(user.Nickname, true)
	} else {
		return
	}
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Websocket error: " + err.Error())
			break
		}
		processMessage(user.Nickname, msg)
	}
	// Clean up the connection on disconnection
	clientsMutex.Lock()
	delete(clients, user.Id)
	clientsMutex.Unlock()

	// Notify other clients about the user's offline status
	notifyUserStatusChange(user.Nickname, false)

	err = conn.Close()
	if err != nil {
		return
	}

}

func SendNotification(targetId int) {
	connection := clients[targetId]
	if connection == nil {
		return
	}
	err := emitEvent(connection.Conn, "notification", nil)
	if err != nil {
		return
	}
}

func emitEvent(c *websocket.Conn, eventType string, data interface{}) error {
	event := Event{
		Type: eventType,
		Data: data,
	}
	eventData, err := json.Marshal(event)
	if err != nil {
		fmt.Println(err.Error())
		return err
	}
	return c.WriteMessage(websocket.TextMessage, eventData)
}

func processMessage(sender string, msg []byte) {
	var event Event
	err := json.Unmarshal(msg, &event)
	if err != nil {
		fmt.Println(err)
		return
	}

	if event.Type == "new_message" {
		bytes, err := json.Marshal(event.Data)
		if err != nil {
			fmt.Println("Invalid body was received")
			fmt.Println(err.Error())
		}
		var conv newMessageData
		err = json.Unmarshal(bytes, &conv)
		if err != nil {
			fmt.Println(err.Error())
			return
		}
		var message database.Message
		message.AuthorId = conv.Sender
		message.ConversationId = conv.ConversationId
		message.Content = conv.Content
		message.Timestamp = int(time.Now().Unix())
		message.Firstname = conv.Firstname
		message.Lastname = conv.Lastname
		messageId, err := database.CreateMessage(message)
		message.Id = int(messageId)
		for _, receiverUser := range conv.Receivers {
			receiverClient := clients[receiverUser]
			if receiverClient == nil {
				//means not online
				fmt.Println("not online: ", receiverUser)
				continue
			}
			if receiverUser == conv.Sender {
				fmt.Println("ignoring: ", receiverUser)
				continue
			}
			err = emitEvent(receiverClient.Conn, "new_message", message)
			if err != nil {
				fmt.Println(err)
			}
		}
		senderClient := clients[conv.Sender]
		if err != nil {
			fmt.Println(err.Error())
		}
		var responseData = make(map[string]any)
		responseData["status"] = "success"
		responseData["conversationId"] = conv.ConversationId
		err = emitEvent(senderClient.Conn, "response_message", responseData)
		if err != nil {
			fmt.Println(err)
		}
	}
}

func notifyUserStatusChange(username string, isOnline bool) {
	// Create a status update message
	/*

		message := database.SocketMessage{Type: "status_update", Message: database.Message{Sender: "", Receiver: "", Text: ""}}
		// Broadcast the status update to all connected clients
		clientsMutex.Lock()
		for _, conn := range clients {
			msg, err := json.Marshal(message)
			if err != nil {
				log.Println("Error encoding message:", err)
				continue
			}
			err = conn.Conn.WriteMessage(websocket.TextMessage, msg)
			if err != nil {
				log.Println("Error sending message:", err)
			}
		}
		clientsMutex.Unlock()
	*/
}
func ValidateWebsocketSession(sessionString string) *database.User {
	session, err := database.GetWebsocketSession(sessionString)
	if err != nil {
		fmt.Println(err.Error())
		return nil
	}
	if session == nil {
		return nil
	}
	//check if expired
	tokenTime := time.Unix(int64(session.ExpiryTimestamp), 0)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	currentTime := time.Now()
	if currentTime.After(tokenTime) {
		return nil
	}
	account, err := database.GetUserByID(session.UserId)
	return account

}

// GenerateWebsocketSession Generate session for websocket connection
func GenerateWebsocketSession(account database.User) string {
	sessionId, _ := uuid.NewV4()
	expiry := time.Now().Add(96 * time.Hour)
	//formattedExpiry := expiry.Format("2006-01-02 15:04:05")
	expiryInt := expiry.Unix()
	var session database.Session
	session.UserId = account.Id
	session.ExpiryTimestamp = int(expiryInt)
	session.SessionId = sessionId.String()
	_, err := database.CreateWebsocketSession(session)
	if err != nil {
		fmt.Println(err)
		return ""
	}
	return sessionId.String()
}
