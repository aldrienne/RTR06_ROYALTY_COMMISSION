/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @description Utility functions for Royalty Management Suitelet
 */
define(['N/log'], function (log) {

    /**
     * Helper function to format amount with two decimal places
     * @param {number|string} amount - The amount to format
     * @returns {string} - The formatted amount
     */
    function formatAmount(amount) {
        if (!amount) return '0.00';

        const num = parseFloat(amount);
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Safely logs errors with full details
     * @param {string} title - Error title
     * @param {Error} error - Error object
     */
    function logError(title, error) {
        log.error(title, error.message);
        if (error.stack) {
            log.error(title + ' stack', error.stack);
        }
    }

    /**
 * Calculates royalty amount based on calculation method and percentage
 * @param {number} grossSales - Total gross sales amount
 * @param {number} totalProfit - Total profit amount
 * @param {number} percentage - Royalty percentage (as a whole number, e.g., 15 for 15%)
 * @param {string} calculationMethodId - The calculation method ID
 * @returns {number} - Calculated royalty amount
 */
    function calculateRoyalty(grossSales, totalProfit, percentage, calculationMethodId) {
        log.emergency('calculateRoyalty', {
            grossSales: grossSales,
            totalProfit: totalProfit,
            percentage: percentage,
            calculationMethodId: calculationMethodId
        })
        if (!percentage || percentage <= 0) return 0;

        // Convert percentage from display format (15%) to decimal (0.15)
        const percentageDecimal = percentage / 100;

        // Calculate based on method
        if (calculationMethodId == '1') {
            // Gross sales calculation
            return grossSales * percentageDecimal;
        } else if (calculationMethodId == '2') {
            // Net profit calculation
            return totalProfit * percentageDecimal;
        }


        // Default fallback
        return 0;
    }

    return {
        formatAmount: formatAmount,
        logError: logError,
        calculateRoyalty: calculateRoyalty
    };
});