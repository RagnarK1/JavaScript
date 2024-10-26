package database

import (
	"database/sql"
	"fmt"
	"github.com/golang-migrate/migrate/v4"
	sqlite "github.com/golang-migrate/migrate/v4/database/sqlite"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
	"log"
)

func CreateComment(comment Comment) (int64, error) {
	return PrepareAndExecute("INSERT INTO comments (post_id, content, timestamp, image_path, privacy, creator_id) VALUES (?, ?, ?, ?, ?, ?)", comment.PostId, comment.Content, comment.Timestamp, comment.ImagePath, comment.Privacy, comment.CreatorId)
}

func GetAllCommentsByPostId(postId int) ([]Comment, error) {
	return QueryItems[Comment]("SELECT c.*, u.firstname, u.lastname  FROM comments as c INNER JOIN users as u ON c.creator_id = u.id WHERE post_id = ?", func(rows *sql.Rows, item *Comment) error {
		return rows.Scan(&item.Id, &item.PostId, &item.Content, &item.Timestamp, &item.ImagePath, &item.Privacy, &item.CreatorId, &item.Firstname, &item.Lastname)
	}, postId)
}

func CreateMessage(message Message) (int64, error) {
	return PrepareAndExecute("INSERT INTO messages (conversation_id, author_id, content, timestamp) VALUES (?,?,?,?)", message.ConversationId, message.AuthorId, message.Content, message.Timestamp)
}

func GetMessagesByConversationId(conversationId int) ([]Message, error) {
	return QueryItems[Message]("select m.*, u.firstname, u.lastname from messages as m inner join users as u on m.author_id = u.id where conversation_id =?", func(rows *sql.Rows, item *Message) error {
		return rows.Scan(&item.Id, &item.ConversationId, &item.AuthorId, &item.Content, &item.Timestamp, &item.Firstname, &item.Lastname)
	}, conversationId)
}

func GetConversationRelationshipById(id int) (*ConversationRelationship, error) {
	return QueryItem[ConversationRelationship]("SELECT * FROM conversation_relationships WHERE conversation_id = ?", func(row *sql.Row, conversation *ConversationRelationship) error {
		return row.Scan(&conversation.ConversationId, &conversation.ConversationId, &conversation.Timestamp)
	}, id)
}
func GetAllConversationsByUserId(id int) ([]Conversation, error) {
	return QueryItems[Conversation](`SELECT
    cr.conversation_id,
	type,
    u.firstname,
    u.lastname
FROM
    conversation_relationships AS cr
JOIN
    conversations AS c ON cr.conversation_id = c.id
JOIN
    users AS u ON cr.user_id = u.id
WHERE
cr.user_id = ?;
`, func(rows *sql.Rows, conversation *Conversation) error {
		return rows.Scan(&conversation.Id, &conversation.Type, &conversation.OwnerFirstname, &conversation.OwnerLastname)
	}, id)
}
func GetAllConversationRelationshipsById(id int) ([]ConversationRelationship, error) {
	return QueryItems[ConversationRelationship]("SELECT * FROM conversation_relationships WHERE conversation_id = ?", func(rows *sql.Rows, conversation *ConversationRelationship) error {
		return rows.Scan(&conversation.UserId, &conversation.ConversationId, &conversation.Timestamp, &conversation.GroupId)
	}, id)
}

func CreateConversationRelationship(relationship ConversationRelationship) (int64, error) {
	return PrepareAndExecute("INSERT INTO conversation_relationships (user_id, conversation_id, timestamp, group_id) VALUES (?, ?,?, ?)", relationship.UserId, relationship.ConversationId, relationship.Timestamp, relationship.GroupId)
}

func CreateConversation(convo Conversation) (int64, error) {
	return PrepareAndExecute("INSERT INTO conversations (type) VALUES (?)", convo.Type)
}

func GetConversationById(id int) (*Conversation, error) {
	return QueryItem[Conversation]("SELECT * FROM conversations WHERE Id = ?", func(row *sql.Row, item *Conversation) error {
		return row.Scan(&item.Id, &item.Type)
	}, id)
}

func SearchUser(nameParts []string, userId int) ([]User, error) {
	var users = make([]User, 0)
	finalUsers := make([]User, 0)
	for _, namePart := range nameParts {
		// Surround the name part with '%' for a wildcard search
		wildcardNamePart := "%" + namePart + "%"

		// Prepare your query
		query := "SELECT * FROM users WHERE firstname LIKE ? OR lastname LIKE ?"

		// Execute the query with the name parts as parameters
		rows, err := Db.Query(query, wildcardNamePart, wildcardNamePart)
		if err != nil {
			log.Fatal(err)
			return users, err
		}
		defer func(rows *sql.Rows) {
			err := rows.Close()
			if err != nil {
				log.Fatal(err)
			}
		}(rows)

		// Iterate over the results and aggregate them
		for rows.Next() {
			var user User
			if err := rows.Scan(&user.Id, &user.Nickname, &user.Email, &user.Password, &user.Firstname, &user.Lastname, &user.Dob.Day, &user.Dob.Month, &user.Dob.Year, &user.AboutMe, &user.AvatarPath, &user.IsPrivate); err != nil {
				log.Fatal(err)
			}
			// Create a string representation of each result
			users = append(users, user)
		}
		//get the followers of current account
		relationships, _ := GetRelationshipsByFollowingID(userId)
		for _, user := range users {
			for _, r := range relationships {
				if user.Id == r.FollowerId {
					finalUsers = append(finalUsers, user)
				}
			}
		}
		if err := rows.Err(); err != nil {
			log.Fatal(err)
		}
	}
	return finalUsers, nil
}

func GetAllUsers() ([]User, error) {
	return QueryItems[User]("SELECT * FROM users", func(rows *sql.Rows, relation *User) error {
		return rows.Scan(
			&relation.Id, &relation.Nickname, &relation.Email, &relation.Password, &relation.Firstname, &relation.Lastname, &relation.Dob.Day, &relation.Dob.Month, &relation.Dob.Year, &relation.AboutMe, &relation.AvatarPath, &relation.IsPrivate)
	})
}
func CreateUser(user User) (int64, error) {
	return PrepareAndExecute("INSERT INTO users(Nickname, Email, Password, Firstname, Lastname, dob_day, dob_month, dob_year, About_Me, Avatar_Path, Is_Private) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", user.Nickname, user.Email, user.Password, user.Firstname, user.Lastname, user.Dob.Day, user.Dob.Month, user.Dob.Year, user.AboutMe, user.AvatarPath, user.IsPrivate)
}

// GetUserByUsername can be both nickname or email
func GetUserByUsername(username string) (*User, error) {
	return QueryItem[User]("SELECT * FROM users WHERE nickname = ? OR email=?", func(row *sql.Row, user *User) error {
		var privacy sql.NullInt64
		result := row.Scan(
			&user.Id, &user.Nickname, &user.Email, &user.Password, &user.Firstname, &user.Lastname, &user.Dob.Day, &user.Dob.Month, &user.Dob.Year, &user.AboutMe, &user.AvatarPath, &privacy)
		if privacy.Valid {
			user.IsPrivate = int(privacy.Int64)
		} else {
			user.IsPrivate = 0
		}
		return result
	}, username, username)
}

func GetUserByID(id int) (*User, error) {
	return QueryItem[User]("SELECT * FROM users WHERE Id = ?", func(row *sql.Row, user *User) error {
		var privacy sql.NullInt64
		err := row.Scan(
			&user.Id, &user.Nickname, &user.Email, &user.Password, &user.Firstname, &user.Lastname, &user.Dob.Day, &user.Dob.Month, &user.Dob.Year, &user.AboutMe, &user.AvatarPath, &privacy)
		if privacy.Valid {
			user.IsPrivate = int(privacy.Int64)
		} else {
			user.IsPrivate = 0
		}
		return err
	}, id)
}

func GetSessionById(sessionId string) (*Session, error) {
	return QueryItem[Session]("SELECT * FROM sessions WHERE session_id= ?", func(row *sql.Row, session *Session) error {
		return row.Scan(&session.SessionId, &session.UserId, &session.ExpiryTimestamp)
	}, sessionId)
}

func RemoveSessionByUserId(userId int) error {
	return Execute("DELETE FROM sessions WHERE user_id = ?", userId)
}

func InsertSession(session Session) error {
	return Execute("INSERT INTO sessions (session_id, user_id, expiry_timestamp) VALUES (?, ?, ?)", session.SessionId, session.UserId, session.ExpiryTimestamp)
}

func CreatePostMetadata(postId int, metadata string) error {
	return Execute("INSERT INTO post_meta (postId, allowedViewers) VALUES (?, ?)", postId, metadata)
}

func GetPostMetadata(postId int) (*PostMetadata, error) {
	return QueryItem[PostMetadata]("SELECT * FROM post_meta WHERE postId=?", func(row *sql.Row, item *PostMetadata) error {
		return row.Scan(&item.PostId, &item.AllowedViewers)
	}, postId)
}

// CreateRelationship CRUD operations for Relationship
func CreateRelationship(relation Relationship) (int64, error) {
	return PrepareAndExecute("INSERT INTO relationships(Follower_Id, Following_Id, Timestamp, Accepted) VALUES (?, ?, ?, ?)",
		relation.FollowerId, relation.FollowingId, relation.Timestamp, relation.Accepted)
}

func GetRelationshipsByFollowingID(id int) ([]Relationship, error) {
	return QueryItems[Relationship]("SELECT r.*, u.firstname, u.lastname, u.avatar_path FROM relationships as r INNER JOIN main.users u on u.id = r.follower_id WHERE following_id=? AND accepted = 1", func(rows *sql.Rows, relation *Relationship) error {
		return rows.Scan(
			&relation.FollowerId, &relation.FollowingId, &relation.Timestamp, &relation.Accepted, &relation.Firstname, &relation.Lastname, &relation.AvatarPath)
	}, id)
}

// Modified to include names and profile pic
func GetRelationshipRequestsByFollowingId(id int) ([]Relationship, error) {
	return QueryItems[Relationship]("SELECT R.*, u.firstname, u.lastname, u.avatar_path FROM relationships AS R INNER JOIN main.users u on R.follower_id = u.id WHERE following_id=? AND accepted = 0", func(rows *sql.Rows, relation *Relationship) error {
		return rows.Scan(
			&relation.FollowerId, &relation.FollowingId, &relation.Timestamp, &relation.Accepted, &relation.Firstname, &relation.Lastname, &relation.AvatarPath)
	}, id)
}
func GetRelationshipsByFollowerID(id int) ([]Relationship, error) {
	return QueryItems[Relationship]("SELECT r.*, u.firstname, u.lastname, u.avatar_path FROM relationships as r INNER JOIN main.users u on u.id = r.following_id WHERE follower_id=? AND accepted = 1", func(rows *sql.Rows, relation *Relationship) error {
		return rows.Scan(
			&relation.FollowerId, &relation.FollowingId, &relation.Timestamp, &relation.Accepted, &relation.Firstname, &relation.Lastname, &relation.AvatarPath)
	}, id)
}

func GetRelationshipByFollowerAndFollowingID(followerID, followingID int) (*Relationship, error) {
	var relation Relationship

	fmt.Printf("SQL Query: SELECT * FROM relationships WHERE follower_id = %d AND following_id = %d\n", followerID, followingID)

	err := Db.QueryRow("SELECT * FROM relationships WHERE follower_id = ? AND following_id = ?", followerID, followingID).
		Scan(&relation.FollowerId, &relation.FollowingId, &relation.Timestamp, &relation.Accepted)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("GetRelationshipByFollowerAndFollowingID - No rows found")
			return nil, nil
		}

		fmt.Printf("GetRelationshipByFollowerAndFollowingID - Error: %v\n", err)

		return nil, err
	}

	fmt.Printf("GetRelationshipByFollowerAndFollowingID - Scanned values: %+v\n", relation)

	return &relation, nil
}

func RelationshipExists(followerID, followingID int) (bool, error) {
	var count int
	err := Db.QueryRow("SELECT COUNT(*) FROM relationships WHERE follower_id = ? AND following_id = ?", followerID, followingID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func DeleteRelationship(followerID, followingID int) error {
	_, err := Db.Exec("DELETE FROM relationships WHERE follower_id = ? AND following_id = ?", followerID, followingID)
	if err != nil {
		return err
	}
	return nil
}

// CreatePost CRUD operations for Post
func CreatePost(post Post) (int64, error) {
	return PrepareAndExecute("INSERT INTO posts(Group_Id, Title, Content, Timestamp, privacy, creator_id, image_post) VALUES (?,?, ?, ?, ?, ?,?)", post.GroupId, post.Title, post.Content, post.Timestamp, post.Privacy, post.CreatorId, post.Image)
}

func GetPostsCustomQuery(query string, args ...any) ([]Post, error) {
	return QueryItems[Post](query, func(rows *sql.Rows, post *Post) error {
		return rows.Scan(&post.Id, &post.GroupId, &post.Title, &post.Content, &post.Timestamp, &post.Privacy, &post.CreatorId, &post.Image, &post.Firstname, &post.Lastname)
	}, args...)
}
func GetAllPostsWithPagination(maxPages int, pageNum int) ([]Post, error) {
	return QueryItems[Post]("SELECT * FROM posts", func(rows *sql.Rows, post *Post) error {
		return rows.Scan(&post.Id, &post.GroupId, &post.Title, &post.Content, &post.Timestamp, &post.Privacy, &post.CreatorId, &post.Image)
	})
}
func GetAllPostsByUserId(id int) ([]Post, error) {
	return QueryItems[Post]("SELECT * FROM posts WHERE creator_id = ?", func(rows *sql.Rows, post *Post) error {
		return rows.Scan(&post.Id, &post.GroupId, &post.Title, &post.Content, &post.Timestamp, &post.Privacy, &post.CreatorId, &post.Image)
	}, id)
}
func GetAllPosts() ([]Post, error) {
	return QueryItems[Post]("SELECT p.*, u.firstname, u.lastname FROM posts AS p INNER JOIN users AS u ON u.id = p.creator_id", func(rows *sql.Rows, post *Post) error {
		return rows.Scan(&post.Id, &post.GroupId, &post.Title, &post.Content, &post.Timestamp, &post.Privacy, &post.CreatorId, &post.Image, &post.Firstname, &post.Lastname)
	})
}
func GetPostByID(id int) (*Post, error) {
	var post Post
	err := Db.QueryRow("SELECT P.*, U.firstname, U.lastname FROM posts as P INNER JOIN users as U on U.id = P.creator_id  WHERE P.id = ?", id).Scan(
		&post.Id, &post.GroupId, &post.Title, &post.Content, &post.Timestamp, &post.Privacy, &post.CreatorId, &post.Image, &post.Firstname, &post.Lastname)
	if err != nil {
		return nil, err
	}
	return &post, nil
}

// CreateGroup CRUD operations for Group
func CreateGroup(group Group) (int64, error) {
	return PrepareAndExecute("INSERT INTO groups(Name, Description, Creator_Id) VALUES (?, ?, ?)", group.Name, group.Description, group.CreatorId)
}

// GetAllGroups Gets all the available groups
func GetAllGroups() ([]Group, error) {
	return QueryItems[Group]("SELECT * FROM groups", func(rows *sql.Rows, group *Group) error {
		return rows.Scan(&group.Id, &group.Name, &group.Description, &group.CreatorId)
	})
}
func GetGroupByName(name string) (*Group, error) {
	return QueryItem[Group]("SELECT * FROM groups WHERE name = ?", func(row *sql.Row, group *Group) error {
		return row.Scan(
			&group.Id, &group.Name, &group.Description, &group.CreatorId)
	}, name)
}

func GetGroupByID(id int) (*Group, error) {
	query := "SELECT * FROM groups WHERE Id = ?"
	return QueryItem[Group](query, func(row *sql.Row, group *Group) error {
		return row.Scan(
			&group.Id, &group.Name, &group.Description, &group.CreatorId)

	}, id)
}

// CreateGroupRelationship CRUD operations for GroupRelationship
func CreateGroupRelationship(groupRelation GroupRelationship) (int64, error) {
	return PrepareAndExecute("INSERT INTO group_relationships(Group_Id, User_Id, Status) VALUES (?, ?, ?)", groupRelation.GroupId, groupRelation.UserId, groupRelation.Status)
}
func GetGroupRequestsByGroupId(id int) ([]GroupInvite, error) {
	return QueryItems[GroupInvite]("SELECT user_id, group_id, firstname, lastname, avatar_path FROM group_relationships A INNER JOIN users B ON A.user_id = B.id WHERE A.status = 2 AND A.group_id = ?;", func(rows *sql.Rows, groupRelation *GroupInvite) error {
		return rows.Scan(&groupRelation.UserId, &groupRelation.GroupId, &groupRelation.UserFirstname, &groupRelation.UserLastname, &groupRelation.AvatarPath)
	}, id)
}
func GetGroupInvitesByGroupId(id int) ([]GroupInvite, error) {
	return QueryItems[GroupInvite]("SELECT user_id, group_id, firstname, lastname, avatar_path FROM group_relationships A INNER JOIN users B ON A.user_id = B.id WHERE A.status = 3 AND A.group_id = ?;", func(rows *sql.Rows, groupRelation *GroupInvite) error {

		return rows.Scan(&groupRelation.UserId, &groupRelation.GroupId, &groupRelation.UserFirstname, &groupRelation.UserLastname, &groupRelation.AvatarPath)

	}, id)
}

func GetGroupInvitesByUserId(id int) ([]GroupInvite, error) {
	return QueryItems[GroupInvite]("SELECT user_id, group_id, firstname, lastname FROM group_relationships A INNER JOIN users B ON A.user_id = B.id WHERE A.status = 0 AND A.user_id = ?;", func(rows *sql.Rows, groupRelation *GroupInvite) error {
		return rows.Scan(&groupRelation.UserId, &groupRelation.GroupId, &groupRelation.UserFirstname, &groupRelation.UserLastname)
	}, id)
}
func GetGroupRelationshipsByUserId(userId int) ([]GroupRelationship, error) {
	return QueryItems[GroupRelationship]("SELECT A.id, group_id, user_id, status, B.name FROM group_relationships as A JOIN groups as B ON A.group_id = B.id WHERE user_id = ?", func(rows *sql.Rows, groupRelation *GroupRelationship) error {
		return rows.Scan(
			&groupRelation.Id, &groupRelation.GroupId, &groupRelation.UserId, &groupRelation.Status, &groupRelation.GroupName)

	}, userId)
}
func GetGroupRelationshipsById(id int) ([]GroupRelationship, error) {
	return QueryItems[GroupRelationship]("SELECT * FROM group_relationships WHERE group_id = ?", func(rows *sql.Rows, groupRelation *GroupRelationship) error {
		return rows.Scan(
			&groupRelation.Id, &groupRelation.GroupId, &groupRelation.UserId, &groupRelation.Status)
	}, id)
}

func GetGroupRelationshipByUserID(id int) (*GroupRelationship, error) {
	return QueryItem[GroupRelationship]("SELECT * FROM group_relationships WHERE user_id = ? ", func(row *sql.Row, groupRelation *GroupRelationship) error {
		return row.Scan(
			&groupRelation.Id, &groupRelation.GroupId, &groupRelation.UserId, &groupRelation.Status)
	}, id)
}
func GetGroupRelationshipByUserAndGroupID(id int, groupId int) (*GroupRelationship, error) {
	return QueryItem[GroupRelationship]("SELECT * FROM group_relationships WHERE user_id = ? AND group_id = ?", func(row *sql.Row, groupRelation *GroupRelationship) error {
		return row.Scan(
			&groupRelation.Id, &groupRelation.GroupId, &groupRelation.UserId, &groupRelation.Status)
	}, id, groupId)
}

// CreateEvent CRUD operations for Event
func CreateEvent(event Event) (int64, error) {
	return PrepareAndExecute("INSERT INTO events(Title, Description, Timestamp, groupId) VALUES (?, ?, ?, ?)", event.Title, event.Description, event.Timestamp, event.GroupId)
}

func GetAllEventsByGroupId(id int) ([]Event, error) {
	return QueryItems[Event]("SELECT * FROM events WHERE groupId = ?", func(rows *sql.Rows, event *Event) error {
		return rows.Scan(
			&event.Id, &event.Title, &event.Description, &event.Timestamp, &event.GroupId)
	}, id)
}

func GetAllEventRelationsById(id int) ([]EventRelationship, error) {
	return QueryItems[EventRelationship]("SELECT A.id, status, userId, A.eventId, B.firstname, B.lastname FROM event_relationships as A JOIN users as B ON A.userId = B.id WHERE A.eventId = ?", func(rows *sql.Rows, event *EventRelationship) error {
		return rows.Scan(
			&event.Id, &event.Status, &event.UserId, &event.EventId, &event.Firstname, &event.Lastname)

	}, id)
}

func GetEventByTitle(title string) (*Event, error) {
	var event Event
	return QueryItem[Event]("SELECT * FROM events WHERE title = ?", func(row *sql.Row, item *Event) error {
		return row.Scan(
			&event.Id, &event.Title, &event.Description, &event.Timestamp)
	}, title)
}

// CreateEventRelationship CRUD operations for EventRelationship
func CreateEventRelationship(eventRelation EventRelationship) (int64, error) {
	return PrepareAndExecute("INSERT INTO event_relationships(Status, userId, eventId) VALUES (?, ?, ?)", eventRelation.Status, eventRelation.UserId, eventRelation.EventId)
}

func UpdateEventRelationship(eventId int, status int, userId int) error {
	return Execute("UPDATE event_relationships SET Status=? WHERE eventId=? AND userId = ?",
		status, eventId, userId)
}

func UpdateRelationship(accepted int, followerId, followingId int) error {
	return Execute("UPDATE relationships SET accepted = ? WHERE follower_id = ? AND following_id = ?", accepted, followerId, followingId)
}

// Apply migrations and open the database
func openDatabase() *sql.DB {
	db, err := sql.Open("sqlite3", "database/database.db")
	driver, err := sqlite.WithInstance(db, &sqlite.Config{})
	if err != nil {
		fmt.Println(err.Error())
		return nil
	}
	m, err := migrate.NewWithDatabaseInstance("file://./database/migrations", "ql", driver)
	if err != nil {
		fmt.Println(err.Error())
	}
	err = m.Up()
	if err != nil {
		fmt.Println(err.Error())
	}
	fmt.Println("Database is currently nil?", db == nil)
	return db
}

func CreateWebsocketSession(session Session) (int64, error) {
	return PrepareAndExecute("INSERT INTO websocket_sessions (session_id, user_id, expiry_timestamp) VALUES (?,?,?)", session.SessionId, session.UserId, session.ExpiryTimestamp)
}

func GetWebsocketSession(sessionId string) (*Session, error) {
	return QueryItem[Session]("SELECT * FROM websocket_sessions WHERE session_id = ?", func(row *sql.Row, session *Session) error {
		return row.Scan(&session.SessionId, &session.UserId, &session.ExpiryTimestamp)
	}, sessionId)
}

func CreateNotification(notification Notification) (int64, error) {
	return PrepareAndExecute("INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)", notification.UserId, notification.Message, notification.Link)
}

func DeleteNotification(id int) (int64, error) {
	return PrepareAndExecute("DELETE FROM notifications WHERE id = ?", id)
}

func GetNotificationsByUserId(userId int) ([]Notification, error) {
	return QueryItems[Notification]("SELECT * FROM notifications WHERE userId = ?", func(rows *sql.Rows, notification *Notification) error {
		return rows.Scan(&notification.Id, &notification.UserId, &notification.Message, &notification.Link)
	}, userId)
}

func GetAllGroupMembers(groupId int) ([]User, error) {
	return QueryItems[User]("SELECT B.* FROM group_relationships AS A INNER JOIN users AS B ON A.user_id = B.id WHERE status = 1 AND group_id = ?", func(rows *sql.Rows, user *User) error {
		return rows.Scan(&user.Id, &user.Nickname, &user.Email, &user.Password, &user.Firstname, &user.Lastname, &user.Dob.Day, &user.Dob.Month, &user.Dob.Year, &user.AboutMe, &user.AvatarPath, &user.IsPrivate)
	}, groupId)
}

var Db = openDatabase()
