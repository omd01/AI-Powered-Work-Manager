@echo off
echo ========================================
echo Installing Backend Dependencies
echo ========================================
echo.

echo Installing bcryptjs...
call npm install bcryptjs@2.4.3 --save --legacy-peer-deps
echo.

echo Installing jsonwebtoken...
call npm install jsonwebtoken@9.0.2 --save --legacy-peer-deps
echo.

echo Installing mongoose...
call npm install mongoose@8.0.0 --save --legacy-peer-deps
echo.

echo Installing TypeScript types...
call npm install @types/bcryptjs@2.4.6 @types/jsonwebtoken@9.0.5 --save-dev --legacy-peer-deps
echo.

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Set up MongoDB (see QUICK_START.md)
echo 2. Configure .env.local file
echo 3. Run: npm run dev
echo.
pause
