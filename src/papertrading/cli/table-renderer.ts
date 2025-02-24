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
function getColorFunctions(style: DashboardStyle, title: string) {
    const sectionConfig = getSectionConfig(title);
    const colors = sectionConfig?.colors || style.color_scheme;

    return {
        colorBorder: (str: string) => (chalk[colors.border] as ChalkFunction)(str),
        colorSeparator: (str: string) => (chalk[colors.separator || colors.border] as ChalkFunction)(str),
        colorHeader: (str: string) => (chalk[colors.header] as ChalkFunction)(str),
        colorTitle: (str: string) => (chalk[colors.title] as ChalkFunction)(str),
        colorText: (str: string) => (chalk[colors.text] as ChalkFunction)(str),
        colorLabel: (str: string) => (chalk[colors.label || style.color_scheme.label] as ChalkFunction)(str),
        colorValue: (str: string) => (chalk[colors.value || colors.text] as ChalkFunction)(str),
        colorProfit: (str: string) => (chalk[colors.profit || style.color_scheme.profit] as ChalkFunction)(str),
        colorLoss: (str: string) => (chalk[colors.loss || style.color_scheme.loss] as ChalkFunction)(str),
        colorNeutral: (str: string) => (chalk[style.color_scheme.neutral] as ChalkFunction)(str),
    };
}

/**
 * Format cell content with appropriate color based on content type and section
 */
function formatCell(content: string, style: DashboardStyle, title: string): string {
    const colors = getColorFunctions(style, title);
    
    // Split label and value if the content has a label pattern
    const labelMatch = content.match(/^([^:]+:)(.*)$/);
    if (labelMatch) {
        const [, label, value] = labelMatch;
        
        // Check if value is numeric
        const numMatch = value.trim().match(/^[-+]?\d*\.?\d+/);
        if (numMatch) {
            const num = parseFloat(numMatch[0]);
            const coloredValue = num > 0 ? colors.colorProfit(value) :
                               num < 0 ? colors.colorLoss(value) :
                               colors.colorValue(value);
            return colors.colorLabel(label) + coloredValue;
        }
        
        // Non-numeric value
        return colors.colorLabel(label) + colors.colorValue(value);
    }
    
    // Special case for addresses (base58/hex)
    if (content.trim().length >= 32) {
        return colors.colorText(content);
    }

    // Special case for timestamps
    if (content.trim().match(/^\d{1,2}:\d{2}:\d{2}$/)) {
        return colors.colorText(content);
    }

    // Check for percentage values with proper coloring
    const pnlMatch = content.trim().match(/^([-+]?\d*\.?\d+)%$/);
    if (pnlMatch) {
        const num = parseFloat(pnlMatch[1]);
        if (num > 0) return colors.colorProfit(content);
        if (num < 0) return colors.colorLoss(content);
        return colors.colorNeutral(content);
    }

    // Check for numeric values (only in numeric columns)
    const numMatch = content.trim().match(/^[-+]?\d*\.?\d+$/);
    if (numMatch) {
        const num = parseFloat(numMatch[0]);
        if (num > 0) return colors.colorProfit(content);
        if (num < 0) return colors.colorLoss(content);
        return colors.colorNeutral(content);
    }
    
    // Default text coloring
    return colors.colorText(content);
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
    const colors = getColorFunctions(style, title);
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
        const paddedHeader = padStringToWidth(header, width);
        return colors.colorHeader(paddedHeader);
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
    title: string,
    boxChars = getBoxChars(style.border_style)
): void {
    const colors = getColorFunctions(style, title);

    const formattedRow = row.map((cell, i) => {
        const width = columnWidths[i];
        return formatCell(padStringToWidth(cell, width), style, title);
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
    title: string,
    boxChars = getBoxChars(style.border_style)
): void {
    const colors = getColorFunctions(style, title);
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
    title: string,
    boxChars = getBoxChars(style.border_style)
): void {
    const colors = getColorFunctions(style, title);
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