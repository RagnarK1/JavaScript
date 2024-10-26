package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"real-time-forum/database"

	"golang.org/x/crypto/bcrypt"
)

type LoginResponse struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	Nickname  string `json:"nickname,omitempty"`
	SessionID string `json:"session_id,omitempty"`
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("LoginHandler called")

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse JSON data from the request body
	var requestData struct {
		LoginEmail    string `json:"loginEmail"`
		LoginPassword string `json:"loginPassword"`
	}
	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	loginEmail := requestData.LoginEmail
	loginPassword := requestData.LoginPassword
	fmt.Println("Login email:", loginEmail)
	fmt.Println("Login password:", loginPassword)

	user, err := database.GetUserByEmail(loginEmail)
	if err != nil {
		http.Error(w, "Can't get email from server error", http.StatusInternalServerError)
		return
	}

	if user == nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginPassword))
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	err = database.DeleteUserFromSessions(user.ID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	session := createSession(user.ID)
	err = database.InsertSessionToken(user.ID, session.Token, session.ExpiresAt)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	fmt.Println("User logged in:", user.Email)

	response := LoginResponse{
		Success:   true,
		Message:   "Login successful",
		Nickname:  user.Nickname,
		SessionID: session.Token,
	}

	broadcastUpdatedUsers()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
