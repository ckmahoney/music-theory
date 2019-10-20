import Tone from 'tone';
import * as Notes from './Notes.js';
import { assign } from '../ply.js';

/** Personal modifications to the default sounds provided by Tone.js. */
const presets = [
    { name: 'Synth',
      volume: 6
    },
    { name: 'MonoSynth',
      volume: -18 // MonoSynth is really loud by default. Turn it down.
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

/** Create a default synthesizer. When used in a loop, uses different preset per voice. */
export function Syn(voice = 0) {
  const preset = presets[voice];
  const syn = new Tone[preset.name]({preset});
  syn.volume.value= preset.volume;

  const filterFreq = (voice + 1) * 120;
  const filter = new Tone.AutoFilter("1n", filterFreq, 2);

  // syn.chain(filter);
  assign(filter, {filter: 'highpass', Q: 1.2}); 
  assign(syn, {name: preset.name, displayName: preset.name});
  return syn;
}

/** Create an abstract musical part (notes, rhythms) */
export function Part(synth, pitches) {
  const freqs = pitches.map((n) => Notes.degreeToMidi(n, 3)).map(Notes.midiToFrequency);
  const events = freqs.map((f, i) => Notes.noteEvent(f, i, 4));
  const part = new Tone.Part(function(time, note) {
    synth.triggerAttackRelease(note, "16n");
  }, events);

  assign(part, {
    pitches,
    events,
    loop: true,
    loopEnd: {"4n": events.length}
  });

  /** Replace previous Events with new Events. */
  part.update = function updateOwnPart(pitches) {
    part.removeAll()
    const freqs = pitches.map((n) => Notes.degreeToMidi(n, 3)).map(Notes.midiToFrequency);
    const events = freqs.map((f, i) => Notes.noteEvent(f, i, 4));
    events.forEach((e) => part.add(...e));
    assign(part, {pitches, events});
  }

  synth.part = part;
  addPart(part);
  return part;
}

export function PatternInput(part, defaultPattern = []) {
  console.log("Received default pattern", defaultPattern)
  const input = document.createElement('input');
  input.value = defaultPattern.length && defaultPattern.toString() || Notes.scales.major.toString();
  input.addEventListener('input', (e) => {
    updatePartPattern(part, parseInput(e.target.value))
  });

  // localize the pitches as an array for easier reference.
  // PatternInput.pitches = pitches.length && pitches || Notes.scales.major; // default value
  PatternInput.ref = input;
  return input;
}

/** Take a CSV of scale degrees and return an array of degrees. */
function parseInput(pitchString) {
  return pitchString.split(/,|\s+/)
    .map(n => n.length ? parseInt(n) : n); // allow empty strings for empty beats.
}

/** Reset the parts content to a new Pitch array. */
export function updatePartPattern(part, pitches) {
  part.update(pitches);
}

/** Display an input to dictate note performance. 
    It updates the assigned part onInput. */
function _ManualInput() {
  ManualInput.assign = function(part) {
    ManualInput.part = part;
    updateManualPitches();
    ManualInput.part.update(ManualInput.pitches);
  }

  if (!ManualInput.ref) {
    const input = document.createElement('input');
    ManualInput.pitches = Notes.scales.major;
    input.value = ManualInput.pitches.toString();
    input.addEventListener('input', updateManualPitches);
    input.addEventListener('input', updatePartPattern);
    ManualInput.ref = input;
    document.body.appendChild(input);
  }

  function updateManualPitches() {
    ManualInput.pitches = ManualInput.ref.value.split(/,|\s+/)
      .filter(n => !!n)
      .map(n => parseInt(n));
  }

  function updatePartPattern() {
    ManualInput.part.update(ManualInput.pitches);
  }

  return ManualInput.ref;
}

/** Add a playable part to the global scope. */
function addPart(part, ...parts) {
  window.parts.push(part);
  if (parts.length)
    parts.forEach(p => window.parts.push(p));
}