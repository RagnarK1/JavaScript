package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"real-time-forum/database"
	"real-time-forum/structs"
)

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
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

	var postDto = structs.PostDto{UserID: userId}

	err = json.NewDecoder(r.Body).Decode(&postDto)
	fmt.Println(postDto)
	if err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	err = database.InsertPost(postDto)
	if err != nil {
		http.Error(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
