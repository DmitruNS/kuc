// backend/cmd/api/main.go

package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"kuckuc/internal/handlers"
	"kuckuc/internal/middleware"
	"kuckuc/internal/services"
)

func main() {
	// Load .env file if exists
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found or error loading it: %v", err)
	}

	// Database connection
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
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

	// Serve static files
	router.Static("/uploads", "./uploads")

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
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
	srv := &http.Server{
		Addr:    ":" + os.Getenv("SERVER_PORT"),
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
