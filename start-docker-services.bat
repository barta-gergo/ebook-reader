@echo off
echo Starting Docker Compose services...
echo.

echo Starting Meilisearch service...
start "Meilisearch" /D "D:\software_dev\random\ebook-reader\backend" docker-compose -f docker-compose.meilisearch.yml up

echo Starting PDF Table of Contents Extractor service...
start "PDF-TOC-Extractor" /D "D:\software_dev\random\ebook-reader\pdf-table-of-contents-extractor" docker-compose up

echo.
echo Both services are starting in separate windows.
echo Press any key to exit this script...
pause >nul