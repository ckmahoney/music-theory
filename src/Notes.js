export const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
export const scales = {
  major: [0, 2, 4, 5, 7, 9 , 11],
  minor: [0, 2, 3, 5, 7, 8 , 10],
  pentatonic: [0, 2, 4, 7, 9],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 
  diminished: [0, 1, 3, 4, 6, 7, 9, 10]
}

/** Convert a midi note signal to a pitch frequency. */
export function midiToFrequency(m) {
  const freq = Math.pow(2, (m-69)/12) * 440;
  return freq;
}

/** Given a set of degrees or notes, returns as a new list whose contents are randomized from list. */
export function randomFromList(list, length) {
  const notes = [];
  for (let i = 0; i < length; i++) 
    notes.push(list[randomInt(0, randomNumber.length)]);

  return restifyList(notes);
}

export function restifyList(notes) {
  console.warn("This is only a stub. ", restifyLists);
  return notes;
}

/** Convert a pattern of scale degrees to target key center 
  * formatted for use with Tidal.js */
export function getPitchedScale(mode = ['d', 'minor'], octave = 4) {
  const [ key, scale ] = mode;
  const fundamental = notes.findIndex((root) => root == key.toLowerCase());
  return scales[scale].map((degree, index, degrees) => {
    let location = fundamental + degree;
    let mod = 0;
    if (location >= notes.length) {
      location -= notes.length;
      mod++;
    }
    const note = notes[location];
    return note.toUpperCase() + (octave + mod);
  })
}

/** Convert a scale degree to a frequency. 
 * Notes are provided between 0 and 11 with an octave modifer. */
export function degreeToMidi(note, octave = 5, root = 'c') {
  const keyMod = notes.findIndex((pitch) => pitch == root.toLowerCase());
  return keyMod + note + (octave * 12);
}

export function degreeToPitches(pattern, mode = ['d', 'minor'], octave = 4) {
  const [ key, scale ] = mode;
  const fundamental = notes.findIndex((root) => root == key.toLowerCase());
  const target = scales[scale];
  return pattern.reduce((pitches, degree, index) => {
    const note = notes[(fundamental + degree) % notes.length];
    pitches.push(note.toUpperCase() + octave);
    return pitches;
  }, [])
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

/** Augment or diminish a time pattern by a constant scale. */
export function scaleTime(timeList, scale = 2) {
  if (typeof timeList == 'string')
    timeList = timestampToList(timeList);

  console.log("Preparing scaled time : ", timeList.map(t => t * scale));
  return normalizeTimeList(timeList.map(t => t * scale));
}

/** Transform a timeList to a usable Tone.js format. */
export function timeListToString(timeList) {
  return timeList.join(':');
}

/** Formats a provided timeList into a correct beat divisions. */
function normalizeTimeList(timeList) {
  const limit = 4;
  const newList = timeList.reduce((newList, part, index, src) => {
    // A fractional value to be re-allocated to the next subdivision.
    if (part % 1) { 
      console.log("index, part", index, part )
      // Fractions of one sixteenth are not allowed; set the minimum sixteenth to 1.
      if (index == 2) {
        newList.push(1);
      }
      else {
        src[index + 1] += 1/part;
        newList.push(0);
      }

      return newList;
    }

    // Allocate superfluous beat quantity to the proper unit of time.
    if (index > 0 && part >= limit) {
      newList[index - 1] += Math.floor(part / limit);
      newList.push(part % limit);
    }

    // The Bar quantity is larger than limit, which is fine.
    else {   
      newList.push(part);
    }

    return newList;
  }, []);

  // Only Bars may be greater than 4, and no units should be less than 1.
  if (newList.find((el, i) => i > 0 && el > limit) || newList.find(el => el < 1))
    return normalizeTimeList(newList);

  return newList;
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

function randomInt(min= 1, max = 10) {
  return Math.floor(Math.random() * (max - min)) + min;
}