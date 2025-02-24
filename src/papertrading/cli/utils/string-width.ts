/**
 * Gets the visual width of a Unicode character
 * @param char The character to measure
 * @returns The visual width of the character
 */
function getCharWidth(char: string): number {
    const code = char.codePointAt(0) || 0;

    // Zero-width characters
    if (
        (code >= 0x300 && code <= 0x36F) || // Combining marks
        (code >= 0x200B && code <= 0x200F) || // Zero-width spaces and marks
        (code >= 0xFE00 && code <= 0xFE0F) // Variation selectors
    ) {
        return 0;
    }

    // Emoji (including modifiers and ZWJ sequences)
    if (
        (code >= 0x1F000 && code <= 0x1F9FF) || // Extended pictographic
        (code >= 0x1F300 && code <= 0x1F9FF) || // Misc symbols and pictographs
        (code >= 0x2600 && code <= 0x26FF) || // Misc symbols
        (code >= 0x2700 && code <= 0x27BF) || // Dingbats
        (code >= 0xFE00 && code <= 0xFE0F) || // Variation selectors
        (code >= 0x1F900 && code <= 0x1F9FF) // Supplemental symbols and pictographs
    ) {
        return 2;
    }

    // Wide characters
    if (
        (code >= 0x1100 && code <= 0x115F) || // Hangul Jamo
        (code >= 0x2E80 && code <= 0x303E) || // CJK Radicals
        (code >= 0x3040 && code <= 0x309F) || // Hiragana
        (code >= 0x30A0 && code <= 0x30FF) || // Katakana
        (code >= 0x3400 && code <= 0x4DBF) || // CJK Unified Extension A
        (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified
        (code >= 0xAC00 && code <= 0xD7A3) || // Hangul Syllables
        (code >= 0xF900 && code <= 0xFAFF) || // CJK Compatibility
        (code >= 0xFF00 && code <= 0xFF60) || // Fullwidth forms
        (code >= 0xFFE0 && code <= 0xFFE6) || // Fullwidth symbols
        (code >= 0x20000 && code <= 0x2FFFD) || // CJK Extension B
        (code >= 0x30000 && code <= 0x3FFFD)    // CJK Extension C
    ) {
        return 2;
    }

    // Default for all other characters
    return 1;
}

/**
 * Gets the visual width of a string, accounting for all Unicode characters
 * @param str The string to measure
 * @returns The visual width of the string
 */
export function getStringWidth(str: string): number {
    let width = 0;
    const chars = Array.from(str);
    let i = 0;

    while (i < chars.length) {
        const char = chars[i];
        const nextChar = chars[i + 1];

        // Check for surrogate pairs
        if (
            char.charCodeAt(0) >= 0xD800 && 
            char.charCodeAt(0) <= 0xDBFF &&
            nextChar &&
            nextChar.charCodeAt(0) >= 0xDC00 && 
            nextChar.charCodeAt(0) <= 0xDFFF
        ) {
            // This is a surrogate pair, treat as one character
            width += getCharWidth(char + nextChar);
            i += 2;
            continue;
        }

        width += getCharWidth(char);
        i++;
    }

    return width;
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

/**
 * Truncates a string to a specific visual width
 * @param str The string to truncate
 * @param width The maximum visual width
 * @param ellipsis The string to use as ellipsis (default: '...')
 * @returns The truncated string
 */
export function truncateToWidth(str: string, width: number, ellipsis: string = '...'): string {
    if (getStringWidth(str) <= width) return str;

    const ellipsisWidth = getStringWidth(ellipsis);
    let result = '';
    let currentWidth = 0;
    const chars = Array.from(str);

    for (const char of chars) {
        const charWidth = getCharWidth(char);
        if (currentWidth + charWidth + ellipsisWidth > width) break;
        result += char;
        currentWidth += charWidth;
    }

    return result + ellipsis;
}