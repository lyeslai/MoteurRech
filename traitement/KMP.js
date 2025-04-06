/**
 * Computes the prefix function for the KMP algorithm.
 *
 * @param {string} src - The pattern string.
 * @returns {number} - The length of the longest prefix that is also a suffix.
 */
function prefFn(src) {
    let maxLen = 0;
    for (let i = 1; i < src.length; i++) {
        if (src.slice(0, i) === src.slice(-i)) {
            maxLen = i;
        }
    }
    return maxLen;
}

/**
 * Computes the longest prefix-suffix (LPS) array for the KMP algorithm.
 *
 * @param {string} src - The pattern string.
 * @returns {number[]} - The LPS array.
 */
function ltsFn(src) {
    const lts = [-1];
    for (let i = 1; i <= src.length; i++) {
        lts.push(prefFn(src.slice(0, i)));
    }
    return lts;
}

/**
 * Computes the carry-over array for the KMP algorithm.
 *
 * @param {string} src - The pattern string.
 * @returns {number[]} - The carry-over array.
 */
function carryOverFn(src) {
    let lts = ltsFn(src);
    let coPrev = [];
    let coCurr = lts;

    while (JSON.stringify(coPrev) !== JSON.stringify(coCurr)) {
        const nextCo = [-1];
        for (let i = 1; i < src.length; i++) {
            let coIndex = coCurr[i] < 0 ? coCurr.length + coCurr[i] - 1 : coCurr[i];
            if (src[i] === src[coIndex]) {
                nextCo.push(coCurr[coIndex]);
            } else {
                nextCo.push(coCurr[i]);
            }
        }
        nextCo.push(0);
        coPrev = coCurr;
        coCurr = nextCo;
    }

    return coCurr;
}

/**
 * Performs the KMP search algorithm to find all occurrences of the pattern in the content.
 *
 * @param {string} pattern - The pattern to search for.
 * @param {string} content - The content to search within.
 * @returns {number[]} - Array of starting positions of the pattern in the content.
 */
function kmpSearch(pattern, content) {
    const co = carryOverFn(pattern);
    const found = [];
    let cursor = 0;
    let i = 0;

    while (cursor < content.length) {
        if (pattern[i] === content[cursor]) {
            i++;
            cursor++;
        } else {
            if (co[i] === -1) {
                i = 0;
                cursor++;
            } else {
                i = co[i];
            }
        }

        if (i === pattern.length) {
            found.push(cursor - pattern.length);
            i = co[i];
        }
    }

    return found;
}

/**
 * Performs the KMP match algorithm to find the first occurrence of the pattern in the content.
 *
 * @param {string} pattern - The pattern to search for.
 * @param {string} content - The content to search within.
 * @param {number[]} [carryOver] - Optional precomputed carry-over array.
 * @returns {number} - The starting position of the first match, or -1 if no match is found.
 */
function kmpMatch(pattern, content, carryOver = null) {
    const co = carryOver || carryOverFn(pattern);
    let cursor = 0;
    let i = 0;

    while (cursor < content.length) {
        if (pattern[i] === content[cursor]) {
            i++;
            cursor++;
        } else {
            if (co[i] === -1) {
                i = 0;
                cursor++;
            } else {
                i = co[i];
            }
        }

        if (i === pattern.length) {
            return cursor - pattern.length;
        }
    }

    return -1;
}

module.exports = { kmpSearch, kmpMatch };