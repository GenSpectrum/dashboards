/** Assign each visible breakdown part its own color, with one color for the remaining parts. */
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];

export const OTHER_COLOR = '#b5b3aa';

const MAX_SERIES = SERIES_COLORS.length - 1;

export const SEQUENTIAL = ['#a8d4ff', '#81bbff', '#5ea3fb', '#408be8', '#2974ce', '#1a5eae', '#144a8a', '#143763'];

/** Color for a mapped area with no sequences. */
export const NO_DATA_COLOR = '#dcd9d0';

/** Color for the map background and areas outside the selection. */
export const MAP_GROUND = '#f2f4f6';
export const MAP_BORDER = '#dcdcd6';
export const OUTSIDE_STROKE = '#c6ccd2';

export function colorMap(keys: readonly string[]): Map<string, string> {
    return new Map(keys.slice(0, MAX_SERIES).map((key, index) => [key, SERIES_COLORS[index]]));
}
