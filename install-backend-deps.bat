@echo off
echo Installing backend dependencies...
echo.

echo Step 1: Installing mongoose...
call npm install mongoose --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Failed to install mongoose
    pause
    exit /b %errorlevel%
)

echo Step 2: Installing bcryptjs...
call npm install bcryptjs --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Failed to install bcryptjs
    pause
    exit /b %errorlevel%
)

echo Step 3: Installing jsonwebtoken...
call npm install jsonwebtoken --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Failed to install jsonwebtoken
    pause
    exit /b %errorlevel%
)

echo Step 4: Installing cookie-parser...
call npm install cookie-parser --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Failed to install cookie-parser
    pause
    exit /b %errorlevel%
)

echo.
echo Step 5: Installing TypeScript types...
call npm install -D @types/bcryptjs @types/jsonwebtoken @types/cookie-parser --legacy-peer-deps
if %errorlevel% neq 0 (
    echo Failed to install TypeScript types
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo All backend dependencies installed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Set up MongoDB (see BACKEND_SETUP.md)
echo 2. Configure .env.local file
echo 3. Run: npm run dev
echo.
pause
