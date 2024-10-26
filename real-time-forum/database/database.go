package database

import (
	"database/sql"
	"fmt"
	"log"
	"real-time-forum/structs"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID              int
	Nickname        string
	Age             int
	Gender          string
	FirstName       string
	LastName        string
	Email           string
	Password        string
	LastMessageDate time.Time
}

type LoggedInUser struct {
	ID        int    `json:"id"`
	Nickname  string `json:"nickname"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	IsOnline  bool   `json:"isOnline"`
}

type ForumPost struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	Title         string    `json:"title"`
	Content       string    `json:"content"`
	Category      string    `json:"category"`
	CreatedAt     time.Time `json:"created_at"`
	FormattedTime string    `json:"formattedTime"`
	Nickname      string    `json:"nickname"`
}

type ForumComment struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	PostID        int       `json:"post_id"`
	Nickname      string    `json:"nickname"`
	Content       string    `json:"content"`
	CreatedAt     time.Time `json:"created_at"`
	FormattedTime string    `json:"formattedTime"`
}

type PrivateMessage struct {
	ID        int       `json:"id"`
	Sender    int       `json:"sender_id"`
	Receiver  int       `json:"receiver_id"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

type PrivateMessageDisplay struct {
	PrivateMessage
	SenderNickname   string `json:"senderNickname"`
	ReceiverNickname string `json:"receiverNickname"`
}

var DB *sql.DB

func createUsersTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			ID					INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
			nickname			TEXT,
			age					INTEGER,
			gender				TEXT,
			firstname			TEXT,
			lastname			TEXT,
			email 				TEXT,
			password			TEXT,
			last_message_date   TIMESTAMP DEFAULT NULL
		)
	`)
	return err
}

func createSessionsTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS sessions (
			ID              INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
			user_id         INTEGER,
			session_token   TEXT,
			expiration      TIMESTAMP
		)
	`)
	return err
}

func createPostsTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS posts (
			ID          INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
			user_id     INTEGER,
			category    TEXT,
			title		TEXT,
			content     TEXT,
			created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(user_id) REFERENCES users(ID)
		)
	`)
	return err
}

func createCommentsTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS comments (
			ID          INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
			user_id     INTEGER,
			post_id     INTEGER,
			content     TEXT,
			created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	return err
}

func createMessagesTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS messages (
			ID			INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
			sender_id   INTEGER,
			receiver_id INTEGER,
			content 	STRING,
			timestamp 	TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	return err
}

func InitDB() {
	var err error
	DB, err = sql.Open("sqlite3", "./database/data.db")
	if err != nil {
		log.Fatal(err)
	}

	err = createUsersTable(DB)
	if err != nil {
		log.Fatal(err)
	}

	err = createSessionsTable(DB)
	if err != nil {
		log.Fatal(err)
	}
	err = createPostsTable(DB)
	if err != nil {
		log.Fatal(err)
	}

	err = createCommentsTable(DB)
	if err != nil {
		log.Fatal(err)
	}

	err = createMessagesTable(DB)
	if err != nil {
		log.Fatal(err)
	}
}

func InsertUser(nickname, age, gender, firstName, lastName, email string, hashedPassword []byte) error {
	stmt, err := DB.Prepare(`
		INSERT INTO users (nickname, age, gender, firstname, lastname, email, password, last_message_date)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(nickname, age, gender, firstName, lastName, email, hashedPassword, time.Now())
	if err != nil {
		return err
	}

	return nil
}

func InsertPost(postDto structs.PostDto) error {
	stmt, err := DB.Prepare(`
		INSERT INTO posts (user_id, category, title, content)
		VALUES (?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(postDto.UserID, postDto.Category, postDto.Title, postDto.Content)
	if err != nil {
		return err
	}

	return nil
}

func InsertComment(commentDto structs.CommentDto) error {
	stmt, err := DB.Prepare(`
		INSERT INTO comments (user_id, post_id, content, created_at)
		VALUES (?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(commentDto.UserID, commentDto.PostID, commentDto.Content, commentDto.CreatedAt)
	if err != nil {
		return err
	}

	return nil
}

func InsertPrivateMessage(sender_id, receiver_id int, content string, timestamp time.Time) error {
	stmt, err := DB.Prepare(`
        INSERT INTO messages (sender_id, receiver_id, content, timestamp)
        VALUES (?, ?, ?, ?)
    `)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(sender_id, receiver_id, content, timestamp)
	if err != nil {
		return err
	}

	return nil
}

func formatTime(t time.Time) string {
	return t.Format("02.01.06 15:04:05")
}

func CheckEmailOrNicknameExists(email, nickname string) (bool, error) {

	var count int
	err := DB.QueryRow(`
        SELECT COUNT(*) FROM users WHERE email = ? OR nickname = ?
    `, email, nickname).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func GetUserByEmail(email string) (*User, error) {
	var user User
	err := DB.QueryRow(`
		SELECT * FROM users WHERE email = ?
	`, email).Scan(&user.ID, &user.Nickname, &user.Age, &user.Gender, &user.FirstName, &user.LastName, &user.Email, &user.Password, &user.LastMessageDate)
	if err == sql.ErrNoRows {
		fmt.Println("User not found for email:", email) // Debug
		return nil, nil
	} else if err != nil {
		fmt.Println("Error querying database:", err) // Debug
		return nil, err
	}

	return &user, nil
}

func GetUserByID(userID int) (*User, error) {
	var user User
	err := DB.QueryRow(`
		SELECT * FROM users WHERE ID = ?
	`, userID).Scan(&user.ID, &user.Nickname, &user.Age, &user.Gender, &user.FirstName, &user.LastName, &user.Email, &user.Password, &user.LastMessageDate)
	if err == sql.ErrNoRows {
		fmt.Println("User not found for ID:", userID) // Debug
		return nil, nil
	} else if err != nil {
		fmt.Println("Error querying database:", err) // Debug
		return nil, err
	}

	return &user, nil
}

func GetUserIdBySessionToken(sessionToken string) (int, error) {
	var userId int
	err := DB.QueryRow(`
		SELECT user_id FROM sessions WHERE session_token = ?
	`, sessionToken).Scan(&userId)
	if err != nil {
		return 0, err
	}

	return userId, nil
}

func GetAllUsersAndOnlineStatuses() ([]LoggedInUser, error) {
	rows, err := DB.Query(`SELECT 
		u.id,
        u.nickname, 
        u.firstname, 
        u.lastname, 
        CASE 
            WHEN COALESCE(s.expiration, '1970-01-01 00:00:00') <= CURRENT_TIMESTAMP THEN 0 
            ELSE 1 
        END AS is_online
    	FROM users u 
    	LEFT JOIN sessions s 
    	ON u.ID = s.user_id;
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var loggedInUsers []LoggedInUser
	for rows.Next() {
		var lu LoggedInUser
		var isOnlineInt int

		if err := rows.Scan(&lu.ID, &lu.Nickname, &lu.FirstName, &lu.LastName, &isOnlineInt); err != nil {
			return nil, err
		}

		lu.IsOnline = isOnlineInt == 1

		loggedInUsers = append(loggedInUsers, lu)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return loggedInUsers, nil
}

func ComparePasswords(hashedPassword []byte, plainPassword []byte) error {
	return bcrypt.CompareHashAndPassword(hashedPassword, plainPassword)
}

func InsertSessionToken(userID int, sessionToken string, expiration time.Time) error {
	stmt, err := DB.Prepare(`
		INSERT INTO sessions (user_id, session_token, expiration)
		VALUES (?, ?, ?)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(userID, sessionToken, expiration)
	if err != nil {
		return err
	}

	return nil
}

func DeleteSessionToken(sessionToken string) error {
	_, err := DB.Exec(`DELETE FROM sessions WHERE session_token = ?`, sessionToken)
	if err != nil {
		return err
	}

	return nil
}

func DeleteUserFromSessions(userId int) error {
	_, err := DB.Exec(`DELETE FROM sessions WHERE user_id = ?`, userId)
	if err != nil {
		return err
	}

	return nil
}

func GetForumPosts() ([]ForumPost, error) {
	var posts []ForumPost

	rows, err := DB.Query(`SELECT id, title, content, created_at FROM posts`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post ForumPost
		err := rows.Scan(&post.ID, &post.Title, &post.Content, &post.CreatedAt)
		if err != nil {
			return nil, err
		}

		post.FormattedTime = formatTime(post.CreatedAt)
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

func GetCommentsByPostId(postID int) ([]ForumComment, error) {
	var comments []ForumComment

	rows, err := DB.Query(`
		SELECT comments.*, users.nickname 
		FROM comments 
		JOIN users ON comments.user_id = users.ID 
		WHERE comments.post_id = ?
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var comment ForumComment
		err := rows.Scan(&comment.ID, &comment.UserID, &comment.PostID, &comment.Content, &comment.CreatedAt, &comment.Nickname)
		if err != nil {
			return nil, err
		}
		comment.FormattedTime = formatTime(comment.CreatedAt)

		comments = append(comments, comment)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return comments, nil
}

func GetPostById(postID int) (ForumPost, error) {
	var post ForumPost

	err := DB.QueryRow(`
		SELECT posts.*, users.nickname 
		FROM posts 
		JOIN users ON posts.user_id = users.ID 
		WHERE posts.id = ?
    `, postID).Scan(&post.ID, &post.UserID, &post.Category, &post.Title, &post.Content, &post.CreatedAt, &post.Nickname)

	post.FormattedTime = formatTime(post.CreatedAt)

	if err != nil && err != sql.ErrNoRows {
		return ForumPost{}, err
	}

	return post, nil
}

func GetMessagesForUser(userID, otherUserID int) ([]PrivateMessageDisplay, error) {
	rows, err := DB.Query(`
        SELECT id, sender_id, receiver_id, content, timestamp 
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    `, userID, otherUserID, otherUserID, userID)
	if err != nil {
		log.Println("Error querying the database:", err)
		return nil, err
	}
	defer rows.Close()

	var messages []PrivateMessageDisplay
	for rows.Next() {
		var message PrivateMessage
		err := rows.Scan(&message.ID, &message.Sender, &message.Receiver, &message.Content, &message.Timestamp)
		if err != nil {
			log.Println("Error scanning rows:", err)
			return nil, err
		}

		senderUser, err := GetUserByID(message.Sender)
		if err != nil || senderUser == nil {
			log.Println("Failed to fetch sender user details:", err)
			return nil, fmt.Errorf("failed to fetch sender user details")
		}

		receiverUser, err := GetUserByID(message.Receiver)
		if err != nil || receiverUser == nil {
			log.Println("Failed to fetch receiver user details:", err)
			return nil, fmt.Errorf("failed to fetch receiver user details")
		}

		messageWithUsernames := PrivateMessageDisplay{
			PrivateMessage: PrivateMessage{
				ID:        message.ID,
				Sender:    message.Sender,
				Receiver:  message.Receiver,
				Content:   message.Content,
				Timestamp: message.Timestamp,
			},
			SenderNickname:   senderUser.Nickname,
			ReceiverNickname: receiverUser.Nickname,
		}

		messages = append(messages, messageWithUsernames)
	}

	if err := rows.Err(); err != nil {
		log.Println("Error iterating over rows:", err)
		return nil, err
	}

	return messages, nil
}
