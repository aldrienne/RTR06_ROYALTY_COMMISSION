/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @description Data access functions for Royalty Management Suitelet
 */
define(['N/search', 'N/record', 'N/query', 'N/log', './constants', './utils'],
function(search, record, query, log, constants, utils) {
    
    /**
     * Helper function to load royalty records into the sublist
     * @param {serverWidget.Sublist} sublist - The sublist to populate
     */
    function loadRoyaltyRecords(sublist) {
        try {
            // Use N/query instead of N/search
            const queryResults = query.runSuiteQL({
                query: `
                    SELECT
                        id,
                        name,
                        custrecord_tsc_royalty_percent,
                        custrecord_tsc_previous_percent,
                        custrecord_tsc_calc_perc_by,
                        TO_CHAR(lastmodified, 'MM/DD/YYYY HH:MI:SS AM') as lastmodified
                    FROM
                        customrecord_tsc_royalty
                    WHERE
                        isinactive = 'F'
                    ORDER BY
                        name ASC
                `
            });

            // Get the mapped results
            const records = queryResults.asMappedResults();

            log.audit('Royalty Records', records.length);

            let lineCount = 0;

            // Explicitly iterate through array with for loop instead of forEach
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
                        value: (parseFloat(result.custrecord_tsc_royalty_percent) * 100).toString()
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

                // Inside the loop where you're setting sublist values:
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
            log.error('Error loading royalty records', e.message);
            log.error('Error stack', e.stack);
        }
    }

    /**
     * Helper function to populate the royalty category filter dropdown
     * @param {serverWidget.Field} selectField - The select field to populate
     */
    function populateRoyaltyCategoryFilter(selectField) {
        try {
            // Use N/query instead of N/search
            const queryResults = query.runSuiteQL({
                query: `
                SELECT
                    id,
                    name,
                    custrecord_tsc_royalty_percent
                FROM
                    customrecord_tsc_royalty
                WHERE
                    isinactive = 'F'
                ORDER BY
                    name ASC
            `
            });

            // Get the mapped results
            const records = queryResults.asMappedResults();

            // Add options to select field
            records.forEach(function (result) {
                selectField.addSelectOption({
                    value: result.id.toString(),
                    text: result.name
                });
            });

        } catch (e) {
            log.error('Error populating royalty category filter', e);
        }
    }
    
    /**
     * Updates the percentage field based on selected category
     * @param {serverWidget.Form} form - The form object
     * @param {string} categoryId - The selected category ID
     */
    function updatePercentageField(form, categoryId) {
        if (!categoryId) return;

        try {
            // Query the percentage for this category
            const queryResult = query.runSuiteQL({
                query: `
                SELECT custrecord_tsc_royalty_percent, custrecord_tsc_calc_perc_by
                FROM customrecord_tsc_royalty
                WHERE id = ?
            `,
                params: [categoryId]
            });

            const results = queryResult.asMappedResults();

            if (results.length > 0 && results[0].custrecord_tsc_royalty_percent !== null) {
                const percentageField = form.getField({ id: constants.FIELD_CATEGORY_PERCENTAGE });
                percentageField.defaultValue = parseFloat(results[0].custrecord_tsc_royalty_percent) * 100;

                // Set the calculation method
                const calcMethodField = form.getField({ id: constants.FIELD_CATEGORY_CALCULATION_METHOD });
                calcMethodField.defaultValue = results[0].custrecord_tsc_calc_perc_by;
            }
        } catch (e) {
            log.error('Error updating percentage field', e);
        }
    }

    /**
     * Handles saving configuration changes
     * @param {Object} scriptContext
     */
    function handleSaveConfigurations(scriptContext) {
        const request = scriptContext.request;

        // Get line count from the sublist
        const lineCount = request.getLineCount({
            group: constants.SUBLIST_ROYALTY_CATEGORIES
        });

        // Process each line
        for (let i = 0; i < lineCount; i++) {
            const categoryId = request.getSublistValue({
                group: constants.SUBLIST_ROYALTY_CATEGORIES,
                name: constants.SUBLIST_FIELD_CATEGORY_ID,
                line: i
            });

            const splitPercentage = request.getSublistValue({
                group: constants.SUBLIST_ROYALTY_CATEGORIES,
                name: constants.SUBLIST_FIELD_SPLIT_PERCENTAGE,
                line: i
            });

            const previousSplitPercentage = request.getSublistValue({
                group: constants.SUBLIST_ROYALTY_CATEGORIES,
                name: constants.SUBLIST_FIELD_PREVIOUS_PERCENTAGE,
                line: i
            });

            // Get calculation method value
            const calcPercentBy = request.getSublistValue({
                group: constants.SUBLIST_ROYALTY_CATEGORIES,
                name: constants.SUBLIST_FIELD_CALC_PERC_BY,
                line: i
            });

            log.audit('values', { splitPercentage, previousSplitPercentage, calcPercentBy });

            // Use Record.submitfields with updated values object
            record.submitFields({
                type: constants.RECORD_TYPE_ROYALTY,
                id: categoryId,
                values: {
                    [constants.FIELD_ROYALTY_PERCENT]: splitPercentage,
                    [constants.FIELD_PREVIOUS_PERCENT]: previousSplitPercentage,
                    [constants.FIELD_CALC_PERC_BY]: calcPercentBy
                }
            });
        }
    }
    
    return {
        loadRoyaltyRecords: loadRoyaltyRecords,
        populateRoyaltyCategoryFilter: populateRoyaltyCategoryFilter,
        updatePercentageField: updatePercentageField,
        handleSaveConfigurations: handleSaveConfigurations
    };
});