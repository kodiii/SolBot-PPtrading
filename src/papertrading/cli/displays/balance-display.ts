import chalk from "chalk";
import { DashboardStyle, getBoxChars, sectionConfigs } from '../../config/dashboard_style';
import { SimulationService } from "../../services";
import { Decimal } from "../../../utils/decimal";

interface VirtualBalance {
    balance_sol: Decimal;
    updated_at: number;
}

/**
 * Displays the virtual balance information in a formatted box
 */
export function displayVirtualBalance(balance: VirtualBalance | null, style: DashboardStyle): void {
    if (!balance) return;

    const config = sectionConfigs.virtualBalance;
    const simulationService = SimulationService.getInstance();
    const solUsdPrice = simulationService.getSolUsdPrice();
    const boxChars = getBoxChars(style.border_style);

    const content = [
        `${chalk.yellow('SOL Balance:')} ${chalk.green(balance.balance_sol.toString())} ${
            solUsdPrice ?
            ` (≈ $${balance.balance_sol.multiply(new Decimal(solUsdPrice)).toString(2)} USD)` : ''
        }`,
        `${chalk.yellow('Last Updated:')} ${new Date(balance.updated_at).toLocaleString()}`
    ];

    // Draw box with configured width
    const contentWidth = Math.min(
        Math.max(...content.map(line => line.length)) + 2,
        config.width
    );

    console.log('\n'.repeat(style.section_spacing));
    
    // Box top with title
    console.log(
        chalk.blue(boxChars.topLeft + boxChars.horizontal.repeat(2)) +
        chalk.yellowBright(config.title) +
        chalk.blue(boxChars.horizontal.repeat(contentWidth - config.title.length - 4) + boxChars.topRight)
    );

    // Box content
    content.forEach(line => {
        console.log(
            chalk.blue(boxChars.vertical) + ' ' +
            line.padEnd(contentWidth - 2) + ' ' +
            chalk.blue(boxChars.vertical)
        );
    });

    // Box bottom
    console.log(chalk.blue(boxChars.bottomLeft + boxChars.horizontal.repeat(contentWidth) + boxChars.bottomRight));
}