package handlers

import (
	"fmt"
	"main/database"
	"net/http"
	"strconv"
	"time"
)

type createConversationRequest struct {
	Recipients []int `json:"recipients"`
}

func MessagesHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "Unauthorized")
		return
	}
	if r.Method == "GET" {
		queryParams := r.URL.Query()
		conversationId, err := strconv.Atoi(queryParams.Get("id"))
		if err != nil {
			fmt.Println(err)
			ServerError(w, err.Error())
			return
		}
		messages, err := database.GetMessagesByConversationId(conversationId)
		Success(w, messages)
	}
}

func ConversationHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "Unauthorized")
		return
	}
	if r.Method == "POST" {
		createNewConvoFunc := func(receiverIds []int) *database.Conversation {
			convoType := "direct"
			if len(receiverIds) > 1 {
				//means it's a group
				convoType = "group"
			}
			var newConv database.Conversation
			newConv.Type = convoType
			conversationId, err := database.CreateConversation(newConv)
			if err != nil {
				fmt.Println(err.Error())
			}
			newConv.Id = int(conversationId)
			newConv.Participants = append(newConv.Participants, receiverIds[0])
			ownerRelationship := database.ConversationRelationship{ConversationId: newConv.Id, UserId: user.Id, Timestamp: int(time.Now().Unix()), GroupId: 0}
			_, err = database.CreateConversationRelationship(ownerRelationship)
			if err != nil {
				fmt.Println("Error with conversationhandler: ", err.Error())
			}
			for _, r := range receiverIds {
				conversationRelationship := database.ConversationRelationship{ConversationId: newConv.Id, UserId: r}
				_, err = database.CreateConversationRelationship(conversationRelationship)
				if err != nil {
					fmt.Println(err.Error())
				}
				//send a notification for the target user
				CreateNotification(r, "", fmt.Sprintf("New converstion has been started with you."))
			}
			return &newConv
		}
		var request createConversationRequest
		err := decodeBody(r, &request)
		if err != nil {
			fmt.Println(err.Error())
			return
		}
		newConvo := createNewConvoFunc(request.Recipients)
		Success(w, newConvo)
	}
}
func GetAllConversations(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		user := GetUserFromCookie(r)
		if user == nil {
			Unauthorized(w, "")
			return
		}

		conversations, err := database.GetAllConversationsByUserId(user.Id)
		//now get all the participants for conversations
		for index, convo := range conversations {
			relationships, err := database.GetAllConversationRelationshipsById(convo.Id)
			if err != nil {
				fmt.Println(err.Error())
				continue
			}
			for _, relationship := range relationships {
				convo.Participants = append(convo.Participants, relationship.UserId)
			}
			conversations[index] = convo
		}
		if err != nil {
			fmt.Println(err.Error())
			ServerError(w, err.Error())
			return
		}
		Success(w, conversations)
	}
	/*
		if r.Method == "POST" {
			//give the matching conversation
			user := GetUserFromCookie(r)
			if user == nil {
				Unauthorized(w, "Unauthorized")
				return
			}
			type requestBody struct {
				Receiver string `json:"receiver"`
			}
			var request requestBody
			err := decodeBody(r, &request)
			if err != nil {
				ServerError(w, err.Error())
				return
			}

			conversation, err := database.GetConversationById()
		} else {

		}

	*/
}
func ConversationRelationshipHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		user := GetUserFromCookie(r)
		if user == nil {
			Unauthorized(w, "Unauthorized")
			return
		}
		queryParams := r.URL.Query()
		conversationId, err := strconv.Atoi(queryParams.Get("id"))
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		relationship, err := database.GetAllConversationRelationshipsById(conversationId)
		Success(w, relationship)
	}
}
