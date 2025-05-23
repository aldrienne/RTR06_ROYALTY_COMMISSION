/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @description Reporting functions for Royalty Management Suitelet
 */
define(['N/search', 'N/query', 'N/log', './constants', './utils', './data'],
    function (search, query, log, constants, utils, data) {

        /**
         * Creates the royalty report search with the specified filters
         * @param {Object} filters - Object containing filter parameters
         * @param {string} [filters.fromDate] - Start date for filtering
         * @param {string} [filters.toDate] - End date for filtering
         * @param {string} [filters.categoryId] - Royalty category ID
         * @returns {Object} - The search results with lines and totals
         */
        function createRoyaltyReportSearch(filters) {
            log.debug('filters', JSON.stringify(filters));
            // Create the base transaction search

            let searchFilters = [
                ['type', 'anyof', 'CashSale', 'CustInvc', 'CustCred', 'CashRfnd'],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["shipping", "is", "F"],
                "AND",
                ["transactiondiscount", "is", "F"],
                "AND",
                ["rate", "greaterthanorequalto", "0.00"]
            ];

            //Add filters here
            if (filters.categoryId) {
                searchFilters.push("AND");
                searchFilters.push(["item.custitem_tsc_royalty", "anyof", filters.categoryId]);
            }

            if (filters.subsidiaryId) {
                log.debug('subsidiaryId', filters.subsidiaryId);
                searchFilters.push("AND");
                searchFilters.push(["subsidiary", "anyof", filters.subsidiaryId]);
            }

            if (filters.fromDate) {
                searchFilters.push("AND");
                searchFilters.push(["trandate", "onorafter", filters.fromDate]);
            }

            if (filters.toDate) {
                searchFilters.push("AND");
                searchFilters.push(["trandate", "onorbefore", filters.toDate]);
            }

            const transactionSearchColInternalId = search.createColumn({ name: 'internalid', summary: search.Summary.GROUP });
            const transactionSearchColItem = search.createColumn({ name: 'item', summary: search.Summary.GROUP });
            const transactionSearchColTranDate = search.createColumn({ name: 'trandate', summary: search.Summary.GROUP, sort: search.Sort.DESC });
            const transactionSearchColTranId = search.createColumn({ name: 'tranid', summary: search.Summary.GROUP });
            const transactionSearchColQuantity = search.createColumn({ name: 'quantity', summary: search.Summary.SUM });
            const transactionSearchColItemRate = search.createColumn({ name: 'rate', summary: search.Summary.MAX });
            const transactionSearchColAmountGross = search.createColumn({ name: 'grossamount', summary: search.Summary.SUM });
            const transactionSearchColAmountNetOfTax = search.createColumn({ name: 'netamountnotax', summary: search.Summary.SUM });
            const transactionSearchColAmountTax = search.createColumn({ name: 'taxamount', summary: search.Summary.SUM });
            const transactionSearchColAmountDiscount = search.createColumn({ name: 'discountamount', summary: search.Summary.SUM });
            const transactionSearchColFormulaCurrencyNPRIR = search.createColumn({ name: 'formulacurrency', summary: search.Summary.SUM, formula: 'NVL({netamountnotax}, 0) + NVL({taxamount}, 0)' });
            const transactionSearchColItemRoyalty = search.createColumn({ name: 'custitem_tsc_royalty', join: 'item', summary: search.Summary.GROUP });
            const transactionSearchColType = search.createColumn({ name: 'type', summary: search.Summary.GROUP });
            const transactionSearchColEstExtendedCostLine = search.createColumn({ name: 'costestimate', summary: search.Summary.SUM });

            const transactionSearch = search.create({
                type: "transaction",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters: searchFilters,
                columns: [
                    transactionSearchColItem,
                    transactionSearchColTranDate,
                    transactionSearchColTranId,
                    transactionSearchColQuantity,
                    transactionSearchColItemRate,
                    transactionSearchColAmountGross,
                    transactionSearchColAmountNetOfTax,
                    transactionSearchColAmountTax,
                    transactionSearchColAmountDiscount,
                    transactionSearchColFormulaCurrencyNPRIR,
                    transactionSearchColItemRoyalty,
                    transactionSearchColType,
                    transactionSearchColInternalId,
                    transactionSearchColEstExtendedCostLine
                ]
            });
            let results = {};
            results.lines = [];
            results.totals = {
                grossSales: 0,
                netSales: 0,
                totalSales: 0,
                totalCost: 0,
                totalProfit: 0
            }

            //Execute Search
            const transactionSearchPagedData = transactionSearch.runPaged({ pageSize: 1000 });
            for (let i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
                const transactionSearchPage = transactionSearchPagedData.fetch({ index: i });
                transactionSearchPage.data.forEach((result) => {
                    let tempObj = {};
                    const transactionType = result.getText(transactionSearchColType);
                    tempObj['id'] = result.getValue(transactionSearchColInternalId);
                    tempObj['type'] = transactionType;
                    tempObj['roycalCategory'] = result.getText(transactionSearchColItemRoyalty)
                    tempObj['productTitle'] = result.getText(transactionSearchColItem)
                    tempObj['orderNumber'] = result.getValue(transactionSearchColTranId)
                    tempObj['tranDate'] = result.getValue(transactionSearchColTranDate)
                    tempObj['quantity'] = result.getValue(transactionSearchColQuantity)
                    tempObj['rate'] = result.getValue(transactionSearchColItemRate)
                    tempObj['grossSale'] = result.getValue(transactionSearchColAmountGross)
                    tempObj['netSales'] = result.getValue(transactionSearchColAmountNetOfTax)
                    tempObj['amountTax'] = result.getValue(transactionSearchColAmountTax)
                    tempObj['amountDiscount'] = result.getValue(transactionSearchColAmountDiscount)
                    tempObj['totalSales'] = result.getValue(transactionSearchColFormulaCurrencyNPRIR)
                    tempObj['totalCost'] = result.getValue(transactionSearchColEstExtendedCostLine);
                    if (transactionType === 'Cash Refund' || transactionType === 'Credit Memo') {
                        tempObj['isReturn'] = true;
                    }
                    //Calculate/add totals
                    results.totals.grossSales += parseFloat(tempObj['grossSale']) || 0;
                    results.totals.netSales += parseFloat(tempObj['netSales']) || 0;
                    results.totals.totalSales += parseFloat(tempObj['totalSales']) || 0;
                    results.totals.totalCost += parseFloat(tempObj['totalCost']) || 0;
                    results.lines.push(tempObj);
                });
            }
            // Calculate total profit
            results.totals.totalProfit = results.totals.netSales - results.totals.totalCost;
            return results;
        }

        /**
         * Generates report based on filters using a transaction search
         * @param {serverWidget.Form} form - The form object
         * @param {ServerRequest} request - The request object
         */
        function generateReport(form, request) {
            try {
                // Get filter parameters from the request
                const filterParams = {
                    fromDate: request.parameters[constants.FIELD_DATE_FROM],
                    toDate: request.parameters[constants.FIELD_DATE_TO],
                    categoryId: request.parameters[constants.FIELD_CATEGORY_FILTER],
                    subsidiaryId: request.parameters[constants.FIELD_SUBSIDIARY_FILTER]
                };

                // Get royalty percentage if a category is selected
                let royaltyPercentage = 0;
                let calculationMethod = '';
                if (filterParams.categoryId) {
                    const royaltyDetails = data.getRoyaltyDetails(filterParams.categoryId);
                    if (royaltyDetails) {
                        royaltyPercentage = royaltyDetails.percentage;
                        calculationMethod = royaltyDetails.calculationMethod;
                    }
                }

                // Get sales data
                const results = createRoyaltyReportSearch(filterParams);
                log.audit('results', results);

                // Generate HTML table rows
                let tableHtml = '';

                if (results.lines.length > 0) {
                    // Process each result
                    results.lines.forEach(result => {
                        const royaltyCategory = result.roycalCategory || '';
                        const productTitle = result.productTitle || '';
                        const orderNumber = result.orderNumber || '';
                        const tranDate = result.tranDate || '';
                        const quantity = result.quantity || 0;
                        const rate = result.rate || 0;
                        const grossSale = result.grossSale || 0;
                        const discounts = result.amountDiscount || 0;
                        const netSales = result.netSales || 0;
                        const taxes = result.amountTax || 0;
                        const totalSales = result.totalSales || 0;
                        const totalCost = result.totalCost || 0;
                        
                        // Append table row
                        tableHtml += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${royaltyCategory}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${productTitle}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${orderNumber}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${tranDate}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${quantity}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${utils.formatAmount(rate)}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${utils.formatAmount(grossSale)}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${utils.formatAmount(discounts)}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${utils.formatAmount(netSales)}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${utils.formatAmount(taxes)}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${utils.formatAmount(totalSales)}</td>                    
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${utils.formatAmount(totalCost)}</td>                    
                    </tr>
                `;
                    });
                    
                    // Get method name for display
                    let calculationMethodName = '';
                    if (calculationMethod == '1') {
                        calculationMethodName = 'GROSS SALES';
                    } else if (calculationMethod == '2') {
                        calculationMethodName = 'NET PROFIT';
                    }

                    // Calculate royalty amount
                    const royaltyAmount = utils.calculateRoyalty(
                        results.totals.grossSales,
                        results.totals.totalProfit,
                        royaltyPercentage,
                        calculationMethod
                    );

                    // Add total rows with calculated royalty
                    tableHtml += `
                        <tr>
                            <td colspan="11" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Total Gross Sales:</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">$${utils.formatAmount(results.totals.grossSales)}</td>
                        </tr>
                        <tr>
                            <td colspan="11" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Total Net Sales:</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">$${utils.formatAmount(results.totals.netSales)}</td>
                        </tr>
                        <tr>
                            <td colspan="11" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Total Sales:</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">$${utils.formatAmount(results.totals.totalSales)}</td>
                        </tr>
                        <tr>
                            <td colspan="11" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Total Cost:</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">$${utils.formatAmount(results.totals.totalCost)}</td>
                        </tr>
                        <tr>
                            <td colspan="11" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Total Profit:</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">$${utils.formatAmount(results.totals.totalProfit)}</td>
                        </tr>
                        <tr>
                            <td colspan="11" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">(${calculationMethodName}) ${royaltyPercentage}% Royalty Split:</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">$${utils.formatAmount(royaltyAmount)}</td>
                        </tr>
                        `;
                } else {
                    tableHtml = `
                <tr>
                    <td colspan="14" style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                        No results found for the selected criteria.
                    </td>
                </tr>
            `;
                }

                // Update the HTML field with the results
                const resultsHtml = `
            <div class="uir-field-wrapper uir-long-text" style="margin-top: 20px;">
                <div class="uir-field">
                    <span class="smalltextb">Royalty Report Results</span>
                    <div class="uir-field-value">
                        <table id="custpage_royalty_results" class="uir-table" style="width: 100%; margin-top: 10px; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Royalty Category</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Product</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Order #</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Date</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Quantity</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Rate</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Gross Sales</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Discounts</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Net Sales</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Taxes</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Total Sales</th>                                
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f7fa;">Total Cost</th>  
                                </tr>
                            </thead>
                            <tbody id="custpage_results_body">
                                ${tableHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

                form.getField({ id: constants.FIELD_RESULTS_HTML }).defaultValue = resultsHtml;

            } catch (e) {
                log.error('Error generating report', e);
                form.getField({ id: constants.FIELD_RESULTS_HTML }).defaultValue = `
            <div style="color: red; padding: 10px;">
                Error generating report: ${e.message}
            </div>
        `;
            }
        }

        return {
            createRoyaltyReportSearch: createRoyaltyReportSearch,
            generateReport: generateReport
        };
    });