package handlers

import (
	"fmt"
	"main/database"
	"net/http"
	"strconv"
	"time"
)

func PostsByGroupIdHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	params := r.URL.Query()
	groupId, err := strconv.Atoi(params.Get("groupId"))
	if err != nil {
		fmt.Println(err.Error())
		return
	}
	posts, err := database.GetPostsCustomQuery("SELECT P.*, U.firstname, U.lastname FROM posts as P LEFT JOIN users as U ON P.creator_id = U.id WHERE P.group_id = ?", groupId)
	if err != nil {
		ServerError(w, err.Error())
		return
	}
	Success(w, posts)
}

// PostsHandler Gets all the posts
func PostsHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	posts, err := database.GetAllPosts()
	if err != nil {
		ServerError(w, err.Error())
		return
	}
	Success(w, posts)
}

// PostHandler Handles POST & GET for posts
func PostHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	if r.Method == "GET" {
		queryParams := r.URL.Query()
		postId, err := strconv.Atoi(queryParams.Get("id"))
		if err != nil {
			BadRequest(w, err.Error())
			return
		}
		post, err := database.GetPostByID(postId)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		//if owner, definitely show it
		if post.CreatorId == user.Id {
			Success(w, post)
			return
		}
		//now check privacy level
		if post.Privacy == 1 {
			Success(w, post)
		} else if post.Privacy == 2 {
			//get the list of allowed viewers
			metadata, err := database.GetPostMetadata(postId)
			if err != nil {
				ServerError(w, err.Error())
				return
			}
			//checks if current user is included in the list of viewers
			for viewer := range metadata.AllowedViewers {
				if user.Id == viewer {
					Success(w, post)
					return
				}
			}
			NotFound(w, "Not allowed to view it")
		} else {
			//check if owner is the creator of the post
			if user.Id == post.CreatorId {
				Success(w, post)
				return
			}
			NotFound(w, "Post not found")
		}
	} else if r.Method == "POST" {
		var post database.Post
		err := decodePostBody(r, &post)
		if err != nil {
			fmt.Println(err.Error())
			ServerError(w, err.Error())
			return
		}
		fmt.Println("Post: ", post)
		post.CreatorId = user.Id
		post.Firstname = user.Firstname
		post.Lastname = user.Lastname
		post.Timestamp = int(time.Now().Unix())
		postId, err := database.CreatePost(post)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		if post.Privacy == 2 {
			//insert allowed viewer users to database
			//convert to json string first
			fmt.Println(post.AllowedViewers)
			err = database.CreatePostMetadata(int(postId), post.AllowedViewers)
			if err != nil {
				ServerError(w, err.Error())
				return
			}
		}
		Success(w, postId)
	} else {
		BadRequest(w, "Wrong method")
	}
}
