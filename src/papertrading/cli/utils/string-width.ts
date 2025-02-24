/**
 * Gets the visual width of a string, accounting for wide characters
 * @param str The string to measure
 * @returns The visual width of the string
 */
export function getStringWidth(str: string): number {
    return Array.from(str).reduce((width, char) => {
        const code = char.codePointAt(0) || 0;
        
        // Handle emoji and other surrogate pairs
        if (code > 0xFFFF) {
            return width + 2;
        }

        // Handle wide characters (CJK, emojis, etc.)
        if (
            (code >= 0x1100 && code <= 0x115F) || // Hangul Jamo
            (code >= 0x2E80 && code <= 0x9FFF) || // CJK
            (code >= 0xAC00 && code <= 0xD7A3) || // Hangul Syllables
            (code >= 0xF900 && code <= 0xFAFF) || // CJK Compatibility Ideographs
            (code >= 0xFE30 && code <= 0xFE6F) || // CJK Compatibility Forms
            (code >= 0xFF00 && code <= 0xFF60) || // Fullwidth Forms
            (code >= 0xFFE0 && code <= 0xFFE6) || // Fullwidth Forms
            (code >= 0x20000 && code <= 0x2FFFD) || // CJK Unified Ideographs Extension B
            (code >= 0x30000 && code <= 0x3FFFD)    // CJK Unified Ideographs Extension C
        ) {
            return width + 2;
        }

        return width + 1;
    }, 0);
}

/**
 * Pads a string to a specific visual width
 * @param str The string to pad
 * @param width The desired visual width
 * @param align 'left' or 'right' alignment
 * @returns The padded string
 */
export function padStringToWidth(str: string, width: number, align: 'left' | 'right' = 'left'): string {
    const visualWidth = getStringWidth(str);
    const padLength = Math.max(0, width - visualWidth);
    const padding = ' '.repeat(padLength);

    return align === 'left' ? str + padding : padding + str;
}