@echo off
setlocal enabledelayedexpansion

echo === Champa Store Deployment Script ===

REM Check if .env.production exists
if not exist .env.production (
  echo Error: .env.production file is missing.
  echo Please create a .env.production file with the following variables:
  echo VITE_SUPABASE_URL=your-supabase-url
  echo VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
  echo VITE_DISCORD_WEBHOOK_URL=your-discord-webhook-url
  exit /b 1
)

REM Install dependencies
echo Installing dependencies...
call npm install

REM Run build
echo Building for production...
call npm run build

REM Check if build was successful
if %ERRORLEVEL% neq 0 (
  echo Build failed. Please check the errors above.
  exit /b 1
)

REM Ask if the user wants to deploy to Netlify
set /p deploy_answer=Do you want to deploy to Netlify now? (y/n)

if /i "%deploy_answer%"=="y" (
  REM Check if Netlify CLI is installed
  where netlify >nul 2>&1
  if %ERRORLEVEL% neq 0 (
    echo Netlify CLI not found. Installing...
    call npm install -g netlify-cli
  )
  
  REM Deploy to Netlify
  echo Deploying to Netlify...
  call netlify deploy --prod
  
  if %ERRORLEVEL% equ 0 (
    echo Deployment successful!
  ) else (
    echo Deployment failed. Please check the errors above.
    exit /b 1
  )
) else (
  echo Build completed successfully.
  echo To deploy manually:
  echo 1. Install Netlify CLI: npm install -g netlify-cli
  echo 2. Login to Netlify: netlify login
  echo 3. Deploy: netlify deploy --prod
)

echo === Deployment process completed === 