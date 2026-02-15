<?php

/**
 * @file plugins/generic/udsmInsights/UdsmInsightsSettingsForm.inc.php
 *
 * Copyright (c) 2024-2026 University of Dar es Salaam
 * Distributed under the GNU GPL v3.
 *
 * @class UdsmInsightsSettingsForm
 * @ingroup plugins_generic_udsmInsights
 *
 * @brief Form for journal managers to configure the UDSM Insights plugin
 */

import('lib.pkp.classes.form.Form');

class UdsmInsightsSettingsForm extends Form {

    /** @var int Context ID */
    private $_contextId;

    /** @var UdsmInsightsPlugin Plugin instance */
    private $_plugin;

    /**
     * Constructor
     * @param $plugin UdsmInsightsPlugin
     * @param $contextId int
     */
    public function __construct($plugin, $contextId) {
        $this->_contextId = $contextId;
        $this->_plugin = $plugin;

        parent::__construct($plugin->getTemplatePath() . 'settingsForm.tpl');

        // Add form validators
        $this->addCheck(new FormValidatorUrl($this, 'matomoUrl', 'optional', 'plugins.generic.udsmInsights.settings.matomoUrl'));
        $this->addCheck(new FormValidatorUrl($this, 'fastStatsApiUrl', 'optional', 'plugins.generic.udsmInsights.settings.fastStatsApiUrl'));
        $this->addCheck(new FormValidatorPost($this));
        $this->addCheck(new FormValidatorCSRF($this));
    }

    /**
     * Initialize form data
     */
    public function initData() {
        $this->_data = array(
            'matomoUrl' => $this->_plugin->getSetting($this->_contextId, 'matomoUrl'),
            'matomoSiteId' => $this->_plugin->getSetting($this->_contextId, 'matomoSiteId'),
            'matomoToken' => $this->_plugin->getSetting($this->_contextId, 'matomoToken'),
            'fastStatsApiUrl' => $this->_plugin->getSetting($this->_contextId, 'fastStatsApiUrl'),
            'jwtToken' => $this->_plugin->getSetting($this->_contextId, 'jwtToken'),
            'enableRealtime' => $this->_plugin->getSetting($this->_contextId, 'enableRealtime'),
            'enablePublicView' => $this->_plugin->getSetting($this->_contextId, 'enablePublicView'),
            'refreshInterval' => $this->_plugin->getSetting($this->_contextId, 'refreshInterval') ?: 60,
        );
    }

    /**
     * Assign form data to user-submitted data
     */
    public function readInputData() {
        $this->readUserVars(array(
            'matomoUrl',
            'matomoSiteId',
            'matomoToken',
            'fastStatsApiUrl',
            'jwtToken',
            'enableRealtime',
            'enablePublicView',
            'refreshInterval',
        ));
    }

    /**
     * @copydoc Form::fetch()
     */
    public function fetch($request, $template = null, $display = false) {
        $templateMgr = TemplateManager::getManager($request);
        $templateMgr->assign('pluginName', $this->_plugin->getName());
        return parent::fetch($request, $template, $display);
    }

    /**
     * @copydoc Form::execute()
     */
    public function execute(...$functionArgs) {
        $this->_plugin->updateSetting($this->_contextId, 'matomoUrl', trim($this->getData('matomoUrl')));
        $this->_plugin->updateSetting($this->_contextId, 'matomoSiteId', trim($this->getData('matomoSiteId')));
        $this->_plugin->updateSetting($this->_contextId, 'matomoToken', trim($this->getData('matomoToken')));
        $this->_plugin->updateSetting($this->_contextId, 'fastStatsApiUrl', trim($this->getData('fastStatsApiUrl')));
        $this->_plugin->updateSetting($this->_contextId, 'jwtToken', trim($this->getData('jwtToken')));
        $this->_plugin->updateSetting($this->_contextId, 'enableRealtime', (bool)$this->getData('enableRealtime'));
        $this->_plugin->updateSetting($this->_contextId, 'enablePublicView', (bool)$this->getData('enablePublicView'));
        $this->_plugin->updateSetting($this->_contextId, 'refreshInterval', max(30, (int)$this->getData('refreshInterval')));
        
        parent::execute(...$functionArgs);
    }
}
