/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @description Client Script for Royalty Management Suitelet
 */
define(['N/currentRecord', 'N/url', 'N/runtime', 'N/https'],
    
    function(currentRecord, url, runtime, https) {

        function pageInit(context) {
            console.log('Page initialized');
        }

        const SUITELET_ID = "customscript_tsc_sl_royalty_report";
        const SUITELET_DEPLOYMENT_ID = "customdeploy1";

        //Restlet for generating the report as a csv
        const RESTLET_ID = "customscript_tsc_rl_royalty_report";
        const RESTLET_DEPLOYMENT_ID = "customdeploy1";
        
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
                const fromDate = currRecord.getText({ fieldId: 'custpage_date_from' }) || '';
                const toDate = currRecord.getText({ fieldId: 'custpage_date_to' }) || '';
                const categoryId = currRecord.getValue({ fieldId: 'custpage_category_filter' }) || '';    
                const subsidiaryId = currRecord.getValue({ fieldId: 'custpage_subsidiary_filter' }) || '';  
                
                console.log('CSV Export - From Date:', fromDate);
                console.log('CSV Export - To Date:', toDate);
                
                // Show loading message
                alert('Generating CSV file, please wait...');
                
                // Call RESTlet to generate the CSV file
                const restletUrl = url.resolveScript({
                    scriptId: RESTLET_ID,
                    deploymentId: RESTLET_DEPLOYMENT_ID,
                    params: {
                        custpage_date_from: fromDate,
                        custpage_date_to: toDate,
                        custpage_category_filter: categoryId,
                        custpage_subsidiary_filter: subsidiaryId
                    }
                });                                
                
                // Make GET request to the RESTlet
                https.get.promise({
                    url: restletUrl,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function(response) {
                    // Parse the response
                    var responseBody = JSON.parse(response.body);
                    
                    if (responseBody.error) {
                        throw new Error(responseBody.error);
                    }
                    
                    if (responseBody.url) {
                        // Open the file URL in a new window to trigger download
                        window.open(responseBody.url, '_blank');
                    } else {
                        throw new Error('No file URL returned from server');
                    }
                }).catch(function(error) {
                    console.error('Error in CSV export', error);
                    alert('Error generating CSV file: ' + error.message);
                });
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