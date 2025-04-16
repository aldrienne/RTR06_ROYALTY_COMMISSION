/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @description Constants for Royalty Management Suitelet
 */
define([], function() {
    return {
        // Script IDs
        SUITELET_ID: "customscript_tsc_sl_royalty_report",
        SUITELET_DEPLOYMENT_ID: "customdeploy1",
        
        // Form Configuration
        FORM_TITLE: 'Royalty Management',
        
        // Tab IDs
        TAB_REPORTING: 'custpage_reporting_tab',
        TAB_CONFIG: 'custpage_config_tab',
        
        // Field Groups
        FIELD_GROUP_FILTERS: 'custpage_filter_group',
        
        // Field IDs
        FIELD_DATE_FROM: 'custpage_date_from',
        FIELD_DATE_TO: 'custpage_date_to',
        FIELD_CATEGORY_FILTER: 'custpage_category_filter',
        FIELD_CATEGORY_PERCENTAGE: 'custpage_category_percentage',
        FIELD_CATEGORY_CALCULATION_METHOD: 'custpage_category_calculation_method',
        FIELD_SUBSIDIARY_FILTER: 'custpage_subsidiary_filter',
        FIELD_RESULTS_HTML: 'custpage_results_html',
        FIELD_ACTION: 'custpage_action',
        
        // Sublist IDs
        SUBLIST_ROYALTY_CATEGORIES: 'custpage_royalty_categories',
        
        // Sublist Field IDs
        SUBLIST_FIELD_CATEGORY_ID: 'custpage_category_id',
        SUBLIST_FIELD_CATEGORY_NAME: 'custpage_category_name',
        SUBLIST_FIELD_SPLIT_PERCENTAGE: 'custpage_split_percentage',
        SUBLIST_FIELD_PREVIOUS_PERCENTAGE: 'custpage_previous_percentage',
        SUBLIST_FIELD_LAST_MODIFIED: 'custpage_last_modified',
        SUBLIST_FIELD_CALC_PERC_BY: 'custrecord_tsc_calc_perc_by',
        
        // Button IDs
        BUTTON_RUN_REPORT: 'custpage_run_report',
        BUTTON_EXPORT: 'custpage_export',
        
        // Custom Record Types
        RECORD_TYPE_ROYALTY: 'customrecord_tsc_royalty',
        
        // Custom Field IDs
        FIELD_ROYALTY_PERCENT: 'custrecord_tsc_royalty_percent',
        FIELD_PREVIOUS_PERCENT: 'custrecord_tsc_previous_percent',
        FIELD_CALC_PERC_BY: 'custrecord_tsc_calc_perc_by',
        FIELD_ITEM_ROYALTY: 'custitem_tsc_royalty',
        
        // Action Values
        ACTION_REPORT: 'report',
        ACTION_EXPORT_CSV: 'exportcsv',
        
        // Transaction Types
        TRANSACTION_TYPES: {
            CASH_SALE: 'CashSale',
            INVOICE: 'CustInvc',
            CREDIT_MEMO: 'CustCred',
            CASH_REFUND: 'CashRfnd'
        },

        CALCULATION_METHOD_MAPPING: {
            GROSS_SALE: 1,
            NET_PROFIT: 2,
        }
    };
});