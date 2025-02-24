import chalk from "chalk";
import { DashboardStyle, columnWidths } from '../config/dashboard_style';
import { SimulatedTrade, TokenPosition, TradingStats } from './types';
import { renderTableHeader, renderTableRow, renderTableSeparator, renderTableFooter, calculateTableWidth, createEmptyRow } from './table-renderer';
import { Decimal } from "../../utils/decimal";

export function displayTable(
    title: string,
    headers: string[],
    rows: string[][],
    columnSizes: number[],
    style: DashboardStyle,
    fixedHeader: boolean = false
): void {
    // Add spacing based on configuration
    console.log('\n'.repeat(style.section_spacing));

    // Calculate total table width
    const tableWidth = calculateTableWidth(columnSizes);

    // Render header
    renderTableHeader(title, headers, columnSizes, style);

    // Render rows with separators
    rows.forEach((row, rowIndex) => {
        renderTableRow(row, columnSizes, style);
        if (style.row_separator && rowIndex < rows.length - 1) {
            renderTableSeparator(tableWidth, style);
        }
    });

    // Render footer
    renderTableFooter(tableWidth, style);
}

export function displayActivePositions(positions: TokenPosition[], style: DashboardStyle): void {
    const headers = [
        'Token Name',
        'Address',
        'Volume 5m ($)',
        'Market Cap ($)',
        'Liquidity ($)',
        'Position Size (Tk)',
        'Buy Price (SOL)',
        'Current Price (SOL)',
        'PNL',
        'Take Profit (SOL)',
        'Stop Loss (SOL)'
    ];

    // Use predefined column widths
    const columnSizes = [
        columnWidths.TOKEN_NAME_WIDTH,
        columnWidths.ADDRESS_WIDTH,
        columnWidths.USD_AMOUNT_WIDTH,
        columnWidths.USD_AMOUNT_WIDTH,
        columnWidths.USD_AMOUNT_WIDTH,
        columnWidths.TOKEN_AMOUNT_WIDTH,
        columnWidths.SOL_PRICE_WIDTH,
        columnWidths.SOL_PRICE_WIDTH,
        columnWidths.PERCENT_WIDTH,
        columnWidths.SOL_PRICE_WIDTH,
        columnWidths.SOL_PRICE_WIDTH
    ];

    if (positions.length === 0) {
        const emptyRow = createEmptyRow(headers, chalk.yellow('No active positions'), columnSizes);
        displayTable('🎯 Active Positions', headers, [emptyRow], columnSizes, style, true);
        return;
    }

    const rows = positions.map((pos: TokenPosition) => {
        const rawPnlPercent = pos.current_price.subtract(pos.buy_price)
            .divide(pos.buy_price)
            .multiply(new Decimal(100));
        const formattedPnlPercent = rawPnlPercent.toString(4);
        
        return [
            pos.token_name,
            pos.token_mint,
            (pos.volume_m5 || '0').toString(),
            (pos.market_cap || '0').toString(),
            (pos.liquidity_usd || '0').toString(),
            pos.amount.toString(2),
            pos.buy_price.toString(8),
            pos.current_price.toString(8),
            formattedPnlPercent + '%',
            pos.take_profit.toString(8),
            pos.stop_loss.toString(8)
        ];
    });

    displayTable('🎯 Active Positions', headers, rows, columnSizes, style, true);
}

export function displayRecentTrades(trades: SimulatedTrade[], style: DashboardStyle): void {
    const headers = [
        'Token Name',
        'Address',
        'Buy Price (SOL)',
        'Sell Price (SOL)',
        'Position Size (Tk)',
        'Time Buy',
        'Time Sell',
        'MarketCap ($)',
        'Liquidity/buy ($)',
        'Liquidity/sell ($)',
        'PNL (SOL)'
    ];

    // Use predefined column widths
    const columnSizes = [
        columnWidths.TOKEN_NAME_WIDTH,
        columnWidths.ADDRESS_WIDTH,
        columnWidths.SOL_PRICE_WIDTH,
        columnWidths.SOL_PRICE_WIDTH,
        columnWidths.TOKEN_AMOUNT_WIDTH,
        columnWidths.TIME_WIDTH,
        columnWidths.TIME_WIDTH,
        columnWidths.USD_AMOUNT_WIDTH,
        columnWidths.USD_AMOUNT_WIDTH,
        columnWidths.USD_AMOUNT_WIDTH,
        columnWidths.SOL_PRICE_WIDTH
    ];

    if (trades.length === 0) {
        const emptyRow = createEmptyRow(headers, chalk.yellow('No trades recorded yet'), columnSizes);
        displayTable('📈 Recent Trades', headers, [emptyRow], columnSizes, style, true);
        return;
    }

    const rows = trades.map((trade: SimulatedTrade) => {
        const timeFormat = (timestamp: number) => 
            new Date(timestamp).toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

        return [
            trade.token_name,
            trade.token_mint,
            trade.buy_price.toString(8),
            trade.sell_price ? trade.sell_price.toString(8) : '-',
            trade.amount_token.toString(2),
            timeFormat(trade.time_buy),
            trade.time_sell ? timeFormat(trade.time_sell) : '-',
            (trade.dex_data?.marketCap || '0').toString(),
            (trade.dex_data?.liquidity_buy_usd || '0').toString(),
            trade.time_sell ? (trade.dex_data?.liquidity_sell_usd || '0').toString() : '-',
            trade.pnl ? trade.pnl.toString(8) : '-'
        ];
    });

    displayTable('📈 Recent Trades', headers, rows, columnSizes, style, true);
}

export function displayTradingStats(stats: TradingStats, style: DashboardStyle): void {
    const rows = [
        [`Total Trades: ${stats.totalTrades}`],
        [`Win Rate: ${stats.winRate.toString(4)}%`],
        [`Total P/L: ${stats.totalProfitLoss.toString(8)} SOL`],
        [`Avg P/L per Trade: ${stats.avgProfitPerTrade.toString(8)} SOL`]
    ];

    if (!stats.bestTrade.profit.equals(new Decimal(-Infinity))) {
        rows.push([`Best Trade: ${stats.bestTrade.token} (${stats.bestTrade.profit.toString(8)} SOL)`]);
    }
    if (!stats.worstTrade.profit.equals(new Decimal(Infinity))) {
        rows.push([`Worst Trade: ${stats.worstTrade.token} (${stats.worstTrade.profit.toString(8)} SOL)`]);
    }

    displayTable('📈 Trading Statistics', ['Stats'], rows, [style.section_width - 4], style);
}