package handlers

import (
	"fmt"
	"main/database"
	"net/http"
	"strconv"
)

// Create a notification
func CreateNotification(userId int, link string, message string) error {
	var notification database.Notification
	notification.UserId = userId
	notification.Message = message
	notification.Link = link
	_, err := database.CreateNotification(notification)
	if err != nil {
		return err
	}
	//now send it via websocket
	SendNotification(userId)
	return err
}
func NotificationsHandler(w http.ResponseWriter, r *http.Request) {
	user := GetUserFromCookie(r)
	if user == nil {
		Unauthorized(w, "Not logged in")
		return
	}
	if r.Method == "GET" {
		//send all notifications
		allNotifications, err := database.GetNotificationsByUserId(user.Id)
		if err != nil {
			ServerError(w, err.Error())
			return
		}
		Success(w, allNotifications)
	} else if r.Method == "DELETE" {
		//delete the notification
		params := r.URL.Query()
		notificationId, err := strconv.Atoi(params.Get("id"))
		if err != nil {
			ServerError(w, err.Error())
			fmt.Println(err.Error())
			return
		}
		database.DeleteNotification(notificationId)
		CustomResponse(w, 204, "")
	}
}
