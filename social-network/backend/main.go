package main

import (
	"context"
	"fmt"
	"main/handlers"
	"net/http"
	"strings"
)

func main() {
	port := 8080

	http.HandleFunc("/images/", imageHandler)
	http.HandleFunc("/api/login", handlers.LoginHandler)
	http.HandleFunc("/api/comments", handlers.CommentsHandler)
	http.HandleFunc("/api/logout", handlers.LogoutHandler)
	http.HandleFunc("/api/register", handlers.RegisterHandler)
	http.HandleFunc("/api/post", handlers.PostHandler)
	http.HandleFunc("/api/getPostsByGroupId", handlers.PostsByGroupIdHandler)
	http.HandleFunc("/api/feed", handlers.FeedHandler)
	http.HandleFunc("/api/group", handlers.GroupHandler)
	http.HandleFunc("/api/groupMembers", handlers.GroupMembersHandler)
	http.HandleFunc("/api/allGroups", handlers.AllGroupsHandler)
	http.HandleFunc("/api/getGroupRelations", handlers.GetGroupRelationsByUserId)
	http.HandleFunc("/api/groupInvites", handlers.InvitesHandler)
	http.HandleFunc("/api/groupInvite", handlers.GroupInviteHandler)
	http.HandleFunc("/api/groupRequests", handlers.GroupRequestsHandler)
	http.HandleFunc("/api/eventInvite", handlers.EventInviteHandler)
	http.HandleFunc("/api/event", handlers.EventHandler)
	http.HandleFunc("/api/allEvents", handlers.AllEventsHandler)
	http.HandleFunc("/api/eventRelationships", handlers.EventRelationships)
	http.HandleFunc("/api/posts", handlers.PostsHandler)
	http.HandleFunc("/api/authedProfile", handlers.AuthedProfileHandler)
	http.HandleFunc("/api/profile", handlers.ProfileHandler)
	http.HandleFunc("/api/setProfilePrivacy", handlers.ProfilePrivacyHandler)
	http.HandleFunc("/api/relationshipRequest", handlers.FollowRequestHandler)
	http.HandleFunc("/api/relationship", handlers.FollowHandler)
	http.HandleFunc("/api/allUsers", handlers.GetAllUsersHandler)
	http.HandleFunc("/api/allConversations", handlers.GetAllConversations)
	http.HandleFunc("/api/conversations", handlers.ConversationHandler)
	http.HandleFunc("/api/messages", handlers.MessagesHandler)
	http.HandleFunc("/api/getConversationRelationship", handlers.ConversationRelationshipHandler)
	http.HandleFunc("/api/websocketAuthentication", handlers.WebsocketAuthentication)
	http.HandleFunc("/api/ws", handlers.WebsocketHandler)
	http.HandleFunc("/api/ws-auth", handlers.WebsocketAuthentication)
	http.HandleFunc("/api/searchUser", handlers.SearchUserHandler)
	http.HandleFunc("/api/notifications", handlers.NotificationsHandler)

	fmt.Println("Server running on port 8080")
	err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		fmt.Println(err)
	}
}
func SessionValidationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := handlers.GetUserFromCookie(r)
		if user == nil {
			handlers.Unauthorized(w, "")
			return
		}
		type contextKey string
		const userKey contextKey = "user"
		// Add the user to the request's context using the custom key
		ctx := context.WithValue(r.Context(), userKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func imageHandler(w http.ResponseWriter, r *http.Request) {
	// Get the requested path
	path := r.URL.Path
	fmt.Println(path)
	// Split the path using "/" as the separator
	parts := strings.Split(path, "/")
	// Ensure that the path starts with "/image/" and has at least one part after that
	if len(parts) < 3 || parts[1] != "images" {
		http.NotFound(w, r)
		return
	}
	// Get the filename from the path
	filename := parts[2]
	// Serve the file with the given filename (assuming files are in a directory named "images")
	http.ServeFile(w, r, fmt.Sprintf("images/%s", filename))
}
