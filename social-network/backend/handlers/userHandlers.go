package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"main/database"
	"main/types"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"golang.org/x/crypto/bcrypt"
)

func GetUserFromCookie(r *http.Request) *database.User {
	cookie, err := r.Cookie("session")
	if err == nil {
		session, _ := database.GetSessionById(cookie.Value)
		if session == nil { // No session was found
			return nil
		}
		if session.UserId == 0 {
			return nil
		}
		user, err := database.GetUserByID(session.UserId)
		if err != nil {
			fmt.Println(err)
		}
		return user
	}
	return nil
}
func GenerateSession(account database.User) *http.Cookie {
	sessionId, _ := uuid.NewV4()
	expiry := time.Now().Add(96 * time.Hour)
	expiryTimestamp := int(expiry.Unix())
	cookie := &http.Cookie{
		Name:     "session",
		Value:    sessionId.String(),
		Expires:  expiry,
		HttpOnly: true,
		Secure:   true,
	}
	err := database.RemoveSessionByUserId(account.Id)
	if err != nil {
		fmt.Println(err.Error())
		return nil
	}
	var session database.Session
	session.UserId = account.Id
	session.ExpiryTimestamp = expiryTimestamp
	session.SessionId = sessionId.String()
	fmt.Println("Generate new session: ", cookie.String())
	err = database.InsertSession(session)
	if err != nil {
		fmt.Println(err.Error())
		return nil
	}
	return cookie
}

// HashPassword Hash the password and return hashed version
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 4)
	return string(bytes), err
}

// CheckPasswordHash Compare hashed password and plaintext password
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		BadRequest(w, "Only POST allowed")
		return
	}
	var request database.User
	err := decodeUserBody(r, &request)
	if err != nil {
		ServerError(w, err.Error())
		return
	}
	fmt.Println("Nickname: ", request.Nickname)
	noNick := true
	if len(request.Nickname) > 0 {
		noNick = false
	}
	lowercaseNickname := strings.ToLower(request.Nickname)
	request.Nickname = lowercaseNickname
	userByNickname, err := database.GetUserByUsername(request.Nickname)
	lowercaseEmail := strings.ToLower(request.Email)
	request.Email = lowercaseEmail
	userByEmail, err := database.GetUserByUsername(request.Email)
	if userByEmail == nil {
		if !noNick {
			if userByNickname != nil {
				Unauthorized(w, "Such user already exists")
				return
			}
		}
		//means no user with same username/email exists
		hashedPassword, _ := HashPassword(request.Password)
		request.Password = hashedPassword
		id, err := database.CreateUser(request)
		request.Id = int(id)
		if err != nil {
			ServerError(w, "Server error")
			return
		} else {
			session := GenerateSession(request)
			if session == nil {
				ServerError(w, "Server error")
				return
			}
			http.SetCookie(w, session) //Set the HttpOnly cookie in here
			//Send new notification to registered user
			err := CreateNotification(int(id), "/", "Welcome to Social Network! You can now create posts, join groups and more.")
			if err != nil {
				ServerError(w, err.Error())
				return
			}
			fmt.Println("cussess")
			Success(w, nil)
			return
		}
	}
	Unauthorized(w, "Such user already exists")
}
func decodeUserBody(r *http.Request, target *database.User) error {
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		return err
	}
	file, handler, err := r.FormFile("my_image")
	if err != nil {
		if err.Error() != "http: no such file" {
			return err
		}
		//no image supplied, continue
		err = nil
	} else {
		defer func(file multipart.File) {
			err := file.Close()
			if err != nil {
				return
			}
		}(file)
		handler.Filename = randomBase16String(15) + handler.Filename
		f, err := os.OpenFile("./images/"+handler.Filename, os.O_WRONLY|os.O_CREATE, 0666)
		if err != nil {
			return err
		}
		defer func(f *os.File) {
			err = f.Close()
			if err != nil {
				return
			}
		}(f)
		_, err = io.Copy(f, file)
		if err != nil {
			return err
		}
		target.AvatarPath = "/images/" + handler.Filename
	}
	target.Nickname = r.Form.Get("nickname")
	target.Email = r.Form.Get("email")
	target.Password = r.Form.Get("password")
	target.Firstname = r.Form.Get("firstname")
	target.Lastname = r.Form.Get("lastname")
	target.Dob.Day, _ = strconv.Atoi(strings.Split(r.Form.Get("dob"), "-")[2])
	target.Dob.Month, _ = strconv.Atoi(strings.Split(r.Form.Get("dob"), "-")[1])
	target.Dob.Year, _ = strconv.Atoi(strings.Split(r.Form.Get("dob"), "-")[0])
	if r.Form.Get("aboutMe") == "" {
		target.AboutMe = "Not provided"
	} else {
		target.AboutMe = r.Form.Get("aboutMe")
	}
	target.IsPrivate, _ = strconv.Atoi(r.Form.Get("isPrivate"))
	return err
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		BadRequest(w, "Bad request")
		return
	}
	authedUser := GetUserFromCookie(r)
	if authedUser == nil {
		Unauthorized(w, "")
		return
	}
	err := database.RemoveSessionByUserId(authedUser.Id)
	if err != nil {
		ServerError(w, err.Error())
		return
	}
	cookie := http.Cookie{Name: "session", Expires: time.Now(), Secure: true}
	http.SetCookie(w, &cookie)
	w.WriteHeader(204)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		BadRequest(w, "Only POST allowed")
		return
	}
	var request types.LoginRequest
	err := decodeBody(r, &request)
	if err != nil {
		ServerError(w, err.Error())
		return
	}
	user, _ := database.GetUserByUsername(request.Username)
	if user != nil {
		//now check if passwords match
		if CheckPasswordHash(request.Password, user.Password) {
			session := GenerateSession(*user)
			if session == nil {
				ServerError(w, "Server error")
				return
			}
			http.SetCookie(w, session) //Set the HttpOnly cookie in here
			Success(w, nil)
			return
		}
		Unauthorized(w, "Incorrect credentials")
		return
	}
	Unauthorized(w, "User not found")
}
func decodeBody(r *http.Request, target interface{}) error {
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(target)
	return err
}
func randomBase16String(l int) string {
	buff := make([]byte, int(math.Ceil(float64(l)/2)))
	_, err := rand.Read(buff)
	if err != nil {
		return ""
	}
	str := hex.EncodeToString(buff)
	return str[:l]
}
func decodePostBody(r *http.Request, target *database.Post) error {
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		return err
	}
	file, handler, err := r.FormFile("my_image")
	if err != nil {
		if err.Error() != "http: no such file" {
			return err
		}
		//no image supplied, continue
		err = nil
	} else {
		defer func(file multipart.File) {
			err := file.Close()
			if err != nil {
				return
			}
		}(file)
		handler.Filename = randomBase16String(15) + handler.Filename
		f, err := os.OpenFile("./images/"+handler.Filename, os.O_WRONLY|os.O_CREATE, 0666)
		if err != nil {
			return err
		}
		defer func(f *os.File) {
			err = f.Close()
			if err != nil {
				return
			}
		}(f)
		_, err = io.Copy(f, file)
		if err != nil {
			return err
		}
		target.Image = "/images/" + handler.Filename
	}

	//read form
	if r.Form.Get("group") == "" {
		target.GroupId = 0
	} else {
		target.GroupId, _ = strconv.Atoi(r.Form.Get("group"))
	}
	if r.Form.Get("allowedViewers") != "" {
		target.AllowedViewers = r.Form.Get("allowedViewers")
	}
	target.Title = r.Form.Get("title")
	target.Content = r.Form.Get("content")
	target.Privacy, _ = strconv.Atoi(r.Form.Get("privacy"))
	return err
}

func decodeCommentBody(r *http.Request, target *database.Comment) error {
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		return err
	}
	file, handler, err := r.FormFile("my_image")
	if err != nil {
		if err.Error() != "http: no such file" {
			return err
		}
		//no image supplied, continue
		err = nil
	} else {
		defer func(file multipart.File) {
			err := file.Close()
			if err != nil {
				return
			}
		}(file)
		handler.Filename = randomBase16String(15) + handler.Filename
		f, err := os.OpenFile("./images/"+handler.Filename, os.O_WRONLY|os.O_CREATE, 0666)
		if err != nil {
			return err
		}
		defer func(f *os.File) {
			err = f.Close()
			if err != nil {
				return
			}
		}(f)
		_, err = io.Copy(f, file)
		if err != nil {
			return err
		}
		target.ImagePath = "/images/" + handler.Filename
	}
	//read form
	if r.Form.Get("postId") == "" {
		target.PostId = 0
	} else {
		target.PostId, _ = strconv.Atoi(r.Form.Get("postId"))
	}
	target.Content = r.Form.Get("content")
	target.Privacy = 1
	target.Timestamp = int(time.Now().Unix())
	return err
}

func AuthedProfileHandler(w http.ResponseWriter, r *http.Request) {
	authedUser := GetUserFromCookie(r)
	if authedUser == nil {
		Unauthorized(w, "")
		return
	}
	Success(w, authedUser)
}

func ProfilePrivacyHandler(w http.ResponseWriter, r *http.Request) {
	authedUser := GetUserFromCookie(r)
	if authedUser == nil {
		Unauthorized(w, "")
		return
	}
	queryParams := r.URL.Query()
	// 1 = private, 0 = public
	newStatus, _ := strconv.Atoi(queryParams.Get("status"))
	_, err := database.Db.Exec("UPDATE users SET is_private = ? WHERE id = ?", newStatus, authedUser.Id)
	if err != nil {
		fmt.Println(err.Error())
		ServerError(w, err.Error())
		return
	}
	CustomResponse(w, 204, "")
}

// ProfileHandler Handles getting the profile data
func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	authedUser := GetUserFromCookie(r)
	if authedUser == nil {
		Unauthorized(w, "")
		return
	}
	queryParams := r.URL.Query()
	userId, _ := strconv.Atoi(queryParams.Get("id"))
	user, err := database.GetUserByID(userId)
	if err != nil {
		ServerError(w, err.Error())
		fmt.Println(err.Error())
		return
	}
	if user == nil {
		NotFound(w, "User not found")
		return
	}
	//Handle the privacy part in the frontend server component.
	//if user.IsPrivate == 1 {
	//CustomResponse(w, 204, "User profile is private")
	//return
	//}
	user.Password = "" //remove the password

	//get the posts made by user
	posts, err := database.GetAllPostsByUserId(userId)
	if err != nil {
		fmt.Println("Error with getting all posts on userhandler: ", err.Error())
		ServerError(w, err.Error())
		return
	}
	user.Posts = posts
	user.FollowerIds = make([]int, 0)
	user.FollowingIds = make([]int, 0)
	//get the followers
	//get the followings
	Success(w, user)
}
func GetAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	loggedUser := GetUserFromCookie(r)
	if loggedUser == nil {
		Unauthorized(w, "")
		return
	}
	allUsers, err := database.GetAllUsers()
	if err != nil {
		ServerError(w, err.Error())
		return
	}
	newArr := make([]database.User, 0)
	//removes the password for all users
	for _, user := range allUsers {
		if user.Id != loggedUser.Id {
			user.Password = ""
			newArr = append(newArr, user)
		}
	}
	Success(w, newArr)
}
