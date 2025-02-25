import chalk, { ChalkFunction } from "chalk";

/**
 * Column configuration for table headers and their widths
 */
export interface ColumnConfig {
    header: string;
    width: number;
}

/**
 * Color configuration for sections and table elements
 */
export interface ColorConfig {
    text: keyof typeof chalk;
    background?: keyof typeof chalk;
    modifier?: "bold" | "dim" | "italic" | "underline";
}

/**
 * Section-specific color configuration
 */
export interface SectionColors {
    border: keyof typeof chalk;
    text: keyof typeof chalk;
    header: keyof typeof chalk;
    title: keyof typeof chalk;
    label?: keyof typeof chalk;
    value?: keyof typeof chalk;
    separator?: keyof typeof chalk;
    profit?: keyof typeof chalk;
    loss?: keyof typeof chalk;
}

/**
 * Section configuration for different table types
 */
export interface SectionConfig {
    title: string;
    width: number;
    columns: ColumnConfig[];
    colors: SectionColors;
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
    value: keyof typeof chalk;
    
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
    header_style: "normal" | "bold" | "dim";
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
    TOKEN_NAME_WIDTH: 20,      // For token names including "Name:" label
    ADDRESS_WIDTH: 52,        // For token addresses including "Addr:" label
    TIME_WIDTH: 35,          // For timestamps including "Time:" label
    SOL_PRICE_WIDTH: 25,     // For SOL prices including "Price:" label (8 decimals)
    USD_AMOUNT_WIDTH: 25,    // For USD amounts (volume, market cap, liquidity)
    TOKEN_AMOUNT_WIDTH: 25,   // For token amounts including "Size:" label
    PERCENT_WIDTH: 20,       // For percentage values
    CURRENT_PRICE_WIDTH: 25, // For current price in SOL (more precision needed)
    PNL_WIDTH: 25,          // For PNL display including "PNL:" label
    TP_SL_WIDTH: 25,        // For Take Profit and Stop Loss
    VOLUME_5M_WIDTH: 21,    // For 5-minute volume display
    MARKETCAP_WIDTH: 25,    // For market cap display including "MCap:" label
    LIQUIDITY_WIDTH: 25     // For liquidity display including "Liq:" label
    LIQUIDITY_BS_WIDTH: 25     // For liquidity display including "Liq:" label
};

/**
 * Section configurations for different table types
 */
export const sectionConfigs: { [key: string]: SectionConfig } = {
    virtualBalance: {
        title: '📊 Virtual Balance',
        width: 52,
        columns: [
            { header: 'Balance', width: 50 }
        ],
        colors: {
            border: "cyan",
            text: "white",
            header: "cyanBright",
            title: "yellowBright",
            label: "yellow",
            value: "white",
            separator: "cyan"
        },
        order: 1
    },
    activePositions: {
        title: '🎯 Active Positions',
        width: 302,  // Match the width used for Recent Trades to maintain consistency
        columns: [
            { header: 'Token Name', width: columnWidths.TOKEN_NAME_WIDTH },
            { header: 'Address', width: columnWidths.ADDRESS_WIDTH },
            { header: 'Volume 5m ($)', width: columnWidths.VOLUME_5M_WIDTH },
            { header: 'Market Cap ($)', width: columnWidths.MARKETCAP_WIDTH },
            { header: 'Liquidity ($)', width: columnWidths.LIQUIDITY_WIDTH },
            { header: 'Position Size (Tk)', width: columnWidths.TOKEN_AMOUNT_WIDTH },
            { header: 'Buy Price (SOL)', width: columnWidths.SOL_PRICE_WIDTH },
            { header: 'Current Price (SOL)', width: columnWidths.CURRENT_PRICE_WIDTH },
            { header: 'PNL', width: columnWidths.PNL_WIDTH },
            { header: 'Take Profit (SOL)', width: columnWidths.TP_SL_WIDTH },
            { header: 'Stop Loss (SOL)', width: columnWidths.TP_SL_WIDTH }
        ],
        colors: {
            border: "magentaBright",
            text: "white",
            header: "magentaBright",
            title: "magentaBright",
            label: "magenta",      // Changed from yellow to magenta to match border theme
            value: "white",
            separator: "magenta",
            profit: "greenBright",
            loss: "redBright"
        },
        order: 3
    },
    tradingStats: {
        title: '📈 Trading Statistics',
        width: 52,
        columns: [
            { header: 'Stats', width: 50 }
        ],
        colors: {
            border: "redBright",
            text: "redBright",
            header: "redBright",
            title: "redBright",
            label: "white",
            value: "white",
            separator: "redBright"
        },
        order: 2
    },
    recentTrades: {
        title: '📈 Recent Trades',
        width: 302,  // Adjusted for new column widths with labels
        columns: [
            { header: 'Token Name', width: columnWidths.TOKEN_NAME_WIDTH },
            { header: 'Address', width: columnWidths.ADDRESS_WIDTH },
            { header: 'Buy Price (SOL)', width: columnWidths.SOL_PRICE_WIDTH },
            { header: 'Sell Price (SOL)', width: columnWidths.SOL_PRICE_WIDTH },
            { header: 'Position Size (Tk)', width: columnWidths.TOKEN_AMOUNT_WIDTH },
            { header: 'Time Buy', width: columnWidths.TIME_WIDTH },
            { header: 'Time Sell', width: columnWidths.TIME_WIDTH },
            { header: 'MarketCap ($)', width: columnWidths.MARKETCAP_WIDTH },
            { header: 'Liquidity/buy ($)', width: columnWidths.LIQUIDITY_BS_WIDTH },
            { header: 'Liquidity/sell ($)', width: columnWidths.LIQUIDITY_BS_WIDTH },
            { header: 'PNL (SOL)', width: columnWidths.SOL_PRICE_WIDTH }
        ],
        colors: {
            border: "green",
            text: "white",
            header: "greenBright",
            title: "yellowBright",
            label: "green",      // Changed from red to green to match the section theme
            value: "white",      // Values remain white
            separator: "green",
            profit: "greenBright",
            loss: "redBright"
        },
        order: 4
    }
};

/**
 * Dashboard style configuration
 */
export const dashboardStyle: DashboardStyle = {
    border_style: "double",
    header_style: "bold",
    text_style: "normal",
    section_spacing: 0,
    section_width: 100,
    align_numbers: "left",
    row_separator: true,
    color_scheme: {
        profit: "greenBright",
        loss: "redBright",
        neutral: "white",
        header: "cyanBright",
        title: "yellowBright",
        text: "white",
        label: "yellow",
        value: "white",
        border: "cyan",
        separator: "cyan"
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