package handlers

import (
	"encoding/json"
	"net/http"
	"real-time-forum/database"
)

func GetLoggedInUserHandler(w http.ResponseWriter, r *http.Request) {
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

	loggedInUser, err := database.GetUserByID(userId)
	if err != nil {
		http.Error(w, "Failed to fetch user details", http.StatusInternalServerError)
		return
	}

	if loggedInUser == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	response := struct {
		Nickname string `json:"nickname"`
		ID       int    `json:"id"`
	}{
		Nickname: loggedInUser.Nickname,
		ID:       loggedInUser.ID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
