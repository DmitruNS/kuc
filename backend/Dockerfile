# backend/Dockerfile

# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install required build tools
RUN apk add --no-cache git gcc musl-dev

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/kuckuc-server ./cmd/api

# Final stage
FROM alpine:3.19

WORKDIR /app

# Install necessary runtime packages
RUN apk add --no-cache ca-certificates tzdata

# Copy the binary from builder
COPY --from=builder /app/kuckuc-server .

# Create upload directory
RUN mkdir -p /app/uploads && \
    chmod 755 /app/uploads

# Create non-root user
RUN adduser -D -H -h /app appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

CMD ["./kuckuc-server"]