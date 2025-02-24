import { DashboardStyle } from '../../config/dashboard_style';
import { renderTableHeader, renderTableRow, renderTableSeparator, renderTableFooter, calculateTableWidth } from '../table-renderer';

/**
 * Displays a table with the given content and styling
 */
export function displayTable(
    title: string,
    headers: string[],
    rows: string[][],
    columnSizes: number[],
    style: DashboardStyle,
    fixedHeader: boolean = false
): void {
    // Add spacing based on configuration
    console.log('\n'.repeat(style.section_spacing));

    // Calculate total table width
    const tableWidth = calculateTableWidth(columnSizes);

    // Render header
    renderTableHeader(title, headers, columnSizes, style);

    // Render rows with separators
    rows.forEach((row, rowIndex) => {
        renderTableRow(row, columnSizes, style);
        if (style.row_separator && rowIndex < rows.length - 1) {
            renderTableSeparator(tableWidth, style);
        }
    });

    // Render footer
    renderTableFooter(tableWidth, style);
}