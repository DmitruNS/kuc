// backend/cmd/tools/generate_hash.go

package main

import (
    "fmt"
    "golang.org/x/crypto/bcrypt"
)

func main() {
    password := "demo123"
    hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        fmt.Printf("Error generating hash: %v\n", err)
        return
    }
    fmt.Printf("Password hash for '%s': %s\n", password, string(hash))
}