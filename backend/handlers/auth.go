//backend/handlers/auth.go
package handlers

import (
	"github.com/labstack/echo/v4"
	"net/http"
)

func Login(c echo.Context) error {
	username := c.FormValue("username")
	password := c.FormValue("password")

	// Простая авторизация
	if username == "user1" && password == "1234" {
		return c.JSON(http.StatusOK, map[string]string{
			"message": "Авторизация успешна",
			"token":   "simple_token", // Заглушка токена
		})
	}

	return c.JSON(http.StatusUnauthorized, map[string]string{
		"message": "Неверные учетные данные",
	})
}

func Dashboard(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{
		"message": "Панель агента",
	})
}
