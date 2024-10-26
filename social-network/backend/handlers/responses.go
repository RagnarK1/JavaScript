package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type JsonResponse struct {
	Message string      `json:"message"`
	Body    interface{} `json:"body"`
}

// Success Sends json back to server
func Success(w http.ResponseWriter, body interface{}) {
	w.WriteHeader(200)
	var response JsonResponse
	response.Body = body
	response.Message = "Success"
	bytes, err := json.Marshal(response)
	if err != nil {
		w.WriteHeader(500)
		return
	}
	_, err = fmt.Fprint(w, string(bytes))
	if err != nil {
		fmt.Println(err)
		return
	}
}

func Unauthorized(w http.ResponseWriter, message string) {
	w.WriteHeader(403)
	var response JsonResponse
	response.Message = message
	bytes, err := json.Marshal(response)
	if err != nil {
		fmt.Println(err)
		return
	}
	_, err = fmt.Fprint(w, string(bytes))
	if err != nil {
		return
	}
}

func BadRequest(w http.ResponseWriter, message string) {
	w.WriteHeader(http.StatusBadRequest)
	var response JsonResponse
	response.Message = message
	bytes, err := json.Marshal(response)
	if err != nil {
		fmt.Println(err)
		return
	}
	_, err = fmt.Fprint(w, string(bytes))
	if err != nil {
		return
	}
}
func ServerError(w http.ResponseWriter, message string) {
	w.WriteHeader(500)
	var response JsonResponse
	response.Message = message
	bytes, err := json.Marshal(response)
	if err != nil {
		fmt.Println(err)
		return
	}
	_, err = fmt.Fprint(w, string(bytes))
	if err != nil {
		return
	}
}
func NotFound(w http.ResponseWriter, message string) {
	w.WriteHeader(404)
	var response JsonResponse
	response.Message = message
	bytes, err := json.Marshal(response)
	if err != nil {
		fmt.Println(err)
		return
	}
	_, err = fmt.Fprint(w, string(bytes))
	if err != nil {
		return
	}
}

func CustomResponse(w http.ResponseWriter, code int, message string) {
	w.WriteHeader(code)
	var response JsonResponse
	response.Message = message
	bytes, err := json.Marshal(response)
	if err != nil {
		fmt.Println(err)
		return
	}
	_, err = fmt.Fprint(w, string(bytes))
	if err != nil {
		return
	}
}
