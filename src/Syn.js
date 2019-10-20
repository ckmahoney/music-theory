import Tone from 'tone';
import * as Notes from './Notes.js';
import { assign } from '../ply.js';

/** Personal modifications to the default sounds provided by Tone.js. */
const presets = [
  { name: 'Synth',
    volume: 6
  },
  { name: 'MonoSynth',
    volume: -18 // MonoSynth is really loud by default so turn it down. 
  },
  { name: 'AMSynth',
    volume: 12 
  },
  { name: 'FMSynth', 
    volume: 8 
  },
  { name: 'PluckSyth',
    volume: 6 
  }
];

export function createSynth(pattern, voice = 0)  {
  const syn = Preset(voice);
  const part = Part(syn, pattern, 3 + voice % 3);
  assign(syn, {part});
  return syn;
}

/** Create a default synthesizer. When used in a loop, uses different preset per voice. */
export function Preset(voice = 0) {
  const preset = presets[voice];
  const syn = new Tone[preset.name]({preset});
  syn.volume.value= preset.volume;
  assign(syn, {name: preset.name, displayName: preset.name});

  return syn;
}

/** Create an abstract musical part (notes, rhythms) */
export function Part(synth, pattern = [], octave = 4, duration = "0:0:2") {
  const freqs = pattern.map((n) => Notes.degreeToMidi(n, octave)).map(Notes.midiToFrequency);
  const events = freqs.map((f, i) => Notes.noteEvent(f, i, 4));
  const part = new Tone.Part(function(time, note) {
    synth.triggerAttackRelease(note, duration);
  }, events);

  assign(part, {
    duration,
    pattern,
    octave,
    events,
    loop: true,
    loopEnd: {"4n": events.length}
  });

  /** Replace previous Events with new Events. */
  part.update = function updateOwnPart(pattern, octave = 4, duration = "0:0:2") {
    // The difference in this and the above code is here we must remove all existing events,
    // create new events for new pattern, add them to the part, and update the Part object.
    part.removeAll();
    const freqs = pattern.map((n) => Notes.degreeToMidi(n, octave)).map(Notes.midiToFrequency);
    const events = freqs.map((f, i) => Notes.noteEvent(f, i, 4));
    events.forEach((e) => part.add(...e));
    assign(part, {pattern, octave, events});
  }

  synth.part = part;
  addPart(part);
  return part;
}

/** The difference in this and the above code is here we must remove all existing events,
  * create new events for new pattern, add them to the part, and update the Part object. */
export function updatePart(pattern, octave = 4, duration = "0:0:2") {
    part.removeAll();
    const freqs = pattern.map((n) => Notes.degreeToMidi(n, octave)).map(Notes.midiToFrequency);
    const events = freqs.map((f, i) => Notes.noteEvent(f, i, 4));
    events.forEach((e) => part.add(...e));
    assign(part, {pattern, octave, events});  
}

/** Reset the parts content to a new Pitch array. */
export function updatePartPattern(part, pattern) {
  part.update(pattern);
}


/** Add a playable part to the global scope. */
function addPart(part, ...parts) {
  window.parts.push(part);
  if (parts.length)
    parts.forEach(p => window.parts.push(p));
}

