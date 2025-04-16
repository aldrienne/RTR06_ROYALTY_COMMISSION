/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @description Data access functions for Royalty Management Suitelet
 */
define(['N/search', 'N/record', 'N/query', 'N/log', './constants', './utils'],
    function(search, record, query, log, constants, utils) {
        
        /**
         * Retrieves royalty records from the database
         * @returns {Array} - Array of royalty record objects
         */
        function getRoyaltyRecords() {
            try {
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
    
                // Return the mapped results
                return queryResults.asMappedResults();
            } catch (e) {
                log.error('Error retrieving royalty records', e.message);
                log.error('Error stack', e.stack);
                return [];
            }
        }
    
        /**
         * Retrieves royalty categories for filter dropdown
         * @returns {Array} - Array of royalty category objects with id, name, and percentage
         */
        function getRoyaltyCategories() {
            try {
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
    
                return queryResults.asMappedResults();
            } catch (e) {
                log.error('Error retrieving royalty categories', e);
                return [];
            }
        }
        
        /**
         * Gets royalty percentage and calculation method for a specific category
         * @param {string} categoryId - The selected category ID
         * @returns {Object|null} - Object with percentage and calculation method or null if not found
         */
        function getRoyaltyDetails(categoryId) {
            if (!categoryId) return null;
    
            try {
                const queryResult = query.runSuiteQL({
                    query: `
                    SELECT custrecord_tsc_royalty_percent, custrecord_tsc_calc_perc_by
                    FROM customrecord_tsc_royalty
                    WHERE id = ?
                `,
                    params: [categoryId]
                });
    
                const results = queryResult.asMappedResults();
    
                if (results.length > 0) {
                    return {
                        percentage: results[0].custrecord_tsc_royalty_percent !== null ? 
                            parseFloat(results[0].custrecord_tsc_royalty_percent) * 100 : 0,
                        calculationMethod: results[0].custrecord_tsc_calc_perc_by || ''
                    };
                }
                return null;
            } catch (e) {
                log.error('Error retrieving royalty details', e);
                return null;
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
            getRoyaltyRecords: getRoyaltyRecords,
            getRoyaltyCategories: getRoyaltyCategories,
            getRoyaltyDetails: getRoyaltyDetails,
            handleSaveConfigurations: handleSaveConfigurations
        };
    });