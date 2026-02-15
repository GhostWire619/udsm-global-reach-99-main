<?php

/**
 * @file plugins/generic/udsmInsights/UdsmInsightsPlugin.inc.php
 *
 * Copyright (c) 2024-2026 University of Dar es Salaam
 * Distributed under the GNU GPL v3.
 *
 * @class UdsmInsightsPlugin
 * @ingroup plugins_generic_udsmInsights
 *
 * @brief UDSM Insights Dashboard Plugin - Embeds analytics dashboard into OJS
 */

import('lib.pkp.classes.plugins.GenericPlugin');

class UdsmInsightsPlugin extends GenericPlugin {

    /**
     * @copydoc Plugin::register()
     */
    public function register($category, $path, $mainContextId = null) {
        $success = parent::register($category, $path, $mainContextId);
        if ($success && $this->getEnabled()) {
            // Register hooks
            HookRegistry::register('LoadHandler', array($this, 'loadPageHandler'));
            HookRegistry::register('Templates::Manager::Index::ManagementPages', array($this, 'addManagementLink'));
        }
        return $success;
    }

    /**
     * @copydoc Plugin::getDisplayName()
     */
    public function getDisplayName() {
        return __('plugins.generic.udsmInsights.displayName');
    }

    /**
     * @copydoc Plugin::getDescription()
     */
    public function getDescription() {
        return __('plugins.generic.udsmInsights.description');
    }

    /**
     * @copydoc Plugin::getActions()
     */
    public function getActions($request, $actionArgs) {
        $router = $request->getRouter();
        import('lib.pkp.classes.linkAction.request.AjaxModal');
        return array_merge(
            $this->getEnabled() ? array(
                new LinkAction(
                    'settings',
                    new AjaxModal(
                        $router->url($request, null, null, 'manage', null, array('verb' => 'settings', 'plugin' => $this->getName(), 'category' => 'generic')),
                        $this->getDisplayName()
                    ),
                    __('manager.plugins.settings'),
                    null
                ),
                new LinkAction(
                    'openDashboard',
                    new RedirectAction(
                        $router->url($request, null, 'insights', 'index')
                    ),
                    __('plugins.generic.udsmInsights.openDashboard'),
                    null
                ),
            ) : array(),
            parent::getActions($request, $actionArgs)
        );
    }

    /**
     * @copydoc Plugin::manage()
     */
    public function manage($args, $request) {
        switch ($request->getUserVar('verb')) {
            case 'settings':
                $context = $request->getContext();
                $templateMgr = TemplateManager::getManager($request);
                $templateMgr->registerPlugin('function', 'plugin_url', array($this, 'smartyPluginUrl'));
                
                $this->import('UdsmInsightsSettingsForm');
                $form = new UdsmInsightsSettingsForm($this, $context->getId());
                
                if ($request->getUserVar('save')) {
                    $form->readInputData();
                    if ($form->validate()) {
                        $form->execute();
                        return new JSONMessage(true);
                    }
                } else {
                    $form->initData();
                }
                return new JSONMessage(true, $form->fetch($request));
        }
        return parent::manage($args, $request);
    }

    /**
     * Add insights link to management pages
     */
    public function addManagementLink($hookName, $args) {
        $templateMgr =& $args[1];
        $output =& $args[2];
        
        $request = Application::get()->getRequest();
        $router = $request->getRouter();
        
        $output .= '<li><a href="' . $router->url($request, null, 'insights', 'index') . '">' . 
                   '<span class="fa fa-chart-line" aria-hidden="true"></span> ' .
                   __('plugins.generic.udsmInsights.menuItem') . '</a></li>';
        
        return false;
    }

    /**
     * Load the insights page handler
     */
    public function loadPageHandler($hookName, $args) {
        $page = $args[0];
        
        if ($page === 'insights') {
            $this->import('pages/UdsmInsightsHandler');
            define('HANDLER_CLASS', 'UdsmInsightsHandler');
            return true;
        }
        
        return false;
    }

    /**
     * Get the plugin's assets (CSS/JS) URL
     */
    public function getPluginAssetsUrl($request) {
        return $request->getBaseUrl() . '/' . $this->getPluginPath() . '/assets';
    }

    /**
     * @copydoc Plugin::getInstallSitePluginSettingsFile()
     */
    public function getInstallSitePluginSettingsFile() {
        return $this->getPluginPath() . '/settings.xml';
    }

    /**
     * @copydoc Plugin::getTemplatePath()
     */
    public function getTemplatePath($inCore = false) {
        return $this->getPluginPath() . '/templates/';
    }
}
