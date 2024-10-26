package handlers

import (
	"encoding/json"
	"net/http"
	"real-time-forum/database"
	"strconv"
)

func PostHandler(w http.ResponseWriter, r *http.Request) {
	posts, err := database.GetForumPosts()
	if err != nil {
		http.Error(w, "Failed to fetch forum posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(posts); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
		return
	}
}

func PostViewHandler(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.URL.Query().Get("postId")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	post, err := database.GetPostById(postID)
	if err != nil {
		http.Error(w, "Failed to fetch the post", http.StatusInternalServerError)
		return
	}

	comments, err := database.GetCommentsByPostId(postID)
	if err != nil {
		http.Error(w, "Failed to fetch comments for post", http.StatusInternalServerError)
		return
	}

	postWithComments := map[string]interface{}{
		"post":     post,
		"comments": comments,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(postWithComments); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
		return
	}
}
