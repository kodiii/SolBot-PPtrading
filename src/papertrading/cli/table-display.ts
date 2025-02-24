import { DashboardStyle } from '../config/dashboard_style';
import { renderTableHeader, renderTableRow, renderTableSeparator, renderTableFooter, calculateTableWidth, getEffectiveTableWidth } from './table-renderer';

/**
 * Displays a table with the given content and styling
 */
export default class TableDisplay {
    public displayTable(
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
            renderTableRow(row, columnWidths, style, title);
            if (style.row_separator && rowIndex < rows.length - 1) {
                renderTableSeparator(tableWidth, style, title);
            }
        });

        // Render footer with the section's width
        renderTableFooter(tableWidth, style, title);
    }

    public display(
        title: string,
        headers: string[],
        rows: string[][],
        columnWidths: number[],
        style: DashboardStyle,
        fixedHeader: boolean = false
    ): void {
        this.displayTable(title, headers, rows, columnWidths, style, fixedHeader);
    }

    /**
     * Legacy method to maintain backwards compatibility
     */
    public static renderTableHeader(
        title: string,
        headers: string[],
        columnWidths: number[],
        style: DashboardStyle
    ): void {
        renderTableHeader(title, headers, columnWidths, style);
    }

    /**
     * Legacy method to maintain backwards compatibility
     */
    public static renderTableRow(
        row: string[],
        columnWidths: number[],
        style: DashboardStyle,
        title: string
    ): void {
        renderTableRow(row, columnWidths, style, title);
    }

    /**
     * Legacy method to maintain backwards compatibility
     */
    public static renderTableSeparator(
        tableWidth: number,
        style: DashboardStyle,
        title: string
    ): void {
        renderTableSeparator(tableWidth, style, title);
    }

    /**
     * Legacy method to maintain backwards compatibility
     */
    public static renderTableFooter(
        tableWidth: number,
        style: DashboardStyle,
        title: string
    ): void {
        renderTableFooter(tableWidth, style, title);
    }

    /**
     * Legacy method to maintain backwards compatibility
     */
    public static calculateTableWidth(columnWidths: number[]): number {
        return calculateTableWidth(columnWidths);
    }
}

/**
 * Singleton instance for table display
 */
const tableDisplay = new TableDisplay();
export { tableDisplay };