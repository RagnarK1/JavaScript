package handlers

import (
	"encoding/json"
	"fmt"
	"main/database"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// Target id will be the user id, if user is already following we just unfollow
type Request struct {
	TargetId int `json:"targetId"`
}
type FollowRequest struct {
	TargetId int  `json:"targetId"`
	Accept   bool `json:"accept"`
}

func FollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "Not logged in")
		return
	}
	if r.Method == "POST" {
		var request FollowRequest
		if err := decodeBody(r, &request); err != nil {
			BadRequest(w, "Failed to decode request body: "+err.Error())
			return
		}
		if request.Accept {
			//request has been accepted
			err := database.UpdateRelationship(1, request.TargetId, user.Id)
			if err != nil {
				fmt.Println("Followrequest", err.Error())
				ServerError(w, err.Error())
				return
			}
			Success(w, nil)
			return
		}
		//did not accept now delete the relationship
		err := database.DeleteRelationship(request.TargetId, user.Id)
		if err != nil {
			fmt.Println(err.Error())
			ServerError(w, err.Error())
			return
		}
		Success(w, nil)

	} else if r.Method == "GET" {
		//Send all requests for the logged in user
		fmt.Println("userid", user.Id)
		requests, err := database.GetRelationshipRequestsByFollowingId(user.Id)
		if err != nil {
			fmt.Println("Getting follow requests: ", err.Error())
			ServerError(w, err.Error())
			return
		}
		Success(w, requests)
	}

}

// FollowHandler handles the following action and gets the follower/following lists for a specific userId.
func FollowHandler(w http.ResponseWriter, r *http.Request) {
	//we get the origin user from authenticated cookie, targetId is inside request
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "Not logged in")
		return
	}
	switch r.Method {
	case http.MethodPost:
		// Handling follow request
		var request Request
		if err := decodeBody(r, &request); err != nil {
			BadRequest(w, "Failed to decode request body: "+err.Error())
			return
		}
		fmt.Printf("FollowerID: %d\n", request.TargetId)

		// Check if the relationship already exists
		existingRelationship, err := database.GetRelationshipByFollowerAndFollowingID(user.Id, request.TargetId)
		if err != nil {
			ServerError(w, "Error checking existing relationship: "+err.Error())
			return
		}

		if existingRelationship != nil {
			//now we delete it, because user is already following. can do both follow/unfollow with one request
			err := database.DeleteRelationship(user.Id, request.TargetId)
			if err != nil {
				ServerError(w, err.Error())
				return
			}
			err = CreateNotification(request.TargetId, "/profile/"+strconv.Itoa(request.TargetId), "You lost a follower!")
			Success(w, nil)
			//BadRequest(w, "Relationship already exists")
			return
		}
		var relation database.Relationship
		relation.FollowingId = request.TargetId
		relation.FollowerId = user.Id
		relation.Timestamp = int(time.Now().Unix())
		//Now lets check whether target profile is public or not
		targetProfile, _ := database.GetUserByID(request.TargetId)
		if targetProfile.IsPrivate == 0 {
			relation.Accepted = 1
		} else {
			relation.Accepted = 0 //setting to pending, targetid now has to accept it
		}
		// Continue with creating the new relationship
		_, err = database.CreateRelationship(relation)
		if err != nil {
			ServerError(w, "Error creating relationship: "+err.Error())
			return
		}
		if targetProfile.IsPrivate == 0 {
			err = CreateNotification(request.TargetId, "/profile/"+strconv.Itoa(request.TargetId), "You have a new follower!")
		} else {
			err = CreateNotification(request.TargetId, "/profile/"+strconv.Itoa(request.TargetId), "You have a new follow request!")
		}
		// Create a notification for the user being followed
		if err != nil {
			fmt.Println("Error creating notification:", err)
		}

		Success(w, nil)

	case http.MethodDelete:
		// Handling unfollow request
		var request database.Relationship
		if err := decodeBody(r, &request); err != nil {
			BadRequest(w, "Failed to decode request body: "+err.Error())
			return
		}
		fmt.Printf("FollowerID: %d, FollowingID: %d\n", request.FollowerId, request.FollowingId)

		// Check if the relationship exists
		existingRelationship, err := database.GetRelationshipByFollowerAndFollowingID(request.FollowerId, request.FollowingId)
		if err != nil {
			ServerError(w, "Error checking existing relationship: "+err.Error())
			return
		}

		if existingRelationship == nil {
			BadRequest(w, "Relationship doesn't exist")
			return
		}

		// Delete the relationship from the database
		err = database.DeleteRelationship(request.FollowerId, request.FollowingId)
		if err != nil {
			ServerError(w, "Error deleting relationship: "+err.Error())
			return
		}

		Success(w, nil)

	case http.MethodGet:
		// Handling followers or followings lists
		queryParams := r.URL.Query()
		action := queryParams.Get("action") // followers or followings
		targetUserId := queryParams.Get("targetId")
		convertedTargetId, err := strconv.Atoi(targetUserId)
		if err != nil {
			BadRequest(w, "Invalid target id: "+err.Error())
			return
		}

		switch action {
		case "followers":
			followers, err := database.GetRelationshipsByFollowingID(convertedTargetId)
			fmt.Println("id: ", convertedTargetId)
			if err != nil {
				ServerError(w, "Failed to retrieve followers: "+err.Error())
				return
			}
			Success(w, followers)

		case "followings":
			followings, err := database.GetRelationshipsByFollowerID(convertedTargetId)
			if err != nil {
				ServerError(w, "Failed to retrieve followings: "+err.Error())
				return
			}
			Success(w, followings)

		default:
			http.Error(w, "Invalid action name", http.StatusBadRequest)
		}

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func decodeBodyFollow(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

func SearchUserHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	if r.Method == "GET" {
		queryParams := r.URL.Query()
		searchTerm := queryParams.Get("search")
		nameParts := strings.Fields(searchTerm)
		searchUsers, err := database.SearchUser(nameParts, user.Id)
		if err != nil {
			fmt.Println(err)
			ServerError(w, err.Error())
			return
		}
		Success(w, searchUsers)
	}
}

// FeedHandler Gets a feed of posts based on the authenticated user
func FeedHandler(w http.ResponseWriter, r *http.Request) {
	//TODO: Find a better way in filtering the posts, needs to be fixed amount
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "Not logged in")
		return
	}
	if r.Method == "GET" {
		//get the page number
		maxPerPage := 20
		queryParams := r.URL.Query()
		pageNum, err := strconv.Atoi(queryParams.Get("pageNum"))
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		offset := maxPerPage * (pageNum - 1)
		posts, err := database.GetPostsCustomQuery("SELECT P.*, U.firstname, U.lastname FROM posts as P INNER JOIN users as U ON P.creator_id = U.id ORDER BY id DESC LIMIT ? OFFSET ? ", maxPerPage, offset)
		finalPosts := make([]database.Post, 0)
		for _, post := range posts {
			//if your own post show it
			if post.CreatorId == user.Id {
				finalPosts = append(finalPosts, post)
				continue
			}
			if post.GroupId != 0 {
				//now check whether current user is part of the group
				members, err := database.GetAllGroupMembers(post.GroupId)
				if err != nil {
					fmt.Println(err.Error())
					ServerError(w, err.Error())
					return
				}
				for _, member := range members {
					if member.Id == user.Id {
						finalPosts = append(finalPosts, post)
					}
				}
			}
			if post.Privacy == 1 {
				//public post
				finalPosts = append(finalPosts, post)
				continue
			} else if post.Privacy == 2 {
				postMeta, _ := database.GetPostMetadata(post.Id)
				if postMeta != nil {
					allowed := make([]int, 0)
					err := json.Unmarshal([]byte(postMeta.AllowedViewers), &allowed)
					if err != nil {
						fmt.Println(err.Error())
						return
					}
					for _, allowedUser := range allowed {
						if user.Id == allowedUser {
							finalPosts = append(finalPosts, post)
						}
					}
				}
			} else if post.Privacy == 0 {
				//only followers can see the post
				//TODO: need list of followers
				followers, err := database.GetRelationshipsByFollowingID(post.CreatorId)
				if err != nil {
					fmt.Println(err.Error())
				}
				//if user id inside here then show
				fmt.Println(followers)
				for _, f := range followers {
					if f.FollowerId == user.Id {
						finalPosts = append(finalPosts, post)
						break
					}
				}
			}
		}
		Success(w, finalPosts)
	}
}
