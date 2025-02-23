import chalk, { ChalkFunction } from "chalk";

/**
 * Interface for color scheme configuration
 */
export interface ColorScheme {
    profit: keyof typeof chalk;
    loss: keyof typeof chalk;
    neutral: keyof typeof chalk;
}

/**
 * Interface for dashboard style configuration
 */
export interface DashboardStyle {
    border_style: "single" | "double";
    header_style: keyof typeof chalk;
    color_scheme: ColorScheme;
    section_spacing: number;
    align_numbers: "left" | "right";
}

/**
 * Dashboard style configuration
 */
export const dashboardStyle: DashboardStyle = {
    border_style: "double",
    section_spacing: 1,
    header_style: "cyan",
    align_numbers: "left",
    color_scheme: {
        profit: "green",
        loss: "red",
        neutral: "white"
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