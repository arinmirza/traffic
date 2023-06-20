import type { DurationMatrixJSON } from "../api/matrix/+server";

export type DurationMatrix = number[][];


export function buildDurationMatrix(response: DurationMatrixJSON) {
    return response.rows.map(row => row.elements.map(e => e.duration.value));
}