package database

// User Represents users table
type User struct {
	Id           int         `json:"id,omitempty"`
	Nickname     string      `json:"nickname"`
	Email        string      `json:"email"`
	Password     string      `json:"password,omitempty"`
	Firstname    string      `json:"firstname"`
	Lastname     string      `json:"lastname"`
	Dob          DateOfBirth `json:"dob"`
	AboutMe      string      `json:"aboutMe"`
	AvatarPath   string      `json:"avatarPath"`
	IsPrivate    int         `json:"isPrivate"`       //0 = public, 1 = private
	Posts        []Post      `json:"posts,omitempty"` //get the posts by the user
	FollowerIds  []int       `json:"followerIds,omitempty"`
	FollowingIds []int       `json:"followingIds,omitempty"`
}

type DateOfBirth struct {
	Day   int `json:"day"`
	Month int `json:"month"`
	Year  int `json:"year"`
}

// Relationship Represents the following/follower table
type Relationship struct {
	FollowerId  int    `json:"FollowerId"`
	FollowingId int    `json:"FollowingId"`
	Timestamp   int    `json:"Timestamp"` //When the action was taken. Unix
	Accepted    int    `json:"Accepted"`  // 0, pending, 1 = accepted
	Firstname   string `json:"firstname,omitempty"`
	Lastname    string `json:"lastname,omitempty"`
	AvatarPath  string `json:"avatarPath,omitempty"`
}

// Post Represents posts table
type Post struct {
	Id        int    `json:"id,omitempty"`
	CreatorId int    `json:"creatorId,omitempty"`
	GroupId   int    `json:"groupId,omitempty"` //optional
	Title     string `json:"title"`
	Content   string `json:"content"`
	Timestamp int    `json:"timestamp,omitempty"` //When the post was created. Unix
	Privacy   int    `json:"privacy"`             //0 = private, 1 = public, 2 = almost private, public (all users in the social network will be able to see the post)
	//private (only followers of the creator of the post will be able to see the post)
	//almost private (only the followers chosen by the creator of the post will be able to see it)
	AllowedViewers string `json:"allowedViewers,omitempty"` //list of allowed viewers, will be read when privacy is set to2
	Image          string `json:"imagePath,omitempty"`
	Firstname      string `json:"firstname,omitempty"`
	Lastname       string `json:"lastname,omitempty"`
}

type PostMetadata struct {
	PostId         int    `json:"id"`
	AllowedViewers string `json:"allowedViewers"` //this is saved as a JSON array string
}

// Comment represents comments table
type Comment struct {
	Id        int    `json:"id"`
	PostId    int    `json:"postId"`
	Content   string `json:"content"`
	Timestamp int    `json:"timestamp"`
	ImagePath string `json:"imagePath"` // relative path to the uploaded file
	Privacy   int    `json:"privacy"`   // 0 = private, 1 = public, 2 = almost private
	CreatorId int    `json:"creatorId,omitempty"`
	Firstname string `json:"firstname,omitempty"`
	Lastname  string `json:"lastname,omitempty"`
}

// Group represents groups table
type GroupFull struct {
	Id          int                 `json:"id,omitempty"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	CreatorId   int                 `json:"creatorId,omitempty"`
	Relations   []GroupRelationship `json:"groupRelations"`
	Members     []int               `json:"members"`
	Invites     []int               `json:"invites"`
	Requests    []int               `json:"requests"`
}

// Group represents groups table
type Group struct {
	Id          int    `json:"id,omitempty"`
	Name        string `json:"name"`
	Description string `json:"description"`
	CreatorId   int    `json:"creatorId,omitempty"`
}

type GroupInvite struct {
	UserId        int    `json:"userId"`
	GroupId       int    `json:"groupId"`
	UserFirstname string `json:"firstname"`
	UserLastname  string `json:"lastname"`
	Nickname      string `json:"nickname"`
	AvatarPath    string `json:"avatarPath,omitempty"`
}

// GroupRelationship represents groupRelationships table
type GroupRelationship struct {
	Id        int    `json:"id"`
	GroupId   int    `json:"groupId"`
	UserId    int    `json:"userId"`
	Status    int    `json:"status"` // 0 = none, 1 = member, 2 = requested by UserId, 3 = invited1
	GroupName string `json:"groupName,omitempty"`
}

// Event represents events table
type Event struct {
	Id          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Timestamp   int    `json:"timestamp"`
	GroupId     int    `json:"groupId"`
}

// EventRelationship represents eventRelationships table
type EventRelationship struct {
	Id        int    `json:"id,omitempty"`
	UserId    int    `json:"userId"`
	EventId   int    `json:"eventId"`
	Status    int    `json:"status"` // 0 = not going, 1 = invited, 2 going
	Firstname string `json:"firstname,omitempty"`
	Lastname  string `json:"lastname,omitempty"`
}

type Session struct {
	SessionId       string `json:"sessionId"`
	UserId          int    `json:"userId"`
	ExpiryTimestamp int    `json:"expiryTimestamp"`
}

type Conversation struct {
	Id             int    `json:"id"`
	Type           string `json:"type"` // direct or group
	OwnerFirstname string `json:"ownerFirstname"`
	OwnerLastname  string `json:"ownerLastname"`
	Participants   []int  `json:"participants"`
}

type ConversationRelationship struct {
	UserId         int `json:"userId"`
	ConversationId int `json:"conversationId"`
	Timestamp      int `json:"timestamp"`
	GroupId        int `json:"groupId,omitempty"`
}

type Message struct {
	Id             int    `json:"id"`
	ConversationId int    `json:"conversationId"`
	AuthorId       int    `json:"authorId"`
	Content        string `json:"content"`
	Timestamp      int    `json:"timestamp"`
	Firstname      string `json:"firstname,omitempty"`
	Lastname       string `json:"lastname,omitempty"`
}
type SocketMessage struct {
	Type     string  `json:"type"`
	Message  Message `json:"message"`
	Receiver string  `json:"receiver,omitempty"`
	Sender   string  `json:"sender,omitempty"`
}
type Notification struct {
	Id      int    `json:"id"`
	UserId  int    `json:"userId"`
	Message string `json:"message"`
	Link    string `json:"link"` //group inv goes to group page, follow request goes to profile, group acceptance goes to group page (if owner), event created goes to group page
}
