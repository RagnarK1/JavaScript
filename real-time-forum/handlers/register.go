package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"real-time-forum/database"

	"golang.org/x/crypto/bcrypt"
)

type RegistrationRequest struct {
	Nickname  string `json:"nickname"`
	Age       string `json:"age"`
	Gender    string `json:"gender"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("RegisterHandler called")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request RegistrationRequest
	err := decodeJSONBody(r, &request)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err) // Debug
		return
	}
	if request.Nickname == "" || request.Age == "" || request.Gender == "" ||
		request.FirstName == "" || request.LastName == "" || request.Email == "" || request.Password == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}
	exists, err := database.CheckEmailOrNicknameExists(request.Email, request.Nickname)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		fmt.Println("Error checking email/nickname:", err) // Debug
		return
	}
	if exists {
		http.Error(w, "Email or nickname is already taken", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		fmt.Println("Error generating hashed password:", err) // Debug
		return
	}

	err = database.InsertUser(request.Nickname, request.Age, request.Gender, request.FirstName, request.LastName, request.Email, hashedPassword)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		fmt.Println("Error inserting user:", err) // Debug
		return
	}

	broadcastUpdatedUsers()

	response := map[string]string{"message": "Registration successful"}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func decodeJSONBody(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		return err
	}
	return nil
}
