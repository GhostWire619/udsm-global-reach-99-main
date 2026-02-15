# UDSM Insights Dashboard - OJS Plugin

A comprehensive analytics dashboard plugin for Open Journal Systems (OJS) 3.3, providing real-time visitor tracking, citation metrics, global reach visualization, and engagement analytics.

## Features

- 📊 **Real-time Analytics** - Live visitor tracking via Matomo integration
- 📈 **Citation Metrics** - Crossref and OpenAlex citation counts
- 🌍 **Global Reach** - Interactive world map showing reader distribution
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast Stats API** - Direct OJS data integration
- 🎨 **UDSM Branding** - University of Dar es Salaam design system

## Requirements

- OJS 3.3.x
- PHP 7.4 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Matomo Analytics instance (optional but recommended)
- Fast Stats API endpoint (optional)

## Installation

### Method 1: Manual Installation

1. **Build the React dashboard**
   ```bash
   # In the project root directory
   npm install
   npm run build
   ```

2. **Prepare the plugin folder**
   ```bash
   # Create plugin directory structure
   mkdir -p udsmInsights/assets
   
   # Copy plugin files
   cp ojs-plugin/*.php udsmInsights/
   cp ojs-plugin/*.xml udsmInsights/
   cp -r ojs-plugin/locale udsmInsights/
   cp -r ojs-plugin/pages udsmInsights/
   cp -r ojs-plugin/templates udsmInsights/
   
   # Copy built React assets
   cp -r dist/* udsmInsights/assets/
   ```

3. **Upload to OJS**
   - Copy the `udsmInsights` folder to: `[OJS_ROOT]/plugins/generic/`
   - Final path: `[OJS_ROOT]/plugins/generic/udsmInsights/`

4. **Enable the plugin**
   - Log in to OJS as Site Admin or Journal Manager
   - Go to: Settings → Website → Plugins → Generic Plugins
   - Find "UDSM Insights Dashboard" and enable it
   - Click "Settings" to configure API endpoints

### Method 2: Using the Build Script

1. **Run the packaging script**
   ```bash
   npm run build:ojs-plugin
   ```

2. **Upload the generated archive**
   - Find `udsmInsights.tar.gz` in the project root
   - Upload via OJS Plugin Gallery or extract manually

## Configuration

After installation, configure the plugin via Settings:

### Matomo Analytics
| Setting | Description | Example |
|---------|-------------|---------|
| Matomo URL | Your Matomo instance URL | `https://analytics.udsm.ac.tz` |
| Site ID | Matomo site identifier | `1` |
| Auth Token | API authentication token | `abc123...` |

### Fast Stats API
| Setting | Description | Example |
|---------|-------------|---------|
| API URL | Fast Stats API endpoint | `https://api.journals.udsm.ac.tz` |
| JWT Token | Authentication token | `eyJ0eXA...` |

### Display Options
| Setting | Description | Default |
|---------|-------------|---------|
| Enable Real-time | Show live visitor activity | Yes |
| Refresh Interval | Auto-update frequency (seconds) | 60 |

## File Structure

```
udsmInsights/
├── UdsmInsightsPlugin.inc.php      # Main plugin class
├── UdsmInsightsSettingsForm.inc.php # Settings form handler
├── version.xml                      # Plugin version info
├── settings.xml                     # Default settings
├── locale/
│   └── en_US/
│       └── locale.xml               # English translations
├── pages/
│   └── UdsmInsightsHandler.inc.php  # Page request handler
├── templates/
│   ├── dashboard.tpl                # Full dashboard template
│   ├── embed.tpl                    # Embeddable iframe template
│   └── settingsForm.tpl             # Settings form template
└── assets/
    ├── index.js                     # React app bundle
    ├── index.css                    # Compiled styles
    └── ...                          # Other static assets
```

## Accessing the Dashboard

Once installed and enabled:

1. **From OJS Menu**: Settings → Insights Dashboard
2. **Direct URL**: `https://your-ojs-site.com/journal-path/insights`
3. **Embedded**: `https://your-ojs-site.com/journal-path/insights/embed`

## Permissions

The dashboard is accessible to:
- Site Administrators
- Journal Managers

Regular users and guests cannot access the analytics dashboard.

## Troubleshooting

### Dashboard not loading
- Check browser console for JavaScript errors
- Verify assets are properly copied to `assets/` folder
- Clear OJS cache: `php tools/clearDataCache.php`

### API connection errors
- Verify Matomo URL is accessible from OJS server
- Check JWT token is valid and not expired
- Ensure CORS is configured on API servers

### Permission denied
- Verify you're logged in as Manager or Admin
- Check plugin is enabled for the specific journal

## Development

### Building from source
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Build OJS plugin package
npm run build:ojs-plugin
```

### Customizing the dashboard
The React source is in `src/pages/Insights.tsx`. After making changes:
1. Run `npm run build`
2. Copy new assets to plugin `assets/` folder
3. Clear OJS cache

## License

Copyright (c) 2024-2026 University of Dar es Salaam  
Distributed under the GNU GPL v3 license.

## Support

For issues and feature requests, contact:
- Email: admin@udsm.ac.tz
- GitHub: [Create an issue](https://github.com/GhostWire619/udsm-global-reach-99-main/issues)
