/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @description Client Script for Royalty Management Suitelet
 */
define(['N/currentRecord', 'N/url', 'N/runtime'],
    
    function(currentRecord, url, runtime) {

        function pageInit(context) {
            console.log('Page initialized');
        }

        let SUITELET_ID = "customscript_tsc_sl_royalty_report";
        let SUITELET_DEPLOYMENT_ID = "customdeploy1";
        
        /**
         * Function to be executed when 'Run Report' button is clicked
         * @param {Object} context
         */
        function runReport() {
            try {
                const currRecord = currentRecord.get();
                
                // Get filter values
                const fromDate = currRecord.getText({ fieldId: 'custpage_date_from' }) || '';
                const toDate = currRecord.getText({ fieldId: 'custpage_date_to' }) || '';
                const categoryId = currRecord.getValue({ fieldId: 'custpage_category_filter' }) || '';    
                const subsidiaryId = currRecord.getValue({ fieldId: 'custpage_subsidiary_filter' }) || '';  
                
                console.log('From Date:', fromDate);
                console.log('To Date:', toDate);
                
                const redirectUrl = url.resolveScript({
                    scriptId: SUITELET_ID,
                    deploymentId: SUITELET_DEPLOYMENT_ID,
                    params: {
                        custpage_action: 'report',
                        custpage_date_from: fromDate,
                        custpage_date_to: toDate,
                        custpage_category_filter: categoryId,
                        custpage_subsidiary_filter: subsidiaryId
                    }
                });
                
                //Open window
                window.open(redirectUrl, '_self');
            } catch (e) {
                console.error('Error in runReport function', e);
                alert('An error occurred while running the report: ' + e.message);
            }
        }
        
        /**
         * Function to be executed when 'Export CSV' button is clicked
         * @param {Object} context
         */
        function exportReportCSV() {
            try {
                const currRecord = currentRecord.get();
                
                // Get filter values
                const fromDate = currRecord.getValue({ fieldId: 'custpage_date_from' }) || '';
                const toDate = currRecord.getValue({ fieldId: 'custpage_date_to' }) || '';
                const categoryId = currRecord.getValue({ fieldId: 'custpage_category_filter' }) || '';
                
                // Build URL for redirect
                const scriptId = runtime.getCurrentScript().id;
                const deploymentId = runtime.getCurrentScript().deploymentId;
                
                const redirectUrl = url.resolveScript({
                    scriptId: scriptId,
                    deploymentId: deploymentId,
                    params: {
                        custpage_action: 'exportcsv',
                        custpage_date_from: fromDate,
                        custpage_date_to: toDate,
                        custpage_category: categoryId
                    }
                });
                
                // Redirect to the same Suitelet with filter parameters
                window.location.href = redirectUrl;
            } catch (e) {
                console.error('Error in exportReportCSV function', e);
                alert('An error occurred while exporting the report: ' + e.message);
            }
        }
        
        return {
            runReport: runReport,
            exportReportCSV: exportReportCSV,
            pageInit: pageInit
        };
    });