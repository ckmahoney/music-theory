export const notes = ['c', 'c#', 'd', 'd#', 'e', 'e#', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];

export const scales = {
  major: [0, 2, 4, 5, 7, 9 , 11],
  minor: [0, 2, 3, 5, 7, 8 , 11],
  pentatonic: [0, 2, 4, 7, 9],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 
  diminished: [0, 1, 3, 4, 6, 7, 9, 10]
}

export const duration = {
  "1/4": "0:0:1",
  "2/4": "0:0:2",
  "3/4": "0:0:3",
  "4/4": "0:1:0",
  "6/4": "0:1:2",
  "8/4": "0:2:0",
  "10/4":"0:2:2",
  "12/4":"0:3"
}

/** Convert a midi note signal to a pitch frequency. */
export function midiToFrequency(m) {
  const freq = Math.pow(2, (m-69)/12) * 440;
  return freq;
}

/** Convert a scale degree to a frequency. 
 * Notes are provided between 0 and 11 with an octave modifer. */
export function degreeToMidi(note, octave = 5, root = 'c') {
  const keyMod = notes.findIndex((pitch) => pitch == root.toLowerCase());
  return keyMod + note + (octave * 12);
}

/** Create a valid Time Event as [timestamp, freq]. */
export function noteEvent(freq, i = 0, beatFreq = 4) {
  const bar = Math.floor(i/beatFreq);
  const division = i % beatFreq;
  const timestamp = `${bar}:${division}`;
  return [timestamp, freq];
}

/** Harmonize a set of notes diatonic to a scale by interval of thirds. */
export function diatonicHarmony(pattern, scale = 'major', voices = 3) {
  if (!scales[scale])
    return pattern;

  return scales[scale].reduce((harmonies, degree, index, src) => {
    if (!harmonies.length) 
      for (let i = 0; i < voices; i++) harmonies[i] = [];
    
    for (let i = 0; i < voices; i++) {
      const voiceDegree = (index + (i * 2)) % src.length;
      harmonies[i].push(src[voiceDegree]);
    }

    return harmonies;
  }, []);
}

/** Augment or diminish a time pattern by a constant scale. */
export function scaleTime(timeList, scale = 2) {
  return normalizeTimeList(timelist.map(t => t * scale));
}

function normalizeTimeList(timeList) {
  const limit = 4;
  let surplus = 0;
  const newList = timeList.reduce((newList, part, index, src) => {
    if (part < 1) {
      src[index + 1] += 1/part;
      newList.push(0);
    }

    if (index > 0 && part > limit) {
      surplus = Math.floor(part / limit);
      newList[index - 1] += surplus;
      newList.push(part % limit);
    }

    else { // It is a Bar qty larger than limit, which is fine.
      newList.push(part);
    }

    return newList;
  }, []);

  // Only Bars may be greater than 4, and none should be less than 1.
  if (newList.find((el, i) => i > 0 && el > limit) || newList.find(el => el < 1))
    return normalizeTimeList(newList);

  return newList;
}

/** Harmonize a pattern by a constant interval. 
  * Useful for stacking perfect 4ths, 5ths, and 8ves. */
export function intervallicHarmony(pattern, interval = 4, voices = 3) {
  return pattern.reduce((harmonies, degree, index, src) => {
    if (!harmonies.length) 
      for (let i = 0; i < voices; i++) harmonies[i] = [];
    
    for (let i = 0; i < voices; i++) {
      const rootIndex = scales.chromatic.findIndex((d) => d == pattern[i]);
      const harmDegree = (rootIndex + interval) % scales.chromatic.length;
      harmonies[i].push(harmDegree);
    }

    return harmonies;
  }, []);
}

/** Transform a timestring to a numeric list of [bars, quarters, sixteenths]. */
export function timestampToList(time) {
  if (time.indexOf(':') == -1)
    throw 'Received incorrect type of time value: ' + typeof time + " " + time.toSource();

  return time.split(/:/);
}

/** Take a CSV of scale degrees and return an array of degrees. */
export function parseInput(pitchString) {
  return pitchString.split(/,|\s+/)
    .map(n => n.length ? parseInt(n) : n); // allow empty strings for empty beats.
}