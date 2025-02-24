import chalk from "chalk";
import { DashboardStyle, sectionConfigs } from '../../config/dashboard_style';
import { SimulationService } from "../../services";
import { Decimal } from "../../../utils/decimal";
import { displayTable } from './table-display';

interface VirtualBalance {
    balance_sol: Decimal;
    updated_at: number;
}

/**
 * Displays the virtual balance information in a formatted table
 */
export function displayVirtualBalance(balance: VirtualBalance | null, style: DashboardStyle): void {
    if (!balance) return;

    const config = sectionConfigs.virtualBalance;
    const simulationService = SimulationService.getInstance();
    const solUsdPrice = simulationService.getSolUsdPrice();

    // Create balance content
    const balanceStr = `${chalk.yellow('SOL Balance:')} ${chalk.green(balance.balance_sol.toString())} ${
        solUsdPrice ?
        ` (≈ $${balance.balance_sol.multiply(new Decimal(solUsdPrice)).toString(2)} USD)` : ''
    }`;
    const updatedStr = `${chalk.yellow('Last Updated:')} ${new Date(balance.updated_at).toLocaleString()}`;

    // Format as rows for the table
    const headers = config.columns.map(col => col.header);
    const columnWidths = config.columns.map(col => col.width);
    const rows = [
        [balanceStr],
        [updatedStr]
    ];

    // Use table display for consistent rendering
    displayTable(config.title, headers, rows, columnWidths, style);
}