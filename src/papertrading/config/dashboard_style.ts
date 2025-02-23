import chalk, { ChalkFunction } from "chalk";

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
    align_numbers: "left" | "right";
    row_separator: boolean;  // Whether to show separators between rows
}

/**
 * Dashboard style configuration
 * You can customize the dashboard appearance by modifying these values:
 *
 * Colors available:
 * - Basic: "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"
 * - Bright: "blackBright", "redBright", "greenBright", "yellowBright",
 *          "blueBright", "magentaBright", "cyanBright", "whiteBright"
 * - Background: "bgBlack", "bgRed", "bgGreen", "bgYellow", "bgBlue",
 *              "bgMagenta", "bgCyan", "bgWhite"
 * - Bright Background: "bgBlackBright", "bgRedBright", "bgGreenBright",
 *                     "bgYellowBright", "bgBlueBright", "bgMagentaBright",
 *                     "bgCyanBright", "bgWhiteBright"
 */
export const dashboardStyle: DashboardStyle = {
    // Border appearance
    border_style: "double",
    
    // Text styling
    header_style: "bold",
    text_style: "normal",
    
    // Spacing
    section_spacing: 1,
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
        text: "white",
        label: "yellow",
        
        // Border colors
        border: "blue",
        separator: "blue"
    }
};

/**
 * Column width configurations for table formatting
 */
export const columnWidths = {
    TOKEN_NAME_WIDTH: 8,      // For token names
    ADDRESS_WIDTH: 42,        // For token addresses
    TIME_WIDTH: 15,          // For timestamps
    SOL_PRICE_WIDTH: 12,     // For SOL prices (8 decimals)
    USD_AMOUNT_WIDTH: 12,    // For USD amounts
    TOKEN_AMOUNT_WIDTH: 15,   // For token amounts
    PERCENT_WIDTH: 10        // For percentage values
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