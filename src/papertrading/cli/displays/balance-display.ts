import { DashboardStyle, sectionConfigs } from '../../config/dashboard_style';
import { SimulationService } from "../../services";
import { Decimal } from "../../../utils/decimal";
import { displayTable } from './table-display';

/**
 * Formats a number with thousand separators for better readability
 */
function formatNumberWithCommas(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    
    // Format with commas and limit to 2 decimal places for monetary values
    return num.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    });
}

interface VirtualBalance {
    balance_sol: Decimal;
    updated_at: number;
}

/**
 * Formats a date/time string with consistent layout
 */
function formatDateTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

/**
 * Creates a cell with label and content
 */
function createCell(label: string, content: string): string {
    return `${label}${content}`;
}

/**
 * Formats the balance with SOL and USD values
 */
function formatBalance(balance: Decimal, solPrice: Decimal | null): string {
    const solBalance = formatNumberWithCommas(balance.toString());
    if (!solPrice) return solBalance;
    
    const usdValue = formatNumberWithCommas(balance.multiply(solPrice).toString());
    return `${solBalance} (≈ $${usdValue} USD)`;
}

/**
 * Displays the virtual balance information in a formatted table
 */
export function displayVirtualBalance(balance: VirtualBalance | null, style: DashboardStyle): void {
    if (!balance) return;

    const config = sectionConfigs.virtualBalance;
    const simulationService = SimulationService.getInstance();
    const solUsdPrice = simulationService.getSolUsdPrice() ? 
                        new Decimal(simulationService.getSolUsdPrice()!) : 
                        null;
    
    // Create rows without applying colors
    const headers = config.columns.map(col => col.header);
    const columnWidths = config.columns.map(col => col.width);
    const rows = [
        [createCell('SOL Balance: ', formatBalance(balance.balance_sol, solUsdPrice))],
        [createCell('Last Updated: ', formatDateTime(balance.updated_at))]
    ];

    // Display the table
    displayTable(config.title, headers, rows, columnWidths, style);
}