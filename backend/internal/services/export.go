package services

import (
	"archive/zip"
	"bytes"
	"fmt"

	//   "io"
	"log"
	"os"
	"path/filepath"

	//   "time"

	"kuckuc/internal/models"

	"github.com/xuri/excelize/v2"
)

type ExportService struct {
	propertyService *PropertyService
	fileService     *FileService
}

type ExportResult struct {
	ExcelData []byte
	ZipData   []byte
}

func NewExportService(propertyService *PropertyService, fileService *FileService) *ExportService {
	return &ExportService{
		propertyService: propertyService,
		fileService:     fileService,
	}
}
func (s *ExportService) addPropertyFiles(w *zip.Writer, prop models.Property, propDir string) error {
	docs, err := s.propertyService.GetAllDocuments(prop.ID)
	if err != nil {
		return err
	}

	for _, doc := range docs {
		filePath := s.fileService.GetFilePath(doc.FilePath)
		fileData, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}

		fileName := fmt.Sprintf("%s/%s_%s_%v",
			propDir,
			doc.FileType,
			filepath.Base(doc.FilePath),
			doc.IsPublic,
		)

		fileWriter, err := w.Create(fileName)
		if err != nil {
			continue
		}

		if _, err := fileWriter.Write(fileData); err != nil {
			continue
		}
	}
	return nil
}

func (s *ExportService) addPropertyHistory(w *zip.Writer, prop models.Property, propDir string) error {
	history, err := s.propertyService.GetPropertyHistory(prop.ID)
	if err != nil {
		return err
	}

	var historyContent bytes.Buffer
	historyContent.WriteString(fmt.Sprintf("История операций для объекта %s\n\n", prop.PropertyCode))

	for _, record := range history {
		historyContent.WriteString(fmt.Sprintf("Дата: %s\n", record.ActionDate.Format("2006-01-02 15:04:05")))
		historyContent.WriteString(fmt.Sprintf("Действие: %s\n", record.ActionType))
		historyContent.WriteString(fmt.Sprintf("Агент ID: %d\n", record.AgentID))
		historyContent.WriteString(fmt.Sprintf("Детали: %s\n", string(record.Details)))
		historyContent.WriteString("------------------\n")
	}

	historyWriter, err := w.Create(fmt.Sprintf("%s/history.txt", propDir))
	if err != nil {
		return err
	}

	_, err = historyWriter.Write(historyContent.Bytes())
	return err
}
func (s *ExportService) ExportProperties(filter PropertyFilter, language string, propertyIDs []uint) ([]byte, error) {
    log.Printf("Starting export for properties: %v", propertyIDs)
    properties, err := s.propertyService.ListPropertiesByIDs(propertyIDs, language)
    if err != nil {
        log.Printf("Error listing properties: %v", err)
        return nil, err
    }

    log.Printf("Found %d properties", len(properties))
    if len(properties) == 0 {
        return nil, fmt.Errorf("no properties found")
    }

    buf := new(bytes.Buffer)
    zipWriter := zip.NewWriter(buf)

    log.Printf("Creating Excel file...")
    excelData, err := s.createExcelFile(properties, language)
    if err != nil {
        log.Printf("Excel creation error: %v", err)
        return nil, err
    }
    log.Printf("Excel file created, size: %d bytes", len(excelData))


	excelWriter, err := zipWriter.Create("properties_export.xlsx")
	if err != nil {
		return nil, fmt.Errorf("excel file creation error: %w", err)
	}

	_, err = excelWriter.Write(excelData)
	if err != nil {
		return nil, fmt.Errorf("excel write error: %w", err)
	}

	// Добавляем файлы и историю для каждого объекта
	for _, prop := range properties {
		propDir := fmt.Sprintf("files/%s_%s", prop.PropertyCode, prop.AgentCode)

		if err := s.addPropertyFiles(zipWriter, prop, propDir); err != nil {
			log.Printf("Error adding files for property %s: %v", prop.PropertyCode, err)
			continue
		}

		if err := s.addPropertyHistory(zipWriter, prop, propDir); err != nil {
			log.Printf("Error adding history for property %s: %v", prop.PropertyCode, err)
			continue
		}
	}

	if err := zipWriter.Close(); err != nil {
		return nil, fmt.Errorf("zip close error: %w", err)
	}

	data := buf.Bytes()
	if len(data) < 100 {
		return nil, fmt.Errorf("suspicious zip size: %d bytes", len(data))
	}

	return data, nil
}

func (s *ExportService) createDocumentsArchive(properties []models.Property) ([]byte, error) {
	buf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(buf)

	for _, prop := range properties {
		// Создаем директорию для файлов объекта
		propDir := fmt.Sprintf("%s_%s", prop.PropertyCode, prop.AgentCode)

		// Получаем все документы объекта
		docs, err := s.propertyService.GetAllDocuments(prop.ID)
		if err != nil {
			continue // Пропускаем объект при ошибке
		}

		// Добавляем файлы
		for _, doc := range docs {
			filePath := s.fileService.GetFilePath(doc.FilePath)
			fileData, err := os.ReadFile(filePath)
			if err != nil {
				continue
			}

			// Создаем имя файла с метаинформацией
			fileName := fmt.Sprintf("%s/%s_%s_%v",
				propDir,
				doc.FileType,
				filepath.Base(doc.FilePath),
				doc.IsPublic,
			)

			fileWriter, err := zipWriter.Create(fileName)
			if err != nil {
				continue
			}

			if _, err := fileWriter.Write(fileData); err != nil {
				continue
			}
		}

		// Добавляем историю
		history, err := s.propertyService.GetPropertyHistory(prop.ID)
		if err == nil {
			var historyContent bytes.Buffer
			historyContent.WriteString(fmt.Sprintf("История операций для объекта %s\n\n", prop.PropertyCode))

			for _, record := range history {
				historyContent.WriteString(fmt.Sprintf("Дата: %s\n", record.ActionDate.Format("2006-01-02 15:04:05")))
				historyContent.WriteString(fmt.Sprintf("Действие: %s\n", record.ActionType))
				historyContent.WriteString(fmt.Sprintf("Агент ID: %d\n", record.AgentID))
				historyContent.WriteString(fmt.Sprintf("Детали: %s\n", string(record.Details)))
				historyContent.WriteString("------------------\n")
			}

			historyWriter, err := zipWriter.Create(fmt.Sprintf("%s/history.txt", propDir))
			if err == nil {
				historyWriter.Write(historyContent.Bytes())
			}
		}
	}

	if err := zipWriter.Close(); err != nil {
		return nil, fmt.Errorf("failed to close zip: %w", err)
	}

	return buf.Bytes(), nil
}

func (s *ExportService) createExcelFile(properties []models.Property, language string) ([]byte, error) {
	f := excelize.NewFile()

	// Создаем листы для разных типов недвижимости
	sheets := map[models.PropertyType]string{
		models.House:     "Houses",
		models.Apartment: "Apartments",
		models.Office:    "Offices",
	}

	// Заголовки для Excel
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
		"Owner Properties Count",
		"Contract Status",
		"Contract Number",
		"Contract End Date",
		"Documents Count",
	}

	// Заполняем листы данными
	for propertyType, sheetName := range sheets {
		index, _ := f.NewSheet(sheetName)

		// Устанавливаем заголовки
		for col, header := range headers {
			cell, _ := excelize.CoordinatesToCellName(col+1, 1)
			f.SetCellValue(sheetName, cell, header)
		}

		// Стиль заголовков
		headerStyle, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{Bold: true},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"#CCCCCC"}, Pattern: 1},
		})
		f.SetRowStyle(sheetName, 1, 1, headerStyle)

		// Заполняем данными
		rowNum := 2
		for _, prop := range properties {
			if prop.PropertyType != propertyType {
				continue
			}

			details := getPropertyDetails(prop, language)
			if details == nil {
				continue
			}

			// Подсчитываем количество документов
			docsCount := len(prop.Documents)

			// Заполняем данные
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
				prop.Owner.PropertiesCount,
				prop.Owner.ContractStatus,
				prop.Owner.ContractNumber,
				prop.Owner.ContractEndDate.Format("2006-01-02"),
				docsCount,
			}

			for col, value := range values {
				cell, _ := excelize.CoordinatesToCellName(col+1, rowNum)
				f.SetCellValue(sheetName, cell, value)
			}
			rowNum++
		}

		// Автоширина колонок
		for col := 1; col <= len(headers); col++ {
			colName, _ := excelize.CoordinatesToCellName(col, 1)
			f.SetColWidth(sheetName, colName[:1], colName[:1], 15)
		}

		if index == 1 {
			f.SetActiveSheet(index)
		}
	}

	f.DeleteSheet("Sheet1")

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, fmt.Errorf("failed to write excel to buffer: %w", err)
	}

	return buf.Bytes(), nil
}

func getPropertyDetails(prop models.Property, language string) *models.PropertyDetails {
	for _, details := range prop.Details {
		if details.Language == language {
			return &details
		}
	}
	return nil
}
