FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install required packages
RUN apk add --no-cache git gcc musl-dev

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o kuckuc-server ./cmd/api

# Final stage
FROM alpine:3.19

WORKDIR /app

# Install required packages
RUN apk add --no-cache ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /app/kuckuc-server .

# Create uploads directory
RUN mkdir -p /app/uploads && \
    chmod 755 /app/uploads

EXPOSE 8080

# Set default port if not specified
ENV SERVER_PORT=8080

CMD ["./kuckuc-server"]