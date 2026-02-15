{**
 * templates/settingsForm.tpl
 *
 * Copyright (c) 2024-2026 University of Dar es Salaam
 * Distributed under the GNU GPL v3.
 *
 * UDSM Insights Plugin Settings Form
 *}
<script>
    $(function() {ldelim}
        // Attach the form handler
        $('#udsmInsightsSettingsForm').pkpHandler('$.pkp.controllers.form.AjaxFormHandler');
    {rdelim});
</script>

<form 
    class="pkp_form" 
    id="udsmInsightsSettingsForm" 
    method="post" 
    action="{url router=$smarty.const.ROUTE_COMPONENT op="manage" category="generic" plugin=$pluginName verb="settings" save=true}"
>
    {csrf}
    
    {fbvFormArea id="udsmInsightsSettings"}
        
        {* Matomo Settings Section *}
        <div class="section">
            <h4>{translate key="plugins.generic.udsmInsights.settings"} - Matomo Analytics</h4>
            
            {fbvFormSection}
                {fbvElement 
                    type="text" 
                    id="matomoUrl" 
                    value=$matomoUrl 
                    label="plugins.generic.udsmInsights.settings.matomoUrl"
                    description="plugins.generic.udsmInsights.settings.matomoUrl.description"
                    size=$fbvStyles.size.LARGE
                }
            {/fbvFormSection}
            
            {fbvFormSection}
                {fbvElement 
                    type="text" 
                    id="matomoSiteId" 
                    value=$matomoSiteId 
                    label="plugins.generic.udsmInsights.settings.matomoSiteId"
                    description="plugins.generic.udsmInsights.settings.matomoSiteId.description"
                    size=$fbvStyles.size.SMALL
                }
            {/fbvFormSection}
            
            {fbvFormSection}
                {fbvElement 
                    type="text" 
                    id="matomoToken" 
                    value=$matomoToken 
                    label="plugins.generic.udsmInsights.settings.matomoToken"
                    description="plugins.generic.udsmInsights.settings.matomoToken.description"
                    size=$fbvStyles.size.LARGE
                    password=true
                }
            {/fbvFormSection}
        </div>
        
        {* Fast Stats API Section *}
        <div class="section">
            <h4>{translate key="plugins.generic.udsmInsights.settings"} - Fast Stats API</h4>
            
            {fbvFormSection}
                {fbvElement 
                    type="text" 
                    id="fastStatsApiUrl" 
                    value=$fastStatsApiUrl 
                    label="plugins.generic.udsmInsights.settings.fastStatsApiUrl"
                    description="plugins.generic.udsmInsights.settings.fastStatsApiUrl.description"
                    size=$fbvStyles.size.LARGE
                }
            {/fbvFormSection}
            
            {fbvFormSection}
                {fbvElement 
                    type="textarea" 
                    id="jwtToken" 
                    value=$jwtToken 
                    label="plugins.generic.udsmInsights.settings.jwtToken"
                    description="plugins.generic.udsmInsights.settings.jwtToken.description"
                    rich=false
                    height=$fbvStyles.height.SHORT
                }
            {/fbvFormSection}
        </div>
        
        {* Display Options Section *}
        <div class="section">
            <h4>{translate key="plugins.generic.udsmInsights.settings"} - Display Options</h4>
            
            {fbvFormSection list=true}
                {fbvElement 
                    type="checkbox" 
                    id="enableRealtime" 
                    checked=$enableRealtime 
                    label="plugins.generic.udsmInsights.settings.enableRealtime"
                }
                {fbvElement 
                    type="checkbox" 
                    id="enablePublicView" 
                    checked=$enablePublicView 
                    label="plugins.generic.udsmInsights.settings.enablePublicView"
                }
            {/fbvFormSection}
            
            {fbvFormSection}
                {fbvElement 
                    type="text" 
                    id="refreshInterval" 
                    value=$refreshInterval 
                    label="plugins.generic.udsmInsights.settings.refreshInterval"
                    description="plugins.generic.udsmInsights.settings.refreshInterval.description"
                    size=$fbvStyles.size.SMALL
                }
            {/fbvFormSection}
        </div>
        
    {/fbvFormArea}
    
    {fbvFormButtons}
</form>

<style>
    #udsmInsightsSettingsForm .section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    
    #udsmInsightsSettingsForm .section h4 {
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #235dcb;
        color: #235dcb;
        font-size: 1rem;
    }
</style>
