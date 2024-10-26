package handlers

import (
	"fmt"
	"main/database"
	"net/http"
	"strconv"
)

func CommentsHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	if r.Method == "GET" {
		params := r.URL.Query()
		postId, err := strconv.Atoi(params.Get("id"))
		if err != nil {
			BadRequest(w, err.Error())
			return
		}
		comments, err := database.GetAllCommentsByPostId(postId)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		Success(w, comments)
	} else if r.Method == "POST" {
		var comment database.Comment
		err := decodeCommentBody(r, &comment)
		if err != nil {
			fmt.Print(err.Error())
			ServerError(w, err.Error())
			return
		}
		comment.CreatorId = user.Id
		comment.Firstname = user.Firstname
		comment.Lastname = user.Lastname
		id, err := database.CreateComment(comment)
		if err != nil {
			fmt.Println(err.Error())
			ServerError(w, err.Error())
			return
		}
		Success(w, id)
	}
}
