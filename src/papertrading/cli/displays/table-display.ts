import { DashboardStyle } from '../../config/dashboard_style';
import { renderTableHeader, renderTableRow, renderTableSeparator, renderTableFooter, calculateTableWidth, getEffectiveTableWidth } from '../table-renderer';

/**
 * Displays a table with the given content and styling
 */
export function displayTable(
    title: string,
    headers: string[],
    rows: string[][],
    columnWidths: number[],
    style: DashboardStyle,
    fixedHeader: boolean = false
): void {
    // Add spacing based on configuration
    console.log('\n'.repeat(style.section_spacing));

    // Calculate total table width for this section
    const tableWidth = getEffectiveTableWidth(title, columnWidths, style);

    // Render header
    renderTableHeader(title, headers, columnWidths, style);

    // Render rows with separators
    rows.forEach((row, rowIndex) => {
        renderTableRow(row, columnWidths, style);
        if (style.row_separator && rowIndex < rows.length - 1) {
            renderTableSeparator(tableWidth, style);
        }
    });

    // Render footer with the section's width
    renderTableFooter(tableWidth, style);
}