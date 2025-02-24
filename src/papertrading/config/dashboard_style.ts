import chalk, { ChalkFunction } from "chalk";

/**
 * Column configuration for table headers and their widths
 */
export interface ColumnConfig {
    header: string;
    width: number;
}

/**
 * Section configuration for different table types
 */
export interface SectionConfig {
    title: string;
    width: number;
    columns: ColumnConfig[];
    borderColor: keyof typeof chalk;
    order: number;  // Lower numbers display first
}

/**
 * Interface for color scheme configuration
 */
export interface ColorScheme {
    // Value colors
    profit: keyof typeof chalk;
    loss: keyof typeof chalk;
    neutral: keyof typeof chalk;
    
    // Text colors
    header: keyof typeof chalk;
    title: keyof typeof chalk;
    text: keyof typeof chalk;
    label: keyof typeof chalk;
    
    // Border colors
    border: keyof typeof chalk;
    separator: keyof typeof chalk;
}

/**
 * Interface for dashboard style configuration
 */
export interface DashboardStyle {
    // Border style
    border_style: "single" | "double";
    
    // Text styling
    header_style: keyof typeof chalk;
    text_style: "normal" | "bold" | "dim";
    
    // Colors
    color_scheme: ColorScheme;
    
    // Layout
    section_spacing: number;
    section_width: number;  // Default width for sections
    align_numbers: "left" | "right";
    row_separator: boolean;  // Whether to show separators between rows
}

/**
 * Base column widths for different data types
 */
export const columnWidths = {
    TOKEN_NAME_WIDTH: 15,      // For token names
    ADDRESS_WIDTH: 47,        // For token addresses
    TIME_WIDTH: 20,          // For timestamps
    SOL_PRICE_WIDTH: 18,     // For SOL prices (8 decimals)
    USD_AMOUNT_WIDTH: 20,    // For USD amounts
    TOKEN_AMOUNT_WIDTH: 20,   // For token amounts
    PERCENT_WIDTH: 20        // For percentage values
};

/**
 * Section configurations for different table types
 */
export const sectionConfigs: { [key: string]: SectionConfig } = {
    virtualBalance: {
        title: '📊 Virtual Balance',
        width: 70,
        columns: [
            { header: 'Balance', width: 70 }
        ],
        borderColor: "blue",
        order: 1  // Show first
    },
    activePositions: {
        title: '🎯 Active Positions',
        width: 245,
        columns: [
            { header: 'Token Name', width: columnWidths.TOKEN_NAME_WIDTH },
            { header: 'Address', width: columnWidths.ADDRESS_WIDTH },
            { header: 'Volume 5m ($)', width: columnWidths.USD_AMOUNT_WIDTH },
            { header: 'Market Cap ($)', width: columnWidths.USD_AMOUNT_WIDTH },
            { header: 'Liquidity ($)', width: columnWidths.USD_AMOUNT_WIDTH },
            { header: 'Position Size (Tk)', width: columnWidths.TOKEN_AMOUNT_WIDTH },
            { header: 'Buy Price (SOL)', width: columnWidths.SOL_PRICE_WIDTH },
            { header: 'Current Price (SOL)', width: columnWidths.SOL_PRICE_WIDTH },
            { header: 'PNL', width: columnWidths.PERCENT_WIDTH },
            { header: 'Take Profit (SOL)', width: columnWidths.SOL_PRICE_WIDTH },
            { header: 'Stop Loss (SOL)', width: columnWidths.SOL_PRICE_WIDTH }
        ],
        borderColor: "redBright",
        order: 3  // Show third
    },
    tradingStats: {
        title: '📈 Trading Statistics',
        width: 52,
        columns: [
            { header: 'Stats', width: 50 }
        ],
        borderColor: "yellow",
        order: 2  // Show second
    },
    recentTrades: {
        title: '📈 Recent Trades',
        width: 248,
        columns: [
            { header: 'Token Name', width: columnWidths.TOKEN_NAME_WIDTH },
            { header: 'Address', width: columnWidths.ADDRESS_WIDTH },
            { header: 'Buy Price (SOL)', width: columnWidths.SOL_PRICE_WIDTH },
            { header: 'Sell Price (SOL)', width: columnWidths.SOL_PRICE_WIDTH },
            { header: 'Position Size (Tk)', width: columnWidths.TOKEN_AMOUNT_WIDTH },
            { header: 'Time Buy', width: columnWidths.TIME_WIDTH },
            { header: 'Time Sell', width: columnWidths.TIME_WIDTH },
            { header: 'MarketCap ($)', width: columnWidths.USD_AMOUNT_WIDTH },
            { header: 'Liquidity/buy ($)', width: columnWidths.USD_AMOUNT_WIDTH },
            { header: 'Liquidity/sell ($)', width: columnWidths.USD_AMOUNT_WIDTH },
            { header: 'PNL (SOL)', width: columnWidths.SOL_PRICE_WIDTH }
        ],
        borderColor: "whiteBright",
        order: 4  // Show last
    }
};

/**
 * Dashboard style configuration
 */
export const dashboardStyle: DashboardStyle = {
    // Border appearance
    border_style: "double",
    
    // Text styling
    header_style: "bold",
    text_style: "normal",
    
    // Spacing and layout
    section_spacing: 0,
    section_width: 100,  // Default width for sections
    align_numbers: "right",
    row_separator: true,
    
    // Color scheme
    color_scheme: {
        // Value colors
        profit: "greenBright",
        loss: "redBright",
        neutral: "white",
        
        // Text colors
        header: "cyanBright",
        title: "yellowBright",
        text: "yellowBright",
        label: "yellow",
        
        // Border colors
        border: "blue",
        separator: "blue"
    }
};

/**
 * Box drawing characters configuration based on border style
 */
export const getBoxChars = (style: "single" | "double") => ({
    topLeft: style === "double" ? '╔' : '┌',
    topRight: style === "double" ? '╗' : '┐',
    bottomLeft: style === "double" ? '╚' : '└',
    bottomRight: style === "double" ? '╝' : '┘',
    horizontal: style === "double" ? '═' : '─',
    vertical: style === "double" ? '║' : '│',
    leftT: style === "double" ? '╠' : '├',
    rightT: style === "double" ? '╣' : '┤',
    topT: style === "double" ? '╦' : '┬',
    bottomT: style === "double" ? '╩' : '┴',
    cross: style === "double" ? '╬' : '┼'
});