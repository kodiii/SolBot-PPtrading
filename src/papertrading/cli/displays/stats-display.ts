import { DashboardStyle, sectionConfigs } from '../../config/dashboard_style';
import { TradingStats } from '../types';
import { displayTable } from './table-display';
import { Decimal } from "../../../utils/decimal";

/**
 * Displays trading statistics in a formatted table
 */
export function displayTradingStats(stats: TradingStats, style: DashboardStyle): void {
    const config = sectionConfigs.tradingStats;
    const headers = config.columns.map(col => col.header);
    const columnWidths = config.columns.map(col => col.width);

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

    // Format rows to match column width
    const formattedRows = rows.map(row => [
        row[0].padEnd(columnWidths[0])
    ]);

    displayTable(config.title, headers, formattedRows, columnWidths, style);
}