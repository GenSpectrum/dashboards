/** Leave invalid URL escapes unchanged so they can be handled by the caller. */
export function decodedValue(text: string): string {
    try {
        return decodeURIComponent(text);
    } catch {
        return text;
    }
}

export function capitalized(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export const UNEXPECTED_ERROR =
    'Unexpected error: please try reloading the page. If the error remains, please create an issue at ' +
    'https://github.com/genSpectrum/dashboards.';
