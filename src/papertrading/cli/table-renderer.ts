import chalk, { ChalkFunction } from "chalk";
import { DashboardStyle, getBoxChars, SectionConfig, sectionConfigs } from '../config/dashboard_style';
import { getStringWidth, padStringToWidth } from './utils/string-width';

/**
 * Calculates the width of a table based on its columns
 */
export function calculateTableWidth(columnWidths: number[]): number {
    return Math.max(
        columnWidths.reduce((sum, width) => sum + width, 0) + columnWidths.length + 1,
        20 // Minimum width to prevent empty tables from collapsing
    );
}

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
    return sectionConfig ? 
        sectionConfig.width :
        Math.min(calculateTableWidth(columnWidths), style.section_width);
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
    const tableWidth = getEffectiveTableWidth(title, columnWidths, style);
    const separator = boxChars.horizontal.repeat(tableWidth);
    const colors = getColorFunctions(style);

    // Draw title with proper width handling
    const titleVisualWidth = getStringWidth(title);
    console.log(
        colors.colorBorder(boxChars.topLeft + boxChars.horizontal.repeat(2)) +
        colors.colorTitle(` ${title} `) +
        colors.colorBorder(boxChars.horizontal.repeat(Math.max(0, tableWidth - titleVisualWidth - 4)) + boxChars.topRight)
    );

    // Draw headers using configured widths and proper character width handling
    const headerRow = headers.map((header, i) => {
        let width;
        const sectionConfig = getSectionConfig(title);
        if (sectionConfig) {
            width = sectionConfig.columns[i]?.width || columnWidths[i];
        } else {
            width = columnWidths[i];
        }
        return colors.colorHeader(padStringToWidth(header, width));
    }).join(colors.colorSeparator(boxChars.vertical));

    console.log(
        colors.colorBorder(boxChars.vertical) + ' ' +
        headerRow +
        ' ' + colors.colorBorder(boxChars.vertical)
    );

    // Draw separator after headers
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
        const maxWidth = columnWidths[i];
        
        // Handle number alignment
        const shouldRightAlign = style.align_numbers === "right" && 
            !isNaN(Number(cell.replace(/[^0-9.-]/g, '')));
        
        // Use proper width handling for padding
        const alignedCell = shouldRightAlign ?
            padStringToWidth(cell, maxWidth, 'right') :
            padStringToWidth(cell, maxWidth, 'left');

        // Color the cell based on whether it's a number and its value
        if (!isNaN(Number(cell.replace(/[^0-9.-]/g, '')))) {
            const num = Number(cell.replace(/[^0-9.-]/g, ''));
            if (num > 0) return colors.colorProfit(alignedCell);
            if (num < 0) return colors.colorLoss(alignedCell);
            return colors.colorNeutral(alignedCell);
        }
        return colors.colorText(alignedCell);
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
        return padStringToWidth('', columnWidths[index]);
    });
}