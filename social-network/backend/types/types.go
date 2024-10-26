package types

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type InviteNewMemberRequest struct {
	UserId    int  `json:"userId"`
	GroupId   int  `json:"groupId"`
	IsRequest bool `json:"isRequest,omitempty"`
}

type EventInviteAction struct {
	EventId      int `json:"eventId"`
	AcceptStatus int `json:"acceptStatus"` //0 = denied, 2 = accepted
}

type NewEventRequest struct {
	Id          int    `json:"id,omitempty"`
	GroupId     int    `json:"groupId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Timestamp   int    `json:"timestamp,omitempty"`
}
