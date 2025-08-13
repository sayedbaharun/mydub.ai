#!/bin/bash

# Setup script for MCP local development environment

echo "🚀 Setting up MCP local development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data/redis
mkdir -p data/postgres
mkdir -p data/elasticsearch
mkdir -p data/minio
mkdir -p logs

# Copy environment template if .env.mcp doesn't exist
if [ ! -f .env.mcp ]; then
    echo "📄 Creating .env.mcp from template..."
    cp .env.mcp.example .env.mcp
    echo "⚠️  Please edit .env.mcp and add your API keys"
fi

# Create Prometheus configuration
echo "📊 Creating Prometheus configuration..."
cat > prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mydubai-app'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/api/metrics'
EOF

# Start local services
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.local.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
services=("redis:6379" "postgres:5432" "elasticsearch:9200" "minio:9000" "mailhog:8025")

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ $name is running on port $port"
    else
        echo "❌ $name is not responding on port $port"
    fi
done

# Display service URLs
echo ""
echo "📌 Service URLs:"
echo "  Redis:         redis://localhost:6379"
echo "  PostgreSQL:    postgresql://mydubai:mydubai_local_dev@localhost:5432/mydubai"
echo "  Elasticsearch: http://localhost:9200"
echo "  Kibana:        http://localhost:5601"
echo "  MinIO:         http://localhost:9001 (user: mydubai_admin, pass: mydubai_secret_key)"
echo "  MailHog:       http://localhost:8025"
echo "  Grafana:       http://localhost:3001 (user: admin, pass: mydubai_grafana)"
echo "  Prometheus:    http://localhost:9090"

echo ""
echo "✅ Local MCP development environment is ready!"
echo ""
echo "To stop services: docker-compose -f docker-compose.local.yml down"
echo "To view logs: docker-compose -f docker-compose.local.yml logs -f [service-name]"