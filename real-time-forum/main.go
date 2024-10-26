package main

import (
	"fmt"
	"log"
	"net/http"
	"real-time-forum/database"
	"real-time-forum/handlers"

	_ "github.com/mattn/go-sqlite3"
)

func main() {

	database.InitDB()

	http.HandleFunc("/api/register", handlers.RegisterHandler)
	http.HandleFunc("/api/login", handlers.LoginHandler)
	http.HandleFunc("/api/logout", handlers.LogoutHandler)
	http.HandleFunc("/api/posts", handlers.PostHandler)
	http.HandleFunc("/api/loggedInUser", handlers.GetLoggedInUserHandler)
	http.HandleFunc("/api/createPost", handlers.CreatePostHandler)
	http.HandleFunc("/api/createComment", handlers.CreateCommentHandler)
	http.HandleFunc("/api/postWithComments", handlers.PostViewHandler)
	http.HandleFunc("/api/getMessages", handlers.MessageHandler)
	//WEBSOCKETS
	http.HandleFunc("/api/getUsers", handlers.UsersWebsocketHandler)
	http.HandleFunc("/api/privateMessages", handlers.PrivateMessageWebsocketHandler)

	http.Handle("/", http.FileServer(http.Dir("static")))

	fmt.Printf("Open http://localhost:8080\nUse Ctrl+C to close the server\n")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
