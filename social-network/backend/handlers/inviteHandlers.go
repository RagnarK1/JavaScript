package handlers

import (
	"fmt"
	"main/database"
	"net/http"
	"strconv"
)

// handle invites, not including invites part of group etc
// InvitesHandler InviteHandler Get the pending invites
func InvitesHandler(w http.ResponseWriter, r *http.Request) {
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
		groupInvites, err := database.GetGroupInvitesByGroupId(groupId)
		if err != nil {
			fmt.Println(err)
			ServerError(w, err.Error())
			return
		}
		Success(w, groupInvites)
	}
}
