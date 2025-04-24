/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @description UI-related functions for Royalty Management Suitelet
 */
define(['N/ui/serverWidget', 'N/log', './constants', './data'], 
    function(serverWidget, log, constants, data) {
        
        /**
         * Creates the Configuration tab content
         * @param {serverWidget.Form} form - The form object
         * @param {serverWidget.Tab} tab - The tab object
         */
        function createConfigurationTab(form, tab) {
            // Create editable sublist for royalty categories
            const categorySublist = form.addSublist({
                id: constants.SUBLIST_ROYALTY_CATEGORIES,
                type: serverWidget.SublistType.EDITOR,
                label: 'Royalty Categories',
                tab: constants.TAB_CONFIG
            });
    
            // Add sublist fields
            categorySublist.addField({
                id: constants.SUBLIST_FIELD_CATEGORY_ID,
                type: serverWidget.FieldType.TEXT,
                label: 'ID'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
    
            // Add Royalty Name field
            categorySublist.addField({
                id: constants.SUBLIST_FIELD_CATEGORY_NAME,
                type: serverWidget.FieldType.TEXT,
                label: 'Royalty'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
    
            // Add Split Percentage field
            categorySublist.addField({
                id: constants.SUBLIST_FIELD_SPLIT_PERCENTAGE,
                type: serverWidget.FieldType.PERCENT,
                label: 'Split (%)'
            });
    
            categorySublist.addField({
                id: constants.SUBLIST_FIELD_CALC_PERC_BY,
                type: 'select',
                label: 'Calculation Method',
                source: 'customlist_tsc_calc_perc_by'
            });
    
            // Add Previous Split Percentage field
            const prevPercentField = categorySublist.addField({
                id: constants.SUBLIST_FIELD_PREVIOUS_PERCENTAGE,
                type: serverWidget.FieldType.PERCENT,
                label: 'Previous Split (%)'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
    
            // Add Last Modified field
            categorySublist.addField({
                id: constants.SUBLIST_FIELD_LAST_MODIFIED,
                type: serverWidget.FieldType.DATETIMETZ,
                label: 'Last Modified'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
    
            // Populate the sublist with data from the data module
            populateRoyaltySublist(categorySublist);
        }
    
        /**
         * Populates the royalty sublist with data
         * @param {serverWidget.Sublist} sublist - The sublist to populate
         */
        function populateRoyaltySublist(sublist) {
            try {
                // Get royalty records from data module
                const records = data.getRoyaltyRecords();
                log.audit('Royalty Records', records.length);
    
                let lineCount = 0;
    
                // Populate the sublist with records
                for (let i = 0; i < records.length; i++) {
                    const result = records[i];
                    log.debug('Processing record', JSON.stringify(result) + ' at index ' + i);
    
                    // Set ID (hidden)
                    sublist.setSublistValue({
                        id: constants.SUBLIST_FIELD_CATEGORY_ID,
                        line: lineCount,
                        value: result.id.toString()
                    });
    
                    // Set Name/Royalty
                    sublist.setSublistValue({
                        id: constants.SUBLIST_FIELD_CATEGORY_NAME,
                        line: lineCount,
                        value: result.name || ''
                    });
    
                    // Set Split Percentage
                    if (result.custrecord_tsc_royalty_percent !== null) {
                        sublist.setSublistValue({
                            id: constants.SUBLIST_FIELD_SPLIT_PERCENTAGE,
                            line: lineCount,
                            value: Math.round(parseFloat(result.custrecord_tsc_royalty_percent) * 100).toString()
                        });
                    }
    
                    // Set Previous Split Percentage
                    if (result.custrecord_tsc_previous_percent !== null) {
                        sublist.setSublistValue({
                            id: constants.SUBLIST_FIELD_PREVIOUS_PERCENTAGE,
                            line: lineCount,
                            value: result.custrecord_tsc_previous_percent.toString()
                        });
                    }
    
                    // Set Last Modified
                    if (result.lastmodified) {
                        sublist.setSublistValue({
                            id: constants.SUBLIST_FIELD_LAST_MODIFIED,
                            line: lineCount,
                            value: result.lastmodified
                        });
                    }
    
                    // Set Calculation Method
                    if (result.custrecord_tsc_calc_perc_by) {
                        sublist.setSublistValue({
                            id: constants.SUBLIST_FIELD_CALC_PERC_BY,
                            line: lineCount,
                            value: result.custrecord_tsc_calc_perc_by.toString()
                        });
                    }
    
                    log.debug('Completed setting values for line', lineCount);
                    lineCount++;
                }
    
                log.debug('Royalty Records Processing Complete', lineCount + ' records loaded into sublist');
            } catch (e) {
                log.error('Error populating royalty sublist', e.message);
                log.error('Error stack', e.stack);
            }
        }
        
        /**
         * Creates the Reporting tab content
         * @param {serverWidget.Form} form - The form object
         * @param {serverWidget.Tab} tab - The tab object
         */
        function createReportingTab(form, tab) {
            // Add filter fieldgroup
            const filterGroup = form.addFieldGroup({
                id: constants.FIELD_GROUP_FILTERS,
                label: 'Filters',
                tab: constants.TAB_REPORTING
            });
    
            // Add date range fields
            form.addField({
                id: constants.FIELD_DATE_FROM,
                type: serverWidget.FieldType.DATE,
                label: 'From Date',
                container: constants.FIELD_GROUP_FILTERS
            });
    
            form.addField({
                id: constants.FIELD_DATE_TO,
                type: serverWidget.FieldType.DATE,
                label: 'To Date',
                container: constants.FIELD_GROUP_FILTERS
            });
    
            // Add category filter field
            const categoryField = form.addField({
                id: constants.FIELD_CATEGORY_FILTER,
                type: serverWidget.FieldType.SELECT,
                label: 'Royalty Category',
                container: constants.FIELD_GROUP_FILTERS
            });
    
            const subsidiaryField = form.addField({
                id: constants.FIELD_SUBSIDIARY_FILTER,
                type: serverWidget.FieldType.SELECT,
                label: "Subsidiary",
                source: "subsidiary",
                container: constants.FIELD_GROUP_FILTERS
            });
    
            // Add percentage display field
            const percentageField = form.addField({
                id: constants.FIELD_CATEGORY_PERCENTAGE,
                type: serverWidget.FieldType.PERCENT,
                label: 'Royalty Percentage',
                container: constants.FIELD_GROUP_FILTERS
            });
            percentageField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
    
            //ADD CALCULATION METHOD FIELD
            const calcMethodField = form.addField({
                id: constants.FIELD_CATEGORY_CALCULATION_METHOD,
                type: serverWidget.FieldType.SELECT,
                label: 'Calculation Method',
                source: 'customlist_tsc_calc_perc_by',
                container: constants.FIELD_GROUP_FILTERS
            });
            calcMethodField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
    
            // Add "All Categories" option
            // categoryField.addSelectOption({
            //     value: '',
            //     text: 'All Categories'
            // });
    
            // Populate the filter dropdown with royalty records
            populateCategoryFilter(categoryField);
    
            // Add "Run Report" button
            form.addButton({
                id: constants.BUTTON_RUN_REPORT,
                label: 'Run Report',
                functionName: 'runReport'
            });
    
            // Add Export button
            form.addButton({
                id: constants.BUTTON_EXPORT,
                label: 'Export CSV',
                functionName: 'exportReportCSV'
            });
    
            // Add an HTML field for the results table
            const resultsField = form.addField({
                id: constants.FIELD_RESULTS_HTML,
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ',
                container: constants.TAB_REPORTING  // Ensure it's in the reporting tab
            });
    
            // Set default content for the HTML field (empty table structure)
            let defaultHtml = `
        <div class="uir-field-wrapper uir-long-text" style="margin-top: 20px;">
            <div class="uir-field">
                <span class="smalltextb">Royalty Report Results</span>
                <div class="uir-field-value">
                    <table id="custpage_royalty_results" class="uir-table" style="width: 100%; margin-top: 10px; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Item Name</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Category</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Transaction</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Date</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Amount</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Royalty</th>
                            </tr>
                        </thead>
                        <tbody id="custpage_results_body">
                            <tr>
                                <td colspan="6" style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                                    No data to display. Please select filters and run the report.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    
            resultsField.defaultValue = defaultHtml;
        }
    
        /**
         * Populates the category filter dropdown with royalty categories
         * @param {serverWidget.Field} selectField - The select field to populate
         */
        function populateCategoryFilter(selectField) {
            try {
                // Get royalty categories from data module
                const records = data.getRoyaltyCategories();
    
                // Add options to select field
                records.forEach(function (result) {
                    selectField.addSelectOption({
                        value: result.id.toString(),
                        text: result.name
                    });
                });
            } catch (e) {
                log.error('Error populating category filter', e);
            }
        }
        
        /**
         * Sets filter values on the form based on request parameters
         * @param {serverWidget.Form} form - The form object
         * @param {ServerRequest} request - The request object
         */
        function setFilterValuesFromRequest(form, request) {
            const fromDate = request.parameters[constants.FIELD_DATE_FROM];
            const toDate = request.parameters[constants.FIELD_DATE_TO];
            const categoryId = request.parameters[constants.FIELD_CATEGORY_FILTER];
            const subsidiaryId = request.parameters[constants.FIELD_SUBSIDIARY_FILTER];
    
            if (fromDate) {
                form.getField({ id: constants.FIELD_DATE_FROM }).defaultValue = fromDate;
            }
    
            if (toDate) {
                form.getField({ id: constants.FIELD_DATE_TO }).defaultValue = toDate;
            }
    
            if (categoryId) {
                form.getField({ id: constants.FIELD_CATEGORY_FILTER }).defaultValue = categoryId;
    
                // Also set the percentage field if a category is selected
                updatePercentageField(form, categoryId);
            }
    
            if (subsidiaryId) {
                form.getField({ id: constants.FIELD_SUBSIDIARY_FILTER }).defaultValue = subsidiaryId;
            }
        }
    
        /**
         * Updates the percentage and calculation method fields based on selected category
         * @param {serverWidget.Form} form - The form object
         * @param {string} categoryId - The selected category ID
         */
        function updatePercentageField(form, categoryId) {
            if (!categoryId) return;
    
            try {
                // Get royalty details from data module
                const royaltyDetails = data.getRoyaltyDetails(categoryId);
                
                if (royaltyDetails) {
                    const percentageField = form.getField({ id: constants.FIELD_CATEGORY_PERCENTAGE });
                    percentageField.defaultValue = royaltyDetails.percentage;
    
                    // Set the calculation method
                    const calcMethodField = form.getField({ id: constants.FIELD_CATEGORY_CALCULATION_METHOD });
                    calcMethodField.defaultValue = royaltyDetails.calculationMethod;
                }
            } catch (e) {
                log.error('Error updating percentage field', e);
            }
        }
        
        return {
            createConfigurationTab: createConfigurationTab,
            createReportingTab: createReportingTab,
            setFilterValuesFromRequest: setFilterValuesFromRequest,
            updatePercentageField: updatePercentageField
        };
    });