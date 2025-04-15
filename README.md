# Champa Store

Minecraft rank store built with React, TypeScript, Supabase, and TailwindCSS.

## Security Configuration

### Environment Variables

The application uses environment variables to secure sensitive information like API keys and webhook URLs. Create a `.env` file in the root directory with the following content:

```
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Discord Webhook
VITE_DISCORD_WEBHOOK_URL=your-discord-webhook-url
```

**Important Security Notes:**
- Never commit the `.env` file to version control
- Always use the `.env.example` file as a template
- Keep your Discord webhook URL secret as it can be used to send messages to your Discord channel

### Discord Webhook Security

The Discord webhook URL is sensitive information that should not be directly embedded in client-side code or committed to version control. The application uses the following security measures:

1. Stores the webhook URL in environment variables
2. Uses a dedicated WebhookService to handle communication
3. Implements request timeouts and error handling
4. Validation of webhook responses

## Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and add your credentials
```

### Running the Application

```bash
# Start development server
npm run dev
```

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Deploying to Netlify

The easiest way to deploy Champa Store is using Netlify:

1. **Create a Netlify account**
   - Sign up at [netlify.com](https://www.netlify.com/)

2. **Deploy from Git**
   - Push your code to GitHub, GitLab or Bitbucket
   - Connect your repository to Netlify
   - Netlify will automatically detect it's a Vite project

3. **Configure Environment Variables**
   - Go to Site settings > Environment variables
   - Add the following variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_DISCORD_WEBHOOK_URL`

4. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - These should be automatically detected

5. **Enable Continuous Deployment**
   - Every push to your main branch will trigger a new deployment

### Manual Deployment

Alternatively, you can deploy manually:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to your Netlify account
netlify login

# Deploy production build
npm run build
netlify deploy --prod
```

## Features

- Minecraft rank store
- Secure order processing
- Discord webhook notifications
- Supabase backend integration
- Order receipts with printing capability
- Responsive design

## Security Best Practices

1. **Environment Variables**: All secrets are stored in environment variables
2. **Validation**: Input validation for usernames and file uploads
3. **Error Handling**: Comprehensive error handling throughout the application
4. **Timeouts**: All network requests have timeouts to prevent hanging operations
5. **Secure Webhook Handling**: Discord webhook URLs are never exposed to clients 