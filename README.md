# Omnichannel Custom Chat Widget

A beautiful, custom chat widget built with the Omnichannel Chat SDK for Azure Static Web App.

## Features

✨ **Design Highlights:**
- Purple gradient header with agent information
- Responsive message display (agent messages, customer messages, system messages)
- Clean, modern UI matching the provided design
- Toggle, minimize, and close functionality
- Message input with action buttons (attachments, emoji, voice)
- Floating chat toggle button
- Light gray page background
- Smooth animations and transitions

## Configuration

Before deploying, update the configuration in `app.js`:

```javascript
const omnichannelConfig = {
    orgUrl: "https://your-org.omnichannelengagement.dynamics.com",
    orgId: "your-org-id",
    widgetId: "your-widget-id"
};
```

Get these values from:
1. Your Dynamics 365 Omnichannel admin panel
2. Widget configuration settings
3. Organization URL from your environment

## Local Development

### Prerequisites
- Node.js 14+ (optional, for local development)
- A modern web browser

### Install & Run Locally

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

The app will open at `http://localhost:8080`

## Deployment to Azure Static Web App

### Option 1: GitHub Integration (Recommended)

1. Push code to GitHub repository
2. Go to Azure Portal → Static Web Apps
3. Click "Create" → Select your repository
4. Configure build settings:
   - Build presets: Custom
   - App location: `/demo/azure-web-app`
   - Output location: (leave blank for static files)
5. Review and create

### Option 2: Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create -n myResourceGroup -l eastus

# Create static web app
az staticwebapp create \
  -n my-chat-widget \
  -g myResourceGroup \
  -s https://github.com/your-username/repo \
  -l eastus \
  -b main \
  --source-dir "demo/azure-web-app"
```

## File Structure

```
.
├── index.html                 # Main HTML structure
├── styles.css                 # Widget styling
├── app.js                      # Chat SDK integration & logic
├── staticwebapp.config.json    # Azure Static Web App config
├── package.json                # Dependencies
└── README.md                   # This file
```

## SDK Methods Used

- `initialize()` - Initialize the Chat SDK
- `startChat()` - Start a new chat session
- `sendMessage()` - Send a message
- `onNewMessage()` - Listen for incoming messages
- `onTypingEvent()` - Listen for typing indicators
- `onAgentEndSession()` - Handle session end
- `getLiveChat​Transcript()` - Download transcript

## Future Enhancements

- [ ] Emoji picker integration
- [ ] File attachment support
- [ ] Voice message recording
- [ ] Pre-chat survey
- [ ] Post-chat survey
- [ ] Persistent chat history
- [ ] Agent availability check

## Customization

### Change Colors

Edit the purple gradient in `styles.css`:
```css
background: linear-gradient(135deg, #c155d9 0%, #8b3fa6 100%);
```

### Change Agent Avatar

Replace "MO" in `index.html`:
```html
<div class="agent-avatar">YOUR_INITIALS</div>
```

### Change Page Background

Modify the background color in `styles.css`:
```css
background-color: #e8e8e8; /* Change this value */
```

## Support

For issues with the Chat SDK, refer to:
- [Omnichannel Chat SDK Documentation](https://github.com/microsoft/omnichannel-chat-sdk)
- [Development Guide](../../docs/DEVELOPMENT_GUIDE.md)
- [Troubleshooting Guide](../../docs/TROUBLESHOOTING_GUIDE.md)

## License

MIT
