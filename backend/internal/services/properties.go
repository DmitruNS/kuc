//backend/internal/services/properties.go
package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"kuckuc/internal/models"
	"math/rand"
	"time"

	"gorm.io/gorm"
)

// Helper functions for generating unique codes
func generatePropertyCode() string {
    timestamp := time.Now().UnixNano() / int64(time.Millisecond)
    random := rand.Intn(10000)
    return fmt.Sprintf("PROP%d%04d", timestamp%1000000, random)
}

func generateAgentCode(dealType models.DealType) string {
    prefix := "SALE"
    if dealType == models.Rent {
        prefix = "RENT"
    }
    timestamp := time.Now().Format("060102") // YYMMDD
    random := fmt.Sprintf("%03d", rand.Intn(1000))
    return fmt.Sprintf("%s%s%s", prefix, timestamp, random)
}
type PropertyService struct {
    db *gorm.DB
}

func NewPropertyService(db *gorm.DB) *PropertyService {
    return &PropertyService{db: db}
}

type PropertyFilter struct {
    PropertyType string
    DealType     string
    City         string
    PriceMin     float64
    PriceMax     float64
    RoomsMin     int
    AreaMin      float64
    AreaMax      float64
    IsActive     *bool
}

func (s *PropertyService) ListProperties(filter PropertyFilter, language string) ([]models.Property, error) {
    var properties []models.Property
    
    query := s.db.Preload("Details", "language = ?", language)

    if filter.PropertyType != "" {
        query = query.Where("property_type = ?", filter.PropertyType)
    }
    if filter.DealType != "" {
        query = query.Where("deal_type = ?", filter.DealType)
    }
    if filter.IsActive != nil {
        query = query.Where("is_active = ?", *filter.IsActive)
    }

    if err := query.Find(&properties).Error; err != nil {
        return nil, fmt.Errorf("error fetching properties: %w", err)
    }

    // Загружаем документы отдельно
    for i := range properties {
        var documents []models.Document
        if err := s.db.Table("property_documents").
            Where("property_id = ? AND is_public = ?", properties[i].ID, true).
            Find(&documents).Error; err == nil {
            properties[i].Documents = documents
        }
    }

    return properties, nil
}



func (s *PropertyService) GetProperty(id uint, language string) (*models.Property, error) {
    var property models.Property
    
    if err := s.db.Preload("Details").
        First(&property, id).Error; err != nil {
        return nil, err
    }
    
    // Загружаем документы отдельно, чтобы избежать ошибок с отсутствующей таблицей
    var documents []models.Document
    if err := s.db.Table("property_documents").
        Where("property_id = ? AND is_public = ?", id, true).
        Find(&documents).Error; err == nil {
        property.Documents = documents
    }

    return &property, nil
}


func (s *PropertyService) CreateProperty(property *models.Property, agentID uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Generate unique codes
		property.AgentCode = generateAgentCode(property.DealType)
		property.PropertyCode = generatePropertyCode()

		// Create the property
		if err := tx.Create(property).Error; err != nil {
			return err
		}

		// Create history record
		history := models.History{
			PropertyID: property.ID,
			ActionType: "create",
			ActionDate: time.Now(),
			AgentID:    agentID,
			Details:    json.RawMessage(`{"action": "property_created"}`),
		}

		return tx.Create(&history).Error
	})
}

func (s *PropertyService) UpdateProperty(property *models.Property, agentID uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Update the property
		if err := tx.Save(property).Error; err != nil {
			return err
		}

		// Create history record
		history := models.History{
			PropertyID: property.ID,
			ActionType: "update",
			ActionDate: time.Now(),
			AgentID:    agentID,
			Details:    json.RawMessage(`{"action": "property_updated"}`),
		}

		return tx.Create(&history).Error
	})
}

func (s *PropertyService) UpdatePropertyStatus(id uint, isActive bool, agentID uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Property{}).
			Where("id = ?", id).
			Update("is_active", isActive).Error; err != nil {
			return err
		}

		// Create history record
		history := models.History{
			PropertyID: id,
			ActionType: "status_update",
			ActionDate: time.Now(),
			AgentID:    agentID,
			Details:    json.RawMessage(fmt.Sprintf(`{"action": "status_updated", "is_active": %t}`, isActive)),
		}

		return tx.Create(&history).Error
	})
}

func (s *PropertyService) ExportProperties(filter PropertyFilter) ([]byte, error) {
	// Implementation of Excel export will be added later
	return nil, errors.New("not implemented")
}

func (s *PropertyService) AddDocument(document *models.Document) error {
    return s.db.Table("property_documents").Create(document).Error
}


func (s *PropertyService) GetDocument(id uint) (*models.Document, error) {
    var document models.Document
    if err := s.db.Table("property_documents").First(&document, id).Error; err != nil {
        return nil, err
    }
    return &document, nil
}

func (s *PropertyService) DeleteDocument(id uint) error {
    return s.db.Table("property_documents").Delete(&models.Document{}, id).Error
}

func (s *PropertyService) UpdateDocumentVisibility(fileID uint, propertyID uint, isPublic bool) error {
    result := s.db.Table("property_documents").
        Where("id = ? AND property_id = ?", fileID, propertyID).
        Update("is_public", isPublic)
    
    if result.Error != nil {
        return result.Error
    }
    
    if result.RowsAffected == 0 {
        return fmt.Errorf("document not found or does not belong to property")
    }
    
    return nil
}
