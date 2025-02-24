import chalk from "chalk";
import { DashboardStyle, sectionConfigs } from '../../config/dashboard_style';
import { SimulationService } from "../../services";
import { Decimal } from "../../../utils/decimal";
import { displayTable } from './table-display';
import { getStringWidth } from '../utils/string-width';

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
 * Pads a string of text with spaces to match the target width
 */
function padToWidth(text: string, targetWidth: number): string {
    const visibleLength = getStringWidth(text.replace(/\u001b\[\d+m|\u001b\[0m/g, ''));
    return text + ' '.repeat(Math.max(0, targetWidth - visibleLength));
}

/**
 * Creates a table cell with proper width and styling
 */
function createTableCell(label: string, value: string, targetWidth: number): string {
    const coloredLabel = chalk.yellow(label);
    const plainContent = `${label}${value}`;
    
    // If content fits within width, just pad it
    if (getStringWidth(plainContent) <= targetWidth) {
        return padToWidth(coloredLabel + value, targetWidth);
    }
    
    // If content is too long, truncate it
    const maxContentWidth = targetWidth - 3; // Account for '...'
    const labelWidth = getStringWidth(label);
    let truncated = '';
    let currentWidth = 0;
    
    // Add label first
    truncated = coloredLabel;
    currentWidth = labelWidth;
    
    // Add as much of the value as will fit
    let valueChars = Array.from(value);
    for (let char of valueChars) {
        const charWidth = getStringWidth(char);
        if (currentWidth + charWidth > maxContentWidth) break;
        truncated += char;
        currentWidth += charWidth;
    }
    
    // Add ellipsis and padding
    return padToWidth(truncated + '...', targetWidth);
}

/**
 * Displays the virtual balance information in a formatted table
 */
export function displayVirtualBalance(balance: VirtualBalance | null, style: DashboardStyle): void {
    if (!balance) return;

    const config = sectionConfigs.virtualBalance;
    const simulationService = SimulationService.getInstance();
    const solUsdPrice = simulationService.getSolUsdPrice();
    const columnWidth = config.columns[0].width;

    // Prepare balance content
    const balanceValue = chalk.green(balance.balance_sol.toString());
    const usdPart = solUsdPrice ? 
        chalk.gray(` (≈ $${balance.balance_sol.multiply(new Decimal(solUsdPrice)).toString(2)} USD)`) : 
        '';
    
    // Create formatted rows
    const headers = config.columns.map(col => col.header);
    const columnWidths = config.columns.map(col => col.width);
    const rows = [
        [createTableCell('SOL Balance: ', balanceValue + usdPart, columnWidth)],
        [createTableCell('Last Updated: ', chalk.white(formatDateTime(balance.updated_at)), columnWidth)]
    ];

    // Display the table
    displayTable(config.title, headers, rows, columnWidths, style);
}