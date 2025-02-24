import chalk, { ChalkFunction } from "chalk";
import { DashboardStyle, getBoxChars, SectionConfig, sectionConfigs } from '../config/dashboard_style';
import { getStringWidth, padStringToWidth } from './utils/string-width';

/**
 * Gets section configuration by title
 */
export function getSectionConfig(title: string): SectionConfig | undefined {
    return Object.values(sectionConfigs).find(config => config.title === title);
}

/**
 * Gets effective table width based on section config or fallback
 */
export function getEffectiveTableWidth(title: string, columnWidths: number[], style: DashboardStyle): number {
    const sectionConfig = getSectionConfig(title);
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + columnWidths.length + 1;
    return sectionConfig ? 
        Math.max(sectionConfig.width, totalWidth) :
        Math.min(totalWidth, style.section_width);
}

/**
 * Creates color functions for table borders and text
 */
function getColorFunctions(style: DashboardStyle) {
    return {
        colorBorder: (str: string) => (chalk[style.color_scheme.border] as ChalkFunction)(str),
        colorSeparator: (str: string) => (chalk[style.color_scheme.separator] as ChalkFunction)(str),
        colorHeader: (str: string) => (chalk[style.color_scheme.header] as ChalkFunction)(str),
        colorTitle: (str: string) => (chalk[style.color_scheme.title] as ChalkFunction)(str),
        colorText: (str: string) => (chalk[style.color_scheme.text] as ChalkFunction)(str),
        colorProfit: (str: string) => (chalk[style.color_scheme.profit] as ChalkFunction)(str),
        colorLoss: (str: string) => (chalk[style.color_scheme.loss] as ChalkFunction)(str),
        colorNeutral: (str: string) => (chalk[style.color_scheme.neutral] as ChalkFunction)(str),
    };
}

/**
 * Renders a table header
 */
export function renderTableHeader(
    title: string,
    headers: string[],
    columnWidths: number[],
    style: DashboardStyle,
    boxChars = getBoxChars(style.border_style)
): void {
    const colors = getColorFunctions(style);
    const tableWidth = getEffectiveTableWidth(title, columnWidths, style);
    
    // Draw title
    const titleWidth = getStringWidth(title);
    console.log(
        colors.colorBorder(boxChars.topLeft + boxChars.horizontal.repeat(2)) +
        colors.colorTitle(` ${title} `) +
        colors.colorBorder(boxChars.horizontal.repeat(Math.max(0, tableWidth - titleWidth - 4)) + boxChars.topRight)
    );

    // Draw headers
    const headerRow = headers.map((header, i) => {
        const width = columnWidths[i];
        return colors.colorHeader(padStringToWidth(header, width));
    }).join(colors.colorSeparator(boxChars.vertical));

    console.log(
        colors.colorBorder(boxChars.vertical) + ' ' +
        headerRow +
        ' ' + colors.colorBorder(boxChars.vertical)
    );

    // Draw separator
    const separator = boxChars.horizontal.repeat(tableWidth);
    console.log(
        colors.colorBorder(boxChars.leftT) +
        colors.colorSeparator(separator) +
        colors.colorBorder(boxChars.rightT)
    );
}

/**
 * Renders a table row
 */
export function renderTableRow(
    row: string[],
    columnWidths: number[],
    style: DashboardStyle,
    boxChars = getBoxChars(style.border_style)
): void {
    const colors = getColorFunctions(style);

    const formattedRow = row.map((cell, i) => {
        // Content is already formatted and padded by the display component
        return cell;
    });

    console.log(
        colors.colorBorder(boxChars.vertical) + ' ' +
        formattedRow.join(colors.colorSeparator(boxChars.vertical)) +
        ' ' + colors.colorBorder(boxChars.vertical)
    );
}

/**
 * Renders a table separator
 */
export function renderTableSeparator(
    tableWidth: number,
    style: DashboardStyle,
    boxChars = getBoxChars(style.border_style)
): void {
    const colors = getColorFunctions(style);
    const separator = boxChars.horizontal.repeat(tableWidth);
    console.log(
        colors.colorBorder(boxChars.leftT) +
        colors.colorSeparator(separator) +
        colors.colorBorder(boxChars.rightT)
    );
}

/**
 * Renders a table footer
 */
export function renderTableFooter(
    tableWidth: number,
    style: DashboardStyle,
    boxChars = getBoxChars(style.border_style)
): void {
    const colors = getColorFunctions(style);
    const separator = boxChars.horizontal.repeat(tableWidth);
    console.log(
        colors.colorBorder(boxChars.bottomLeft) +
        colors.colorSeparator(separator) +
        colors.colorBorder(boxChars.bottomRight)
    );
}

/**
 * Creates an empty row with proper column widths
 */
export function createEmptyRow(headers: string[], message: string, columnWidths: number[]): string[] {
    return headers.map((_, index) => {
        if (index === Math.floor(headers.length / 2)) {
            return padStringToWidth(message, columnWidths[index]);
        }
        return ' '.repeat(columnWidths[index]);
    });
}

/**
 * Calculates the width of a table based on its columns
 */
export function calculateTableWidth(columnWidths: number[]): number {
    return columnWidths.reduce((sum, width) => sum + width, 0) + columnWidths.length + 1;
}