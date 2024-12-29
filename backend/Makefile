# backend/Makefile

include .env
export

.PHONY: build run test migrate-up migrate-down docker-build docker-run

# Build the application
build:
	go build -o bin/kuckuc-server ./cmd/api

# Run the application
run: build
	./bin/kuckuc-server

# Run tests
test:
	go test -v ./...

# Docker commands
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker-compose build

docker-logs:
	docker-compose logs -f

# Database commands through Docker
migrate-up:
	docker-compose exec postgres migrate -path /migrations -database "postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?sslmode=disable" up

migrate-down:
	docker-compose exec postgres migrate -path /migrations -database "postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?sslmode=disable" down

psql:
	docker-compose exec postgres psql -U ${DB_USER} -d ${DB_NAME}

# Development tools
install-tools:
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	go install github.com/swaggo/swag/cmd/swag@latest

# Generate API documentation
swagger:
	swag init -g cmd/api/main.go -o docs

# Create new migration
create-migration:
	@read -p "Enter migration name: " name; \
	migrate create -ext sql -dir migrations -seq $$name

# Development helpers
dev-start: docker-up

dev-stop: docker-down

dev-restart: dev-stop dev-start

# Clean
clean:
	rm -rf bin/
	docker-compose down -v