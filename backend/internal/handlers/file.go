// backend/internal/handlers/file.go

package handlers

import (
	"kuckuc/internal/services"
	"log"
	"net/http"

	//	"os"
	"strconv"

	"github.com/gin-gonic/gin"

	"kuckuc/internal/models"
)

type FileHandlers struct {
	fileService     *services.FileService
	propertyService *services.PropertyService
}

func NewFileHandlers(fileService *services.FileService, propertyService *services.PropertyService) *FileHandlers {
	return &FileHandlers{
		fileService:     fileService,
		propertyService: propertyService,
	}
}

// UploadFile godoc
// @Summary Upload file
// @Description Upload file for property
// @Tags files
// @Accept multipart/form-data
// @Produce json
// @Param id path int true "Property ID" // Изменено с property_id на id
// @Param file_type query string true "File type (image, video, document)"
// @Param is_public query bool false "Is file public"
// @Param file formData file true "File to upload"
// @Success 200 {object} map[string]string
// @Router /properties/{property_id}/files [post]
// @Security Bearer

func (h *FileHandlers) UploadFile(c *gin.Context) {
    // Добавим отладочный вывод
    log.Printf("Received id param: %s", c.Param("id"))
    
    propertyID, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil || propertyID == 0 {
        log.Printf("Error parsing property ID: %v, raw value: %s", err, c.Param("id"))
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property id"})
        return
    }

    // Получаем файл
    file, err := c.FormFile("file")
    if err != nil {
        log.Printf("Error getting file from form: %v", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
        return
    }

    // Проверяем тип файла из query параметров
    fileType := services.FileType(c.Query("file_type"))
    if fileType != services.FileTypeImage &&
        fileType != services.FileTypeVideo &&
        fileType != services.FileTypeDocument {
        log.Printf("Invalid file type: %s", fileType)
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file type"})
        return
    }

    // Дополнительная проверка существования property
    _, err = h.propertyService.GetProperty(uint(propertyID), "en")
    if err != nil {
        log.Printf("Property not found: %v", err)
        c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
        return
    }

    // Сохраняем файл
    filePath, err := h.fileService.SaveFile(file, fileType, uint(propertyID))
    if err != nil {
        log.Printf("Error saving file: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Создаем запись о документе
    isPublic := c.Query("is_public") == "true"
    document := models.Document{
        PropertyID: uint(propertyID),
        FileType:   string(fileType),
        FilePath:   filePath,
        IsPublic:   isPublic,
    }

    if err := h.propertyService.AddDocument(&document); err != nil {
        log.Printf("Error adding document to database: %v", err)
        _ = h.fileService.DeleteFile(filePath) // Очищаем файл при ошибке
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, document)
}

// DeleteFile godoc
// @Summary Delete file
// @Description Delete property file
// @Tags files
// @Produce json
// @Param id path int true "Property ID" // Изменено с property_id на id
// @Param file_id path int true "File ID"
// @Success 200 {object} map[string]string
// @Router /properties/{property_id}/files/{file_id} [delete]
// @Security Bearer
func (h *FileHandlers) DeleteFile(c *gin.Context) {
	propertyID, err := strconv.ParseUint(c.Param("property_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property id"})
		return
	}

	fileID, err := strconv.ParseUint(c.Param("file_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file id"})
		return
	}

	document, err := h.propertyService.GetDocument(uint(fileID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	if document.PropertyID != uint(propertyID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "file does not belong to property"})
		return
	}

	// Delete file from storage
	if err := h.fileService.DeleteFile(document.FilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Delete document record
	if err := h.propertyService.DeleteDocument(uint(fileID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// UpdateFileVisibility godoc
// @Summary Update file visibility
// @Description Update property file public visibility
// @Tags files
// @Accept json
// @Produce json
// @Param id path int true "Property ID" // Изменено с property_id на id
// @Param file_id path int true "File ID"
// @Param is_public body bool true "Public visibility status"
// @Success 200 {object} map[string]string
// @Router /properties/{property_id}/files/{file_id}/visibility [put]
// @Security Bearer
func (h *FileHandlers) UpdateFileVisibility(c *gin.Context) {
	propertyID, err := strconv.ParseUint(c.Param("property_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property id"})
		return
	}

	fileID, err := strconv.ParseUint(c.Param("file_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file id"})
		return
	}

	var request struct {
		IsPublic bool `json:"is_public"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.propertyService.UpdateDocumentVisibility(uint(fileID), uint(propertyID), request.IsPublic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}
