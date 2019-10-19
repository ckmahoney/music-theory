import Tone from 'tone';

export const notes = ['c', 'c#', 'd', 'd#', 'e', 'e#', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];

export const scales = {
  major: [0, 2, 4, 5, 7, 9 , 11],
  minor: [0, 2, 3, 5, 7, 8 , 11],
  pentatonic: [0, 2, 4, 7, 9],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
}

/** Convert a midi note signal to a pitch frequency. */
export function midiToFrequency(m) {
  const freq = Math.pow(2, (m-69)/12) * 440;
  return freq;
}

/** Convert a scale degree to a frequency. */
export function degreeToMidi(note, octave = 5, root = 'c') {
  note = parseInt(note);
  // Note is between 0 and 11. 
  const keyMod = Notes.findIndex((pitch) => pitch == root.toLowerCase());
  return keyMod + note + (octave * 12)
}

/** Create a valid Time Event as [timestamp, freq]. */
export function noteEvent(freq, i = 0, beatFreq = 4) {
  const bar = Math.floor(i/beatFreq);
  const division = i % beatFreq;
  const timestamp = `${bar}:${division}`;
  return [timestamp, freq];
}