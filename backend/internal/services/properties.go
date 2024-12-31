// backend/internal/services/properties.go
package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"kuckuc/internal/models"
	"math/rand"
	"time"
"log"
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
	PropertyType string  `form:"property_type"`
	DealType     string  `form:"deal_type"`
	City         string  `form:"city"`
	PriceMin     float64 `form:"price_min"`
	PriceMax     float64 `form:"price_max"`
	RoomsMin     int     `form:"rooms_min"`
	RoomsMax     int     `form:"rooms_max"`
	AreaMin      float64 `form:"area_min"`
	AreaMax      float64 `form:"area_max"`
	IsActive     *bool   `form:"is_active"`
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

 	if filter.City != "" || filter.PriceMin > 0 || filter.PriceMax > 0 ||
		filter.RoomsMin > 0 || filter.RoomsMax > 0 || filter.AreaMin > 0 || filter.AreaMax > 0 {

		query = query.Joins("JOIN property_details ON properties.id = property_details.property_id")
		query = query.Where("property_details.language = ?", language)

		if filter.City != "" {
			query = query.Where("LOWER(property_details.city) LIKE LOWER(?)", "%"+filter.City+"%")
		}
		if filter.PriceMin > 0 {
			query = query.Where("property_details.price >= ?", filter.PriceMin)
		}
		if filter.PriceMax > 0 {
			query = query.Where("property_details.price <= ?", filter.PriceMax)
		}
		if filter.RoomsMin > 0 {
			query = query.Where("property_details.rooms >= ?", filter.RoomsMin)
		}
		if filter.RoomsMax > 0 {
			query = query.Where("property_details.rooms <= ?", filter.RoomsMax)
		}
		if filter.AreaMin > 0 {
			query = query.Where("property_details.living_area >= ?", filter.AreaMin)
		}
		if filter.AreaMax > 0 {
			query = query.Where("property_details.living_area <= ?", filter.AreaMax)
		}
	}

	if err := query.Find(&properties).Error; err != nil {
		return nil, fmt.Errorf("error fetching properties: %w", err)
	}

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
    log.Printf("Attempting to fetch property ID: %d", id)
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
    log.Printf("Property loaded: %+v", property)
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
func (s *PropertyService) GetAllDocuments(propertyID uint) ([]models.Document, error) {
    var documents []models.Document
    if err := s.db.Table("property_documents").
        Where("property_id = ?", propertyID).
        Find(&documents).Error; err != nil {
        return nil, err
    }
    return documents, nil
}

func (s *PropertyService) GetPropertyHistory(propertyID uint) ([]models.History, error) {
    var history []models.History
    if err := s.db.Where("property_id = ?", propertyID).
        Order("action_date DESC").
        Find(&history).Error; err != nil {
        return nil, err
    }
    return history, nil
}
func (s *PropertyService) ListPropertiesByIDs(ids []uint, language string) ([]models.Property, error) {
    var properties []models.Property
    query := s.db.Preload("Details", "language = ?", language).
        Preload("Owner").
        Preload("Documents").
        Where("id IN ?", ids)

    if err := query.Find(&properties).Error; err != nil {
        return nil, fmt.Errorf("error fetching properties: %w", err)
    }
    return properties, nil
}