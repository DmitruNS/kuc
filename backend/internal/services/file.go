// backend/internal/services/file.go

package services

import (
    "fmt"
    "io"
    "mime/multipart"
    "os"
    "path/filepath"
    "strings"
    "time"
    "github.com/google/uuid"
)

type FileService struct {
    uploadDir string
}
func (s *FileService) GetUploadDir() string {
    return s.uploadDir
}

func NewFileService(uploadDir string) *FileService {
    return &FileService{
        uploadDir: uploadDir,
    }
}

type FileType string

const (
    FileTypeImage    FileType = "image"
    FileTypeVideo    FileType = "video"
    FileTypeDocument FileType = "document"
)

func (s *FileService) SaveFile(file *multipart.FileHeader, fileType FileType, propertyID uint) (string, error) {
    // Create year/month-based directory structure
    now := time.Now()
    relativePath := filepath.Join(
        string(fileType),
        fmt.Sprintf("%d", propertyID),
        fmt.Sprintf("%d/%02d", now.Year(), now.Month()),
    )
    fullPath := filepath.Join(s.uploadDir, relativePath)

    if err := os.MkdirAll(fullPath, 0755); err != nil {
        return "", fmt.Errorf("failed to create directory: %w", err)
    }

    // Generate unique filename
    ext := filepath.Ext(file.Filename)
    filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
    
    // Open source file
    src, err := file.Open()
    if err != nil {
        return "", fmt.Errorf("failed to open uploaded file: %w", err)
    }
    defer src.Close()

    // Create destination file
    fullFilePath := filepath.Join(fullPath, filename)
    dst, err := os.Create(fullFilePath)
    if err != nil {
        return "", fmt.Errorf("failed to create destination file: %w", err)
    }
    defer dst.Close()

    // Copy contents
    if _, err = io.Copy(dst, src); err != nil {
        return "", fmt.Errorf("failed to copy file contents: %w", err)
    }

    // Return relative path for storage in database
    return filepath.Join(relativePath, filename), nil
}

func (s *FileService) DeleteFile(filePath string) error {
    fullPath := filepath.Join(s.uploadDir, filePath)
    return os.Remove(fullPath)
}

func (s *FileService) GetFilePath(relativePath string) string {
    return filepath.Join(s.uploadDir, relativePath)
}

func (s *FileService) ValidateFileType(filename string, allowedTypes []string) bool {
    ext := strings.ToLower(filepath.Ext(filename))
    for _, allowedType := range allowedTypes {
        if ext == allowedType {
            return true
        }
    }
    return false
}

func (s *FileService) GetAllowedTypes(fileType FileType) []string {
    switch fileType {
    case FileTypeImage:
        return []string{".jpg", ".jpeg", ".png", ".gif"}
    case FileTypeVideo:
        return []string{".mp4", ".mov", ".avi"}
    case FileTypeDocument:
        return []string{".pdf", ".doc", ".docx", ".txt"}
    default:
        return []string{}
    }
}