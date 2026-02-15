<?php

/**
 * @file plugins/generic/udsmInsights/pages/UdsmInsightsHandler.inc.php
 *
 * Copyright (c) 2024-2026 University of Dar es Salaam
 * Distributed under the GNU GPL v3.
 *
 * @class UdsmInsightsHandler
 * @ingroup plugins_generic_udsmInsights
 *
 * @brief Handle requests for the UDSM Insights dashboard page
 */

import('classes.handler.Handler');

class UdsmInsightsHandler extends Handler {

    /** @var UdsmInsightsPlugin Plugin instance */
    private $_plugin;

    /**
     * Constructor
     */
    public function __construct() {
        parent::__construct();
        
        // Get the plugin instance
        $this->_plugin = PluginRegistry::getPlugin('generic', 'udsminsightsplugin');
        
        // Role assignments: Manager/Admin for full access, Reader for public view
        $this->addRoleAssignment(
            array(ROLE_ID_MANAGER, ROLE_ID_SITE_ADMIN),
            array('index', 'embed', 'settings')
        );
        
        // Public view is accessible to everyone (if enabled in settings)
        $this->addRoleAssignment(
            array(ROLE_ID_READER, ROLE_ID_AUTHOR, ROLE_ID_REVIEWER),
            array('public')
        );
    }

    /**
     * @copydoc PKPHandler::authorize()
     */
    public function authorize($request, &$args, $roleAssignments) {
        $op = $request->getRouter()->getRequestedOp($request);
        
        // Public view doesn't require authentication if enabled
        if ($op === 'public') {
            $context = $request->getContext();
            $isPublicEnabled = $this->_plugin->getSetting($context->getId(), 'enablePublicView');
            
            if ($isPublicEnabled) {
                // No authorization needed for public view
                return true;
            }
        }
        
        import('lib.pkp.classes.security.authorization.ContextAccessPolicy');
        $this->addPolicy(new ContextAccessPolicy($request, $roleAssignments));
        return parent::authorize($request, $args, $roleAssignments);
    }

    /**
     * Display the insights dashboard (full page, requires login)
     * @param $args array
     * @param $request PKPRequest
     */
    public function index($args, $request) {
        $this->setupTemplate($request);
        $context = $request->getContext();
        $templateMgr = TemplateManager::getManager($request);
        
        // Get plugin settings
        $settings = $this->_getPluginSettings($context->getId());
        
        // Pass settings to template as JSON for the React app
        $templateMgr->assign(array(
            'pageTitle' => __('plugins.generic.udsmInsights.dashboard.title'),
            'pluginSettings' => json_encode($settings),
            'assetsUrl' => $this->_plugin->getPluginAssetsUrl($request),
            'journalPath' => $context->getPath(),
            'journalId' => $context->getId(),
            'journalName' => $context->getLocalizedName(),
            'baseUrl' => $request->getBaseUrl(),
            'isPublic' => false,
        ));
        
        $templateMgr->display($this->_plugin->getTemplatePath() . 'dashboard.tpl');
    }

    /**
     * Display public view of insights (limited metrics, no login required)
     * @param $args array
     * @param $request PKPRequest
     */
    public function public($args, $request) {
        $context = $request->getContext();
        
        // Check if public view is enabled
        $isPublicEnabled = $this->_plugin->getSetting($context->getId(), 'enablePublicView');
        if (!$isPublicEnabled) {
            // Redirect to login or show error
            $request->redirect(null, 'login');
            return;
        }
        
        $templateMgr = TemplateManager::getManager($request);
        
        // Get plugin settings (may limit what's passed for public view)
        $settings = $this->_getPublicSettings($context->getId());
        
        $templateMgr->assign(array(
            'pageTitle' => __('plugins.generic.udsmInsights.dashboard.title'),
            'pluginSettings' => json_encode($settings),
            'assetsUrl' => $this->_plugin->getPluginAssetsUrl($request),
            'journalPath' => $context->getPath(),
            'journalId' => $context->getId(),
            'journalName' => $context->getLocalizedName(),
            'baseUrl' => $request->getBaseUrl(),
            'isPublic' => true,
        ));
        
        $templateMgr->display($this->_plugin->getTemplatePath() . 'dashboard.tpl');
    }

    /**
     * Return embeddable dashboard (for iframe)
     * @param $args array
     * @param $request PKPRequest
     */
    public function embed($args, $request) {
        $context = $request->getContext();
        $templateMgr = TemplateManager::getManager($request);
        
        // Get plugin settings
        $settings = $this->_getPluginSettings($context->getId());
        
        $templateMgr->assign(array(
            'pluginSettings' => json_encode($settings),
            'assetsUrl' => $this->_plugin->getPluginAssetsUrl($request),
            'journalPath' => $context->getPath(),
            'journalId' => $context->getId(),
            'journalName' => $context->getLocalizedName(),
            'baseUrl' => $request->getBaseUrl(),
            'embedded' => true,
        ));
        
        $templateMgr->display($this->_plugin->getTemplatePath() . 'embed.tpl');
    }

    /**
     * Get plugin settings as array (full settings for authenticated users)
     * @param $contextId int
     * @return array
     */
    private function _getPluginSettings($contextId) {
        return array(
            'matomoUrl' => $this->_plugin->getSetting($contextId, 'matomoUrl'),
            'matomoSiteId' => $this->_plugin->getSetting($contextId, 'matomoSiteId'),
            'matomoToken' => $this->_plugin->getSetting($contextId, 'matomoToken'),
            'fastStatsApiUrl' => $this->_plugin->getSetting($contextId, 'fastStatsApiUrl'),
            'jwtToken' => $this->_plugin->getSetting($contextId, 'jwtToken'),
            'enableRealtime' => $this->_plugin->getSetting($contextId, 'enableRealtime'),
            'refreshInterval' => $this->_plugin->getSetting($contextId, 'refreshInterval') ?: 60,
        );
    }

    /**
     * Get limited settings for public view (no sensitive tokens)
     * @param $contextId int
     * @return array
     */
    private function _getPublicSettings($contextId) {
        return array(
            'matomoUrl' => $this->_plugin->getSetting($contextId, 'matomoUrl'),
            'matomoSiteId' => $this->_plugin->getSetting($contextId, 'matomoSiteId'),
            // No auth token for public - use read-only Matomo widget access
            'matomoToken' => '',  
            'fastStatsApiUrl' => $this->_plugin->getSetting($contextId, 'fastStatsApiUrl'),
            // No JWT for public - API should have public endpoints
            'jwtToken' => '',     
            'enableRealtime' => false, // Disable real-time for public
            'refreshInterval' => 300, // Slower refresh for public
            'publicMode' => true,
        );
    }
}
