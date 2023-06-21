export function countFrequencies(array) {
  const frequencies = {};
  for (const val of array) {
    frequencies[val] = frequencies[val] ? frequencies[val] + 1 : 1;
  }
  return frequencies;
}

/**
 * @param {object} freqObj
 * @returns {Array<{key, value}>}
 */
export function sortFrequencies(freqObj) {
  const arr = Object.keys(freqObj).reduce((arr, key) => {
    arr.push({ key: key, value: freqObj[key] });
    return arr;
  }, []);
  const sortedArr = arr.sort((a, b) => b.value - a.value);
  return sortedArr;
}

export function getRandomElements(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
