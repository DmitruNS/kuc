#!/bin/bash
# backend/scripts/setup.sh

# Make script exit on first error
set -e

# Print commands
set -x

# Create necessary directories
mkdir -p uploads
mkdir -p logs

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from example. Please update the values."
fi

# Stop and remove existing containers
docker-compose down -v

# Start containers
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
max_retries=30
count=0
until docker-compose exec -T postgres pg_isready -U kuckuc || [ $count -eq $max_retries ]; do
    echo "Waiting for database connection..."
    sleep 2
    count=$((count + 1))
done

if [ $count -eq $max_retries ]; then
    echo "Error: PostgreSQL did not become ready in time"
    docker-compose logs postgres
    exit 1
fi

# Run migrations
if [ "$1" != "--skip-migrations" ]; then
    echo "Running database migrations..."
    sleep 5  # Give PostgreSQL a moment to fully initialize

    for f in migrations/*.sql; do
        echo "Applying migration: $f"
        # Копируем файл в контейнер
        docker cp "$f" kuckuc_postgres:/tmp/migration.sql
        # Выполняем миграцию
        docker-compose exec -T postgres psql -U kuckuc -d kuckuc_db -f /tmp/migration.sql
        # Удаляем временный файл
        docker-compose exec -T postgres rm /tmp/migration.sql
    done
else
    echo "Skipping database migrations..."
fi

echo "Setup completed successfully!"