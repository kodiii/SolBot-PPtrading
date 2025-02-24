/**
 * Removes ANSI escape codes from a string
 */
export function stripAnsi(str: string): string {
    // Match chalk's specific escape code format
    return str.replace(/\u001b\[\d+m|\u001b\[0m/g, '');
}
