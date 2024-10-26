package handlers

import (
	"net/http"
	"real-time-forum/database"
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	authorizationHeader := r.Header.Get("Authorization")
	err := database.DeleteSessionToken(authorizationHeader)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	broadcastUpdatedUsers()
}
