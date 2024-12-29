// backend/internal/handlers/file.go

package handlers

import (
	"kuckuc/internal/services"
	"net/http"
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
// @Param property_id path int true "Property ID"
// @Param file_type query string true "File type (image, video, document)"
// @Param is_public query bool false "Is file public"
// @Param file formData file true "File to upload"
// @Success 200 {object} map[string]string
// @Router /properties/{property_id}/files [post]
// @Security Bearer
func (h *FileHandlers) UploadFile(c *gin.Context) {
	propertyID, err := strconv.ParseUint(c.Param("property_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid property id"})
		return
	}

	fileType := services.FileType(c.Query("file_type"))
	if fileType != services.FileTypeImage &&
		fileType != services.FileTypeVideo &&
		fileType != services.FileTypeDocument {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file type"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
		return
	}

	// Validate file type
	if !h.fileService.ValidateFileType(file.Filename, h.fileService.GetAllowedTypes(fileType)) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file format"})
		return
	}

	// Save file
	filePath, err := h.fileService.SaveFile(file, fileType, uint(propertyID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create document record
	isPublic := c.DefaultQuery("is_public", "false") == "true"
	document := models.Document{
		PropertyID: uint(propertyID),
		FileType:   string(fileType),
		FilePath:   filePath,
		IsPublic:   isPublic,
	}

	if err := h.propertyService.AddDocument(&document); err != nil {
		// Try to cleanup file if document creation fails
		_ = h.fileService.DeleteFile(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"file_path": filePath,
		"is_public": isPublic,
	})
}

// DeleteFile godoc
// @Summary Delete file
// @Description Delete property file
// @Tags files
// @Produce json
// @Param property_id path int true "Property ID"
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
// @Param property_id path int true "Property ID"
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
