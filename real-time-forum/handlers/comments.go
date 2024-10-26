package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"real-time-forum/database"
	"real-time-forum/structs"
)

func CreateCommentHandler(w http.ResponseWriter, r *http.Request) {
	sessionToken := r.Header.Get("Authorization")

	if sessionToken == "" {
		http.Error(w, "Authorization header missing", http.StatusBadRequest)
		return
	}

	userId, err := database.GetUserIdBySessionToken(sessionToken)
	if err != nil {
		http.Error(w, "Invalid session token", http.StatusUnauthorized)
		return
	}

	var commentDto = structs.CommentDto{UserID: userId}

	err = json.NewDecoder(r.Body).Decode(&commentDto)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	err = database.InsertComment(commentDto)
	if err != nil {
		http.Error(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
