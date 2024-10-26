package handlers

import (
	"fmt"
	"main/database"
	"main/types"
	"net/http"
	"strconv"
	"time"
)

func GetGroupRelationsByUserId(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	if r.Method == "GET" {
		//get group rleationships by user id. get the groups user is part of
		relations, err := database.GetGroupRelationshipsByUserId(user.Id)
		if err != nil {
			ServerError(w, "")
			return
		}
		Success(w, relations)
	}
}
func AllGroupsHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	if r.Method == "GET" {
		//gets a list of all groups
		allGroups, err := database.GetAllGroups()
		if err != nil {
			ServerError(w, "")
			return
		}
		Success(w, allGroups)
	}
}
func GroupMembersHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	if r.Method == "GET" {
		//gets all of the group members by id
		params := r.URL.Query()
		groupId, err := strconv.Atoi(params.Get("groupId"))
		if err != nil {
			fmt.Println(err)
			BadRequest(w, "")
			return
		}
		members, err := database.GetAllGroupMembers(groupId)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		Success(w, members)
	}
}

func GroupInviteHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	if r.Method == "POST" {
		//send group invite
		var request types.InviteNewMemberRequest
		err := decodeBody(r, &request)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		//check if relation already exists
		result, _ := database.GetGroupRelationshipByUserAndGroupID(request.UserId, request.GroupId)
		if result != nil {
			CustomResponse(w, 409, "Already invited")
			return
		}
		var relation database.GroupRelationship
		relation.GroupId = request.GroupId
		relation.UserId = request.UserId
		relation.Status = 3
		if request.IsRequest {
			//measn user itself requests to join the group
			relation.Status = 2
		}
		_, err = database.CreateGroupRelationship(relation)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		//create notification for it
		link := "/groups/" + strconv.Itoa(request.GroupId)
		if request.IsRequest {
			//send notification to group owner about the request to join
			group, err := database.GetGroupByID(request.GroupId)
			if err != nil {
				fmt.Println(err)
				ServerError(w, err.Error())
				return
			}
			err = CreateNotification(group.CreatorId, link, "Requests to join the group")
			if err != nil {
				fmt.Println(err.Error())
			}
		} else {
			err = CreateNotification(request.UserId, link, "New group invite")
		}
		if err != nil {
			fmt.Println(err.Error())
			ServerError(w, err.Error())
			return
		}
		Success(w, nil)
	} else if r.Method == "GET" {
		params := r.URL.Query()
		userId, err := strconv.Atoi(params.Get("userId"))
		if err != nil {
			userId = user.Id
		}
		groupId, err := strconv.Atoi(params.Get("groupId"))
		action := params.Get("action") // accept or deny
		if err != nil {
			fmt.Println("Error with GroupInviteHandler: ", err.Error())
			ServerError(w, err.Error())
			return
		}
		if action == "deny" {
			//delete it
			_, err := database.Db.Exec("DELETE FROM group_relationships WHERE group_id = ? AND user_id = ?", groupId, userId)
			if err != nil {
				fmt.Println(err.Error())
			}
		} else {
			_, err := database.Db.Exec("UPDATE group_relationships SET status = 1 WHERE group_id = ? AND user_id = ?", groupId, userId)
			if err != nil {
				fmt.Println(err.Error())
			}
			//also add to the group conversation
			//Get the conversation id from
			var convoId int
			err = database.Db.QueryRow("SELECT conversation_id FROM conversation_relationships WHERE group_id = ?", groupId).Scan(&convoId)
			if err != nil {
				fmt.Println("Error with grouphandler: ", err.Error())
				ServerError(w, err.Error())
				return
			}
			_, err = database.Db.Exec("INSERT INTO conversation_relationships (user_id, conversation_id, timestamp, group_id) VALUES (?, ?, ?, ?)", userId, convoId, time.Now().Unix(), groupId)
			if err != nil {
				fmt.Print("Error with inserting convo relation: ", err.Error())
				ServerError(w, err.Error())
				return
			}
			CustomResponse(w, 204, "")
		}
	}
}
func GroupHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	if r.Method == "POST" {
		//create the group
		var group database.Group
		err := decodeBody(r, &group)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		//check if group exists with the same title
		existing, _ := database.GetGroupByName(group.Name)
		if existing != nil {
			CustomResponse(w, 409, "Group with this name already exists")
			return
		}
		group.CreatorId = user.Id
		groupId, err := database.CreateGroup(group)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		//create group relation for owner
		var relation database.GroupRelationship
		relation.GroupId = int(groupId)
		relation.UserId = user.Id
		relation.Status = 1
		_, err = database.CreateGroupRelationship(relation)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		//now create group chat
		var conversation database.Conversation
		conversation.Type = "group"
		convoId, err := database.CreateConversation(conversation)
		if err != nil {
			fmt.Println("Failed to create group: ", err.Error())
			ServerError(w, err.Error())
			return
		}
		//create owner relation with the group
		var convorelation database.ConversationRelationship
		convorelation.ConversationId = int(convoId)
		convorelation.Timestamp = int(time.Now().Unix())
		convorelation.UserId = user.Id
		convorelation.GroupId = int(groupId)
		database.CreateConversationRelationship(convorelation)
		Success(w, groupId)
	} else if r.Method == "GET" {
		//get the group by id
		params := r.URL.Query()
		groupId, err := strconv.Atoi(params.Get("groupId"))
		if err != nil {
			fmt.Println(err)
			ServerError(w, err.Error())
			return
		}
		group, err := database.GetGroupByID(groupId)
		if err != nil {
			fmt.Println(groupId)
			fmt.Println("jere")
			ServerError(w, err.Error())
			return
		}
		Success(w, group)
	}
}

func GroupRequestsHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "Unauthorized")
		return
	}
	if r.Method == "GET" {
		//get the group invites by group id
		queryParams := r.URL.Query()
		groupId, err := strconv.Atoi(queryParams.Get("groupId"))
		if err != nil {
			fmt.Println(err)
			ServerError(w, err.Error())
			return
		}
		groupInvites, err := database.GetGroupRequestsByGroupId(groupId)
		if err != nil {
			fmt.Println(err)
			ServerError(w, err.Error())
			return
		}
		Success(w, groupInvites)
	}
}
