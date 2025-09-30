#!/bin/bash

echo "Starting Docker Compose services..."
echo

echo "Starting Meilisearch service..."
cd "/mnt/d/software_dev/random/ebook-reader/backend"
docker-compose -f docker-compose.meilisearch.yml up -d

echo "Starting PDF Table of Contents Extractor service..."
cd "/mnt/d/software_dev/random/ebook-reader/pdf-table-of-contents-extractor"
docker-compose up -d

echo
echo "Both services are now running in detached mode."
echo "To view logs, use:"
echo "  docker-compose -f /mnt/d/software_dev/random/ebook-reader/backend/docker-compose.meilisearch.yml logs -f"
echo "  docker-compose -f /mnt/d/software_dev/random/ebook-reader/pdf-table-of-contents-extractor/docker-compose.yml logs -f"
echo
echo "To stop services, use:"
echo "  docker-compose -f /mnt/d/software_dev/random/ebook-reader/backend/docker-compose.meilisearch.yml down"
echo "  docker-compose -f /mnt/d/software_dev/random/ebook-reader/pdf-table-of-contents-extractor/docker-compose.yml down"