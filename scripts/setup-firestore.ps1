# PowerShell script to help set up Firestore database
# This script opens the Firebase Console in your browser

$projectId = "blp-imis"
$firestoreUrl = "https://console.firebase.google.com/project/$projectId/firestore"

Write-Host "Firestore Database Setup Helper" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening Firebase Console in your browser..." -ForegroundColor Yellow
Write-Host "URL: $firestoreUrl" -ForegroundColor Gray
Write-Host ""

# Open the URL in default browser
Start-Process $firestoreUrl

Write-Host "Follow these steps in the browser:" -ForegroundColor Green
Write-Host ""
Write-Host "   1. Click 'Create database' button" -ForegroundColor White
Write-Host "   2. Choose 'Start in test mode' (for quick setup)" -ForegroundColor White
Write-Host "   3. Select location: us-central1 (or your preferred region)" -ForegroundColor White
Write-Host "   4. Click 'Enable'" -ForegroundColor White
Write-Host "   5. Wait ~30 seconds for initialization" -ForegroundColor White
Write-Host ""
Write-Host "After the database is created, run:" -ForegroundColor Yellow
Write-Host "   npm run create-user-doc" -ForegroundColor Cyan
Write-Host ""

