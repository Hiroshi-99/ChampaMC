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

## Features

- Minecraft rank store
- Secure order processing
- Discord webhook notifications
- Supabase backend integration
- Responsive design

## Security Best Practices

1. **Environment Variables**: All secrets are stored in environment variables
2. **Validation**: Input validation for usernames and file uploads
3. **Error Handling**: Comprehensive error handling throughout the application
4. **Timeouts**: All network requests have timeouts to prevent hanging operations
5. **Secure Webhook Handling**: Discord webhook URLs are never exposed to clients 