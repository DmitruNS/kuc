// backend/internal/services/export.go

package services

import (
    "fmt"
    "github.com/xuri/excelize/v2"
    "kuckuc/internal/models"
)

type ExportService struct {
    propertyService *PropertyService
}

func NewExportService(propertyService *PropertyService) *ExportService {
    return &ExportService{
        propertyService: propertyService,
    }
}

func (s *ExportService) ExportPropertiesToExcel(filter PropertyFilter, language string) ([]byte, error) {
    // Get properties data
    properties, err := s.propertyService.ListProperties(filter, language)
    if err != nil {
        return nil, fmt.Errorf("failed to get properties: %w", err)
    }

    // Create new Excel file
    f := excelize.NewFile()

    // Create sheets for different property types
    sheets := map[models.PropertyType]string{
        models.House:     "Houses",
        models.Apartment: "Apartments",
        models.Office:    "Offices",
    }

    // Set headers for each sheet
    headers := []string{
        "Agent Code",
        "Property Code",
        "Deal Type",
        "Status",
        "City",
        "District",
        "Address",
        "Floor",
        "Total Floors",
        "Living Area",
        "Rooms",
        "Bedrooms",
        "Bathrooms",
        "Plot Size",
        "Registered",
        "Heating Type",
        "Water Supply",
        "Sewage",
        "Price",
        "Creation Date",
        "Last Update",
    }

    for propertyType, sheetName := range sheets {
        // Create sheet
        index, err := f.NewSheet(sheetName)
        if err != nil {
            return nil, fmt.Errorf("failed to create sheet: %w", err)
        }

        // Set headers
        for col, header := range headers {
            cell, _ := excelize.CoordinatesToCellName(col+1, 1)
            f.SetCellValue(sheetName, cell, header)
        }

        // Apply header style
        style, err := f.NewStyle(&excelize.Style{
            Font: &excelize.Font{
                Bold: true,
            },
            Fill: excelize.Fill{
                Type:    "pattern",
                Color:   []string{"#CCCCCC"},
                Pattern: 1,
            },
        })
        if err != nil {
            return nil, fmt.Errorf("failed to create style: %w", err)
        }

        // Apply style to header row
        f.SetRowStyle(sheetName, 1, 1, style)

        // Filter properties by type and fill data
        var typeProperties []models.Property
        for _, prop := range properties {
            if prop.PropertyType == propertyType {
                typeProperties = append(typeProperties, prop)
            }
        }

        // Fill data
        for i, prop := range typeProperties {
            row := i + 2
            var details *models.PropertyDetails
            for _, d := range prop.Details {
                if d.Language == language {
                    details = &d
                    break
                }
            }

            if details != nil {
                values := []interface{}{
                    prop.AgentCode,
                    prop.PropertyCode,
                    prop.DealType,
                    prop.Status,
                    details.City,
                    details.District,
                    details.Address,
                    details.FloorNumber,
                    details.TotalFloors,
                    details.LivingArea,
                    details.Rooms,
                    details.Bedrooms,
                    details.Bathrooms,
                    details.PlotSize,
                    details.Registered,
                    details.HeatingType,
                    details.WaterSupply,
                    details.Sewage,
                    details.Price,
                    prop.CreatedAt.Format("2006-01-02"),
                    prop.UpdatedAt.Format("2006-01-02"),
                }

                for col, value := range values {
                    cell, _ := excelize.CoordinatesToCellName(col+1, row)
                    f.SetCellValue(sheetName, cell, value)
                }
            }
        }

        // Auto-fit columns
        for col := 1; col <= len(headers); col++ {
            colName, _ := excelize.CoordinatesToCellName(col, 1)
            f.SetColWidth(sheetName, colName[:1], colName[:1], 15)
        }

        if index == 1 {
            f.SetActiveSheet(index)
        }
    }

    // Delete default Sheet1
    f.DeleteSheet("Sheet1")

    // Save to buffer and convert to bytes
    buf, err := f.WriteToBuffer()
    if err != nil {
        return nil, fmt.Errorf("failed to write excel to buffer: %w", err)
    }

    return buf.Bytes(), nil
}