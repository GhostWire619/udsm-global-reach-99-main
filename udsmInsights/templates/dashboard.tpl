{**
 * templates/dashboard.tpl
 *
 * Copyright (c) 2024-2026 University of Dar es Salaam
 * Distributed under the GNU GPL v3.
 *
 * UDSM Insights Dashboard - Full page template
 *}
{include file="frontend/components/header.tpl" pageTitleTranslated=$pageTitle}

<style>
    /* Dashboard container styles */
    .udsm-insights-container {
        position: relative;
        width: 100%;
        min-height: calc(100vh - 200px);
        background: #f8fafc;
        border-radius: 8px;
        overflow: hidden;
    }
    
    .udsm-insights-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        color: #235dcb;
    }
    
    .udsm-insights-loading .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e2e8f0;
        border-top-color: #235dcb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .udsm-insights-error {
        padding: 2rem;
        text-align: center;
        color: #dc2626;
    }
    
    /* Hide OJS navigation in dashboard view */
    .pkp_structure_page .udsm-insights-fullscreen .pkp_structure_sidebar {
        display: none;
    }
    
    /* React app root */
    #udsm-insights-root {
        width: 100%;
        height: 100%;
    }
</style>

<div class="udsm-insights-container" id="insights-wrapper">
    <div class="udsm-insights-loading" id="insights-loading">
        <div class="spinner"></div>
        <p style="margin-top: 1rem;">{translate key="plugins.generic.udsmInsights.dashboard.loading"}</p>
    </div>
    <div id="udsm-insights-root"></div>
</div>

{* Pass configuration to React app *}
<script>
    window.UDSM_INSIGHTS_CONFIG = {
        settings: {$pluginSettings|escape:'javascript'},
        journalPath: "{$journalPath|escape:'javascript'}",
        journalId: {$journalId|escape:'javascript'},
        journalName: "{$journalName|escape:'javascript'}",
        baseUrl: "{$baseUrl|escape:'javascript'}",
        assetsUrl: "{$assetsUrl|escape:'javascript'}",
        embedded: false
    };
</script>

{* Load React app assets *}
<link rel="stylesheet" href="{$assetsUrl}/index.css">
<script type="module" src="{$assetsUrl}/index.js"></script>

<script>
    // Hide loading indicator once React mounts
    document.addEventListener('DOMContentLoaded', function() {
        // Check if React mounted
        var checkMount = setInterval(function() {
            var root = document.getElementById('udsm-insights-root');
            if (root && root.children.length > 0) {
                document.getElementById('insights-loading').style.display = 'none';
                clearInterval(checkMount);
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(function() {
            clearInterval(checkMount);
            var loading = document.getElementById('insights-loading');
            if (loading.style.display !== 'none') {
                loading.innerHTML = '<div class="udsm-insights-error">{translate key="plugins.generic.udsmInsights.dashboard.error"}</div>';
            }
        }, 10000);
    });
</script>

{include file="frontend/components/footer.tpl"}
