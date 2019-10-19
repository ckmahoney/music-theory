'use strict';
import Tone from 'tone';
import * as Notes from './src/Notes.js';
import * as Components from './src/Components.js';

init();

function log(item, msg = '') {
  console.log(msg, typeof item, item);
}

function start() {
  if (Tone.Transport.state == 'started')
    return Tone.Transport.pause();

  Tone.Transport.bpm.value = 132;
  Tone.start();
  Tone.Transport.start();

  window.parts.forEach((part) => part.start());
}

function init() {
  ManualInput();
  console.log(ManualInput)
  console.log(ManualInput.pitches)
  window.parts = [];
  const adsr = {
    a: 0.08,
    d: 1,
    s: .8,
    r: 0.5
  }

  const leadFilterFreq = 420;
  const leadFilter = new Tone.AutoFilter("1n", leadFilterFreq, 1);
  const lead = new Tone.Synth({
    oscillator : {
      type : "fatsquare"
    },
    envelope : adsr
  });

  const kickFilterFreq = 200;
  const kickFilter = new Tone.AutoFilter("4n", kickFilterFreq, 1);
  const kick = new Tone.FMSynth({
    envelope: {
      decay: 0.1,
      sustain: 0.1,
      release: 0.1
    }
  });

  const kickPart = new Tone.Part((t, n) => {
    kick.triggerAttackRelease(n, "8n", t);
  }, [["0:0", "G1"],["0:1", "G1"], ["0:2", "G1"], ["0:3", "G#1"], ["0:3:2", "G1"]]);

  // const leadPart = createPart(lead, ManualInput.pitches);
  const parts = Notes.diatonicHarmony(ManualInput.pitches);
  console.log("generated parts", parts);
  const syns = parts.map((p, i) => {
    const syn = createSyn();
    console.log("created part with syn and parts", syn, p)
    const part = createPart(syn, p);
    assign(syn, {name: 'syn' + i, displayName: "Synth " + i});
    return syn;
  });

  // ManualInput.assign(leadPart);

  assign(lead, {name: 'lead', displayName: 'Lead Synth'});
  assign(kick, {name: 'kick', displayName: 'Kick'});

  const gui = Components.GUI([kick, ...syns]);
  document.body.appendChild(gui);
  document.querySelector("#play").addEventListener('click', start);
}

function createSyn() {
  const synFilterFreq = 620;
  const synFilter = new Tone.AutoFilter("1n", synFilterFreq, 2);
  const syn = new Tone.Synth({
    oscillator : {
      type : "fatsquare"
    }
  });

  return syn;
}

/** Create an abstract musical part (notes, rhythms) */
function createPart(synth, pitches) {
  const freqs = pitches.map((n) => Notes.degreeToMidi(n, 3)).map(Notes.midiToFrequency);
  const events = freqs.map((f, i) => Notes.noteEvent(f, i, 4));
  const part = new Tone.Part(function(time, note) {
    console.log("Playing for synth ");
    console.log(synth.name);
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
    // debugger;
    const freqs = pitches.map((n) => Notes.degreeToMidi(n, 3)).map(Notes.midiToFrequency);
    const events = freqs.map((f, i) => Notes.noteEvent(f, i, 4));
    events.forEach((e) => part.add(...e));
    // console.log("added the events, then part.events: ", part._events[0]);
    // debugger;
    assign(part, {pitches, events});
  }

  synth.part = part;
  addPart(part);
  return part;
}

/** Display an input to dictate note performance. 
    It updates the assigned part onInput. */
function ManualInput() {
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

/** Modify object properties in place. */
function assign(target, fields = {}) {
  for (let k in fields)
    target[k] = fields[k];
}

/** Add a playable part to the global scope. */
function addPart(part, ...parts) {
  window.parts.push(part);
  if (parts.length)
    parts.forEach(p => window.parts.push(p));
}