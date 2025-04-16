/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope Public
 * @description RESTlet for Royalty Report CSV Generation
 */
define([
    'N/log',
    'N/query',
    'N/search',
    'N/file',
    'N/runtime',
    './modules/constants',
    './modules/reporting',
    './modules/utils',
    './modules/data'
],
function(
    log, 
    query, 
    search, 
    file,
    runtime,
    constants,
    reporting,
    utils,
    data
) {

    const SCRIPT_PARAM_FOLDER = 'custscript_tsc_royalty_folder_id';
    /**
     * Function called upon sending a GET request to the RESTlet.
     * @param {Object} requestParams - Parameters from HTTP request URL
     * @returns {string|Object} Response to be returned
     */
    function onGet(requestParams) {
        try {
            log.debug('CSV Export RESTlet Request', requestParams);
            //Retrieve the folder id from parameter
            const folderId = runtime.getCurrentScript().getParameter(SCRIPT_PARAM_FOLDER);
            log.debug('Folder ID', folderId);

            if (!folderId) {
                throw new Error('Folder ID is not set in the script parameter.');
            }
            
            // Parse filter parameters
            const filterParams = {
                fromDate: requestParams.custpage_date_from || '',
                toDate: requestParams.custpage_date_to || '',
                categoryId: requestParams.custpage_category_filter || '',
                subsidiaryId: requestParams.custpage_subsidiary_filter || ''
            };
            
            // Get royalty percentage if a category is selected
            let royaltyPercentage = 0;
            let calculationMethod = '';
            let categoryName = 'All Categories';
            
            if (filterParams.categoryId) {
                const royaltyDetails = data.getRoyaltyDetails(filterParams.categoryId);
                if (royaltyDetails) {
                    royaltyPercentage = royaltyDetails.percentage;
                    calculationMethod = royaltyDetails.calculationMethod;
                    
                    // Get category name
                    const categoryData = data.getRoyaltyCategories().find(cat => 
                        cat.id.toString() === filterParams.categoryId);
                    if (categoryData) {
                        categoryName = categoryData.name;
                    }
                }
            }
            
            // Generate report data
            const results = reporting.createRoyaltyReportSearch(filterParams);
            
            // Generate CSV content
            const csvContent = generateCSV(results, {
                royaltyPercentage,
                calculationMethod,
                categoryName,
                fromDate: filterParams.fromDate,
                toDate: filterParams.toDate
            });
            
            // Create file
            const fileObj = file.create({
                name: 'royalty_report.csv',
                folder: folderId,
                fileType: file.Type.CSV,
                contents: csvContent
            });
            
            // Get file ID - this will save the file in NetSuite's file cabinet
            const fileId = fileObj.save();
            log.debug('fileId', fileId);
            
            // Load the file to get its URL
            const savedFile = file.load({
                id: fileId
            });
            
            // Return the file URL and ID for downloading
            return {
                fileId: fileId,
                url: savedFile.url
            };
        } catch (e) {
            log.error('Error in royalty report CSV export', e);
            
            // Return error message
            return {
                error: e.message
            };
        }
    }
    
    /**
     * Generates CSV content from report data
     * @param {Object} reportData - The report data
     * @param {Object} options - Report options
     * @returns {string} - CSV content
     */
    function generateCSV(reportData, options) {
        // Add report header with metadata
        let csvLines = [];
        
        const dateText = options.fromDate && options.toDate ? 
            `${options.fromDate} to ${options.toDate}` : 
            (options.fromDate ? `From ${options.fromDate}` : (options.toDate ? `To ${options.toDate}` : ''));
        
        csvLines.push('Royalty Report');
        csvLines.push(`Category: ${options.categoryName}`);
        if (dateText) csvLines.push(`Date Range: ${dateText}`);
        csvLines.push('');
        
        // Get calculation method name for display
        let calculationMethodName = '';
        if (options.calculationMethod == '1') {
            calculationMethodName = 'GROSS SALES';
        } else if (options.calculationMethod == '2') {
            calculationMethodName = 'NET PROFIT';
        }
        
        // Add CSV header
        csvLines.push('Royalty Category,Product,Order #,Date,Quantity,Rate,Gross Sales,Discounts,Net Sales,Taxes,Total Sales,Total Cost');
        
        // Process line data
        if (reportData.lines && reportData.lines.length > 0) {
            // Add data rows
            reportData.lines.forEach(line => {
                const csvRow = [
                    escapeCsvValue(line.roycalCategory || ''),
                    escapeCsvValue(line.productTitle || ''),
                    escapeCsvValue(line.orderNumber || ''),
                    escapeCsvValue(line.tranDate || ''),
                    line.quantity || '0',
                    line.rate || '0',
                    line.grossSale || '0',
                    line.amountDiscount || '0',
                    line.netSales || '0',
                    line.amountTax || '0',
                    line.totalSales || '0',
                    line.totalCost || '0'
                ];
                
                csvLines.push(csvRow.join(','));
            });
            
            // Add summary information
            csvLines.push('');
            csvLines.push(`Total Gross Sales,,,,,,,,,,,${reportData.totals.grossSales}`);
            csvLines.push(`Total Net Sales,,,,,,,,,,,${reportData.totals.netSales}`);
            csvLines.push(`Total Sales,,,,,,,,,,,${reportData.totals.totalSales}`);
            csvLines.push(`Total Cost,,,,,,,,,,,${reportData.totals.totalCost}`);
            csvLines.push(`Total Profit,,,,,,,,,,,${reportData.totals.totalProfit}`);
            
            // Add royalty calculation if applicable
            if (options.royaltyPercentage > 0) {
                const royaltyAmount = utils.calculateRoyalty(
                    reportData.totals.grossSales,
                    reportData.totals.totalProfit,
                    options.royaltyPercentage,
                    options.calculationMethod
                );
                
                csvLines.push(`(${calculationMethodName}) ${options.royaltyPercentage}% Royalty Split,,,,,,,,,,,${royaltyAmount}`);
            }
        } else {
            csvLines.push('No data found for the selected criteria');
        }
        
        return csvLines.join('\n');
    }
    
    /**
     * Escapes special characters in CSV values
     * @param {string} value - The value to escape
     * @returns {string} - Escaped value
     */
    function escapeCsvValue(value) {
        if (!value) return '';
        
        // Convert to string if not already
        const stringValue = String(value);
        
        // Check if we need to escape
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            // Escape double quotes with double quotes
            const escaped = stringValue.replace(/"/g, '""');
            // Wrap in quotes
            return `"${escaped}"`;
        }
        
        return stringValue;
    }
    
    return {
        get: onGet
    };
});