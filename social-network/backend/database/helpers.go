package database

import (
	"database/sql"
	"fmt"
	"log"
)

// Prepare query with bindings and execute
func PrepareAndExecute(query string, args ...any) (int64, error) {
	stmt, err := Db.Prepare(query)
	if err != nil {
		return 0, err
	}
	defer func(stmt *sql.Stmt) {
		err := stmt.Close()
		if err != nil {
			log.Fatal("Error in PrepareAndExecute()")
		}
	}(stmt)
	result, err := stmt.Exec(args...)
	if err != nil {
		return 0, err
	}

	id, _ := result.LastInsertId()
	return id, nil
}

// Query a single item
func QueryItem[T any](query string, scanFunc func(row *sql.Row, item *T) error, args ...any) (*T, error) {
	var item T
	row := Db.QueryRow(query, args...)
	err := scanFunc(row, &item)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// Query multiple items
func QueryItems[T any](query string, scanFunc func(rows *sql.Rows, item *T) error, queryArgs ...any) ([]T, error) {
	var items []T
	rows, err := Db.Query(query, queryArgs...)
	if err != nil {
		fmt.Println(err.Error())
	}
	for rows.Next() {
		var item T
		err = scanFunc(rows, &item)
		if err != nil {
			continue
		}
		items = append(items, item)
	}
	return items, nil
}

func Execute(query string, args ...any) error {
	_, err := Db.Exec(query, args...)
	return err
}
