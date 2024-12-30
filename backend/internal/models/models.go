// backend/internal/models/models.go

package models

import (
	"encoding/json"
	"time"
)

type PropertyType string
type DealType string
type PropertyStatus string

const (
	House     PropertyType = "house"
	Apartment PropertyType = "apartment"
	Office    PropertyType = "office"

	Sale DealType = "sale"
	Rent DealType = "rent"

	Ready  PropertyStatus = "ready"
	New    PropertyStatus = "new"
	Shared PropertyStatus = "shared"
)

type Property struct {
	ID           uint              `json:"id" gorm:"primaryKey"`
	AgentCode    string            `json:"agent_code" gorm:"unique;not null"`
	PropertyCode string            `json:"property_code" gorm:"unique;not null"`
	PropertyType PropertyType      `json:"property_type"`
	DealType     DealType          `json:"deal_type"`
	Status       PropertyStatus    `json:"status"`
	IsActive     bool              `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	Details      []PropertyDetails `json:"details" gorm:"foreignKey:PropertyID"`
	Documents    []Document        `json:"documents" gorm:"foreignKey:PropertyID"`
	Owner        PropertyOwner     `json:"owner" gorm:"foreignKey:PropertyID"`
	History      []History         `json:"history" gorm:"foreignKey:PropertyID"`
}

// backend/internal/models/models.go

type PropertyDetails struct {
	ID         uint   `json:"id" gorm:"primaryKey"`
	PropertyID uint   `json:"property_id"`
	Language   string `json:"language" gorm:"not null"`

	// Переводимые поля
	City           string          `json:"city"`
	District       string          `json:"district"`
	Address        string          `json:"address"`
	HeatingType    string          `json:"heating_type"`
	PlotFacilities json.RawMessage `json:"plot_facilities"` // Изменено с plot_equipment
	Equipment      json.RawMessage `json:"equipment"`       // Изменено с home_equipment
	RoadAccess     string          `json:"road_access"`
	Description    string          `json:"description"`

	// Числовые поля
	FloorNumber int     `json:"floor_number"`
	TotalFloors int     `json:"total_floors"`
	LivingArea  float64 `json:"living_area"`
	Rooms       int     `json:"rooms"`
	Bedrooms    int     `json:"bedrooms"`
	Bathrooms   int     `json:"bathrooms"`
	PlotSize    float64 `json:"plot_size"`
	Price       float64 `json:"price"`

	// Булевы поля
	Registered  bool `json:"registered"`
	WaterSupply bool `json:"water_supply"`
	Sewage      bool `json:"sewage"`
}

type PropertyOwner struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	PropertyID       uint      `json:"property_id"`
	PropertiesCount  int       `json:"properties_count"`
	ContractStatus   string    `json:"contract_status" gorm:"type:varchar(50)"`
	ContractNumber   string    `json:"contract_number"`
	ContractEndDate  time.Time `json:"contract_end_date"`
	ContractFilePath string    `json:"contract_file_path"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
type Document struct {
	ID         uint      `json:"id" gorm:"primaryKey;table:property_documents"`
	PropertyID uint      `json:"property_id"`
	FileType   string    `json:"file_type"`
	FilePath   string    `json:"file_path"`
	IsPublic   bool      `json:"is_public"`
	CreatedAt  time.Time `json:"created_at"`
}

func (Document) TableName() string {
	return "property_documents"
}

type History struct {
	ID         uint            `json:"id" gorm:"primaryKey"`
	PropertyID uint            `json:"property_id"`
	ActionType string          `json:"action_type"`
	ActionDate time.Time       `json:"action_date"`
	AgentID    uint            `json:"agent_id"`
	Details    json.RawMessage `json:"details"`
}

type User struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Email        string    `json:"email" gorm:"unique;not null"`
	PasswordHash string    `json:"-" gorm:"not null"`
	Role         string    `json:"role" gorm:"type:user_role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (History) TableName() string {
	return "property_history"
}
