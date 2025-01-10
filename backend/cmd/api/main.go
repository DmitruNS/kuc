// backend/cmd/api/main.go

package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"kuckuc/internal/handlers"
	"kuckuc/internal/middleware"
	"kuckuc/internal/services"
)

func main() {
	// Database connection
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		dbPort,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize services
	authService := services.NewAuthService(db)
	propertyService := services.NewPropertyService(db)
	fileService := services.NewFileService(os.Getenv("UPLOAD_DIR"))
	exportService := services.NewExportService(propertyService, fileService)

	// Initialize handlers
	authHandlers := handlers.NewAuthHandlers(authService)
	propertyHandlers := handlers.NewPropertyHandlers(propertyService, exportService)
	fileHandlers := handlers.NewFileHandlers(fileService, propertyService)

	// Initialize router
	router := gin.Default()
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"version": "1.0.0",
		})
	})
	router.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("REQUEST: %v | %s | %s | %s | %s\n",
			param.TimeStamp.Format(time.RFC3339),
			param.Method,
			param.Path,
			param.Request.URL.RawQuery,
			param.ClientIP,
		)
	}))

	// Serve static files
	router.Static("/uploads", "./uploads")

	// CORS middleware
	allowedOrigins := strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")
	if len(allowedOrigins) == 0 {
		allowedOrigins = []string{"*"}
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Setup routes
	api := router.Group("/api")
	{
		// Public routes
		api.GET("/properties", propertyHandlers.GetProperties)
		api.GET("/properties/:id", propertyHandlers.GetProperty)

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandlers.Login)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthRequired(authService))
		{
			protected.GET("/auth/me", authHandlers.GetCurrentUser)

			// Property routes
			protected.POST("/properties", propertyHandlers.CreateProperty)
			protected.PUT("/properties/:id", propertyHandlers.UpdateProperty)
			protected.POST("/properties/export", propertyHandlers.ExportProperties)
			protected.PUT("/properties/:id/status", propertyHandlers.UpdatePropertyStatus)

			// File routes
			protected.POST("/properties/:id/files", fileHandlers.UploadFile)
			protected.DELETE("/properties/:id/files/:fileId", fileHandlers.DeleteFile)
			protected.PUT("/properties/:id/files/:fileId/visibility", fileHandlers.UpdateFileVisibility)
		}
	}

	// Server configuration
	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + serverPort,
		Handler: router,
	}

	// Graceful shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to initialize server: %v\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}
