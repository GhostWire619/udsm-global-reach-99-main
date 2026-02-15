<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UDSM Insights - {$journalName|escape}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
        #udsm-insights-root {
            width: 100%;
            height: 100%;
        }
        
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: linear-gradient(135deg, #235dcb 0%, #1a4d9e 100%);
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
        }
        
        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(255,255,255,0.2);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .loading-text {
            margin-top: 1.5rem;
            font-size: 1rem;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="loading-container" id="insights-loading">
        <div class="spinner"></div>
        <p class="loading-text">Loading UDSM Insights...</p>
    </div>
    <div id="udsm-insights-root"></div>
    
    <script>
        window.UDSM_INSIGHTS_CONFIG = {
            settings: {$pluginSettings},
            journalPath: "{$journalPath|escape:'javascript'}",
            journalId: {$journalId|escape:'javascript'},
            journalName: "{$journalName|escape:'javascript'}",
            baseUrl: "{$baseUrl|escape:'javascript'}",
            assetsUrl: "{$assetsUrl|escape:'javascript'}",
            embedded: true
        };
    </script>
    
    <link rel="stylesheet" href="{$assetsUrl}/index.css">
    <script type="module" src="{$assetsUrl}/index.js"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var checkMount = setInterval(function() {
                var root = document.getElementById('udsm-insights-root');
                if (root && root.children.length > 0) {
                    document.getElementById('insights-loading').style.display = 'none';
                    clearInterval(checkMount);
                }
            }, 100);
        });
    </script>
</body>
</html>
