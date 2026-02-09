@echo off
echo.
echo ========================================
echo   Testing Log Monitoring System
echo ========================================
echo.

echo [1/4] Testing root endpoint...
curl -s http://localhost:3000/ > nul
echo ✓ Root endpoint tested

echo.
echo [2/4] Testing health endpoint...
curl -s http://localhost:3000/api/health > nul
echo ✓ Health endpoint tested

echo.
echo [3/4] Testing slow endpoint...
curl -s http://localhost:3000/api/slow > nul
echo ✓ Slow endpoint tested

echo.
echo [4/4] Testing error endpoint (will show error)...
curl -s http://localhost:3000/api/error > nul
echo ✓ Error endpoint tested

echo.
echo ========================================
echo   Log Monitoring Test Complete!
echo ========================================
echo.
echo Generated logs for all levels:
echo   - INFO logs from root, health, and slow endpoints
echo   - ERROR logs from error endpoint
echo.
echo View logs in:
echo   1. Grafana: http://localhost:3001 (admin/admin)
echo   2. Dashboard: Application Logs Dashboard
echo.
pause
