'use strict';
import Tone from 'tone';
import * as Notes from './src/Notes.js';
import * as Components from './src/Components.js';
function log(name, item) {
  console.log(name, typeof item, item);
}


function addPart(part, ...parts) {
  window.parts.push(part);
  if (parts.length)
    parts.forEach(p => window.parts.push(p));
}

init();

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

  const leadPart = createPart(lead, ManualInput.pitches);
  ManualInput.assign(leadPart);


  assign(lead, {name: 'lead', displayName: 'Lead Synth'});
  assign(kick, {name: 'kick', displayName: 'Kick'});

  const gui = createGUI([kick, lead]);
  document.body.appendChild(gui);
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

function start() {
  if (Tone.Transport.state == 'started')
    return Tone.Transport.pause();

  Tone.Transport.bpm.value = 132;
  Tone.start();
  Tone.Transport.start();

  window.parts.forEach((part) => part.start());
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
    ManualInput.pitches = Scales.major;
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
function assign(object, fields) {
  for (let k in fields)
    object[k] = fields[k];
}

document.querySelector("#play").addEventListener('click', start);