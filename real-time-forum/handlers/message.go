package handlers

import (
	"encoding/json"
	"net/http"
	"real-time-forum/database"
	"strconv"
)

type Notification struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

func MessageHandler(w http.ResponseWriter, r *http.Request) {
	sessionToken := r.Header.Get("Authorization")

	if sessionToken == "" {
		http.Error(w, "Authorization header missing", http.StatusBadRequest)
		return
	}

	loggedInUserID, err := database.GetUserIdBySessionToken(sessionToken)
	if err != nil {
		http.Error(w, "Invalid session token", http.StatusUnauthorized)
		return
	}

	receiverIDStr := r.URL.Query().Get("receiverId")

	receiverID, err := strconv.Atoi(receiverIDStr)
	if err != nil {
		http.Error(w, "Invalid receiver ID", http.StatusBadRequest)
		return
	}

	messages, err := database.GetMessagesForUser(receiverID, loggedInUserID)
	if err != nil {
		http.Error(w, "Failed to fetch private messages", http.StatusInternalServerError)
		return
	}

	// Convert messages from []database.PrivateMessageDisplay to []database.PrivateMessage
	convertedMessages := make([]database.PrivateMessage, len(messages))
	for i, msg := range messages {
		convertedMessages[i] = database.PrivateMessage{
			ID:        msg.ID,
			Sender:    msg.Sender,
			Receiver:  msg.Receiver,
			Content:   msg.Content,
			Timestamp: msg.Timestamp,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(messages); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
		return
	}
}
