package handlers

import (
	"fmt"
	"main/database"
	"main/types"
	"net/http"
	"strconv"
)

func EventInviteHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "")
		return
	}
	if r.Method == "POST" {
		var request types.EventInviteAction
		err := decodeBody(r, &request)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		fmt.Println(request.AcceptStatus)
		err = database.UpdateEventRelationship(request.EventId, request.AcceptStatus, user.Id)
		if err != nil {
			fmt.Println(err)
			ServerError(w, err.Error())
			return
		}
		Success(w, nil)
	}
}

func EventHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "Unauthorized")
		return
	}
	if r.Method == "POST" {
		//create a new event
		var request types.NewEventRequest
		err := decodeBody(r, &request)
		if err != nil {
			BadRequest(w, err.Error())
			return
		}
		var event database.Event
		//check if event with same title exists already
		existing, _ := database.GetEventByTitle(event.Title)
		if existing != nil {
			CustomResponse(w, 409, "Event with this name already exists")
			return
		}
		event.Title = request.Title
		event.Description = request.Description
		event.GroupId = request.GroupId
		event.Timestamp = request.Timestamp
		eventId, err := database.CreateEvent(event)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		//now create relationships for each of the group members, between events. add them as pending
		groupRelations, err := database.GetGroupRelationshipsById(request.GroupId)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		for _, relation := range groupRelations {
			var eventRelation database.EventRelationship
			eventRelation.Status = 1 //invited
			eventRelation.UserId = relation.UserId
			eventRelation.EventId = int(eventId)
			_, err := database.CreateEventRelationship(eventRelation)
			if err != nil {
				ServerError(w, err.Error())
				return
			}
			//now send notifications to all of the group members
			notificationLink := "/groups/" + strconv.Itoa(request.GroupId)
			err = CreateNotification(relation.UserId, notificationLink, "New event was added")
			if err != nil {
				fmt.Println(err.Error())
				ServerError(w, err.Error())
				return
			}
		}
		Success(w, eventId)
	}
}
func EventRelationships(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "Unauthorized")
		return
	}
	if r.Method == "GET" {
		queryParams := r.URL.Query()
		eventId, err := strconv.Atoi(queryParams.Get("eventId"))
		if err != nil {
			BadRequest(w, err.Error())
			return
		}
		relations, err := database.GetAllEventRelationsById(eventId)
		if err != nil {
			fmt.Println(err)
			ServerError(w, err.Error())
			return
		}
		Success(w, relations)
	}
}
func AllEventsHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "Unauthorized")
		return
	}
	if r.Method == "GET" {
		queryParams := r.URL.Query()
		groupId, err := strconv.Atoi(queryParams.Get("groupId"))
		if err != nil {
			BadRequest(w, err.Error())
			return
		}
		events, err := database.GetAllEventsByGroupId(groupId)
		if err != nil {
			fmt.Println(err)
			ServerError(w, err.Error())
			return
		}
		Success(w, events)
	}
}
