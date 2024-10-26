package handlers

import (
	"time"

	"github.com/gofrs/uuid"
)

type Session struct {
	ID        string
	UserID    int
	Token     string
	ExpiresAt time.Time
}

var Sessions = make(map[string]Session)

func createSession(userID int) Session {
	token, err := uuid.NewV4()
	if err != nil {
		panic(err)
	}

	sessionID := token.String()

	session := Session{
		ID:        sessionID,
		UserID:    userID,
		Token:     token.String(),
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	Sessions[session.Token] = session

	return session
}
