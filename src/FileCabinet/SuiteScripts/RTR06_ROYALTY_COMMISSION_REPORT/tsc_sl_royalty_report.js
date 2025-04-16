/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @description Royalty/Commission Management Suitelet
 */
define([
    'N/ui/serverWidget', 
    'N/search', 
    'N/record', 
    'N/format', 
    'N/url', 
    'N/query', 
    'N/redirect',
    'N/log',
    './modules/constants',
    './modules/ui',
    './modules/data',
    './modules/reporting',
    './modules/utils'
],
function(
    serverWidget, 
    search, 
    record, 
    format, 
    url, 
    query, 
    redirect,
    log,
    constants,
    ui,
    data,
    reporting,
    utils
) {
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    function onRequest(scriptContext) {
        try {
            if (scriptContext.request.method === 'GET') {
                handleGet(scriptContext);
            } else {
                handlePost(scriptContext);
            }
        } catch (e) {
            log.error('Royalty Management Suitelet Error', e.message);
            scriptContext.response.write('An error occurred: ' + e.message);
        }
    }

    /**
     * Handles GET requests
     * @param {Object} scriptContext
     */
    function handleGet(scriptContext) {
        const form = serverWidget.createForm({
            title: constants.FORM_TITLE,
            hideNavBar: false
        });

        // Add client script to form
        form.clientScriptModulePath = './tsc_cs_royalty_report.js';

        const reportingTab = form.addTab({
            id: constants.TAB_REPORTING,
            label: 'Reporting'
        });

        // Add a tab for the two main sections
        const configTab = form.addTab({
            id: constants.TAB_CONFIG,
            label: 'Configuration'
        });

        // Create Reporting Tab Content
        ui.createReportingTab(form, reportingTab);

        // Create Configuration Tab Content
        ui.createConfigurationTab(form, configTab);

        // Add submit button
        form.addSubmitButton({
            label: 'Save Configuration'
        });

        // Check if we need to run a report based on request parameters
        const action = scriptContext.request.parameters[constants.FIELD_ACTION];

        // Set filter values if they exist in parameters
        ui.setFilterValuesFromRequest(form, scriptContext.request);

        if (action === constants.ACTION_REPORT) {
            // Generate report based on filters
            reporting.generateReport(form, scriptContext.request);
        } else if (action === constants.ACTION_EXPORT_CSV) {
            // Handle CSV export - this will bypass normal form rendering
            return reporting.exportReportToCSV(scriptContext);
        }

        scriptContext.response.writePage(form);
    }

    /**
     * Handles POST requests
     * @param {Object} scriptContext
     */
    function handlePost(scriptContext) {
        // Save configurations
        data.handleSaveConfigurations(scriptContext);
        redirect.toSuitelet({
            scriptId: constants.SUITELET_ID,
            deploymentId: constants.SUITELET_DEPLOYMENT_ID
        });
    }

    return {
        onRequest: onRequest
    };
});