#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Champa Store Deployment Script ===${NC}"

# Check if .env.production exists
if [ ! -f .env.production ]; then
  echo -e "${RED}Error: .env.production file is missing.${NC}"
  echo -e "Please create a .env.production file with the following variables:"
  echo -e "VITE_SUPABASE_URL=your-supabase-url"
  echo -e "VITE_SUPABASE_ANON_KEY=your-supabase-anon-key"
  echo -e "VITE_DISCORD_WEBHOOK_URL=your-discord-webhook-url"
  exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Run build
echo -e "${YELLOW}Building for production...${NC}"
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed. Please check the errors above.${NC}"
  exit 1
fi

# Ask if the user wants to deploy to Netlify
echo -e "${YELLOW}Do you want to deploy to Netlify now? (y/n)${NC}"
read deploy_answer

if [ "$deploy_answer" = "y" ] || [ "$deploy_answer" = "Y" ]; then
  # Check if Netlify CLI is installed
  if ! command -v netlify &> /dev/null; then
    echo -e "${YELLOW}Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
  fi
  
  # Deploy to Netlify
  echo -e "${YELLOW}Deploying to Netlify...${NC}"
  netlify deploy --prod
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
  else
    echo -e "${RED}Deployment failed. Please check the errors above.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}Build completed successfully.${NC}"
  echo -e "To deploy manually:"
  echo -e "1. Install Netlify CLI: npm install -g netlify-cli"
  echo -e "2. Login to Netlify: netlify login"
  echo -e "3. Deploy: netlify deploy --prod"
fi

echo -e "${GREEN}=== Deployment process completed ===${NC}" 