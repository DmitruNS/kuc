// backend/internal/handlers/property.go

package handlers

import (
    "net/http"
    "strconv"
	"fmt"
	"log"
	"time"
	"io"
    "github.com/gin-gonic/gin"
    "kuckuc/internal/services"
    "kuckuc/internal/models"
)

type PropertyHandlers struct {
    propertyService *services.PropertyService
    exportService   *services.ExportService
}

func NewPropertyHandlers(propertyService *services.PropertyService, exportService *services.ExportService) *PropertyHandlers {
    return &PropertyHandlers{
        propertyService: propertyService,
        exportService:   exportService,
    }
}

// GetProperties godoc
func (h *PropertyHandlers) GetProperties(c *gin.Context) {
    var filter services.PropertyFilter
    if err := c.ShouldBindQuery(&filter); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    language := c.DefaultQuery("language", "sr")
    if language != "sr" && language != "en" && language != "ru" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid language"})
        return
    }

    properties, err := h.propertyService.ListProperties(filter, language)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, properties)
}

// GetProperty godoc
func (h *PropertyHandlers) GetProperty(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property id"})
        return
    }

    language := c.DefaultQuery("language", "sr")
    if language != "sr" && language != "en" && language != "ru" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid language"})
        return
    }

    property, err := h.propertyService.GetProperty(uint(id), language)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
        return
    }

    c.JSON(http.StatusOK, property)
}

// CreateProperty godoc
func (h *PropertyHandlers) CreateProperty(c *gin.Context) {
    var property models.Property
    if err := c.ShouldBindJSON(&property); err != nil {
        // Добавляем детальное логирование
        log.Printf("Error binding JSON: %v", err)
        // Логируем тело запроса
        body, _ := io.ReadAll(c.Request.Body)
        log.Printf("Request body: %s", string(body))
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    userID := c.GetUint("userID")
    log.Printf("Creating property with data: %+v", property)
    
    if err := h.propertyService.CreateProperty(&property, userID); err != nil {
        log.Printf("Error creating property: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, property)
}


// UpdateProperty godoc
func (h *PropertyHandlers) UpdateProperty(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property id"})
        return
    }

    var property models.Property
    if err := c.ShouldBindJSON(&property); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    property.ID = uint(id)
    userID := c.GetUint("userID")

    if err := h.propertyService.UpdateProperty(&property, userID); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, property)
}

// UpdatePropertyStatus godoc
func (h *PropertyHandlers) UpdatePropertyStatus(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property id"})
        return
    }

    var request struct {
        IsActive bool `json:"is_active"`
    }

    if err := c.ShouldBindJSON(&request); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    userID := c.GetUint("userID")

    if err := h.propertyService.UpdatePropertyStatus(uint(id), request.IsActive, userID); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

// ExportProperties godoc
func (h *PropertyHandlers) ExportProperties(c *gin.Context) {
    var filter services.PropertyFilter
    if err := c.ShouldBindQuery(&filter); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    language := c.DefaultQuery("language", "sr")
    if language != "sr" && language != "en" && language != "ru" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid language"})
        return
    }

    data, err := h.exportService.ExportPropertiesToExcel(filter, language)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    filename := fmt.Sprintf("properties_export_%s.xlsx", time.Now().Format("2006-01-02"))
    c.Header("Content-Description", "File Transfer")
    c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
    c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", data)
}