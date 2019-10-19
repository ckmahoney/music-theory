'use strict';
import Tone from 'tone';
window.Tone = Tone;
function log(name, item) {
  console.log(name, typeof item, item);
}

const Scales = {
  major: [0, 2, 4, 5, 7, 9 , 11],
  minor: [0, 2, 3, 5, 7, 8 , 11]
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

/** Create a valid Time Event as [timestamp, freq]. */
function noteEvent(freq, i = 0, beatFreq = 4) {
  const bar = Math.floor(i/beatFreq);
  const division = i % beatFreq;
  const timestamp = `${bar}:${division}`;
  return [timestamp, freq];
}

/** Create an abstract musical part (notes, rhythms) */
function createPart(synth, pitches) {
  const freqs = pitches.map((n) => degreeToMidi(n, 3)).map(midiToFrequency);
  const events = freqs.map((f, i) => noteEvent(f, i, 4));
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
    const freqs = pitches.map((n) => degreeToMidi(n, 3)).map(midiToFrequency);
    const events = freqs.map((f, i) => noteEvent(f, i, 4));
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

/** Display visual controls to control a synthesizer. */
function createGUI(synths) {
  const children = synths.map(ControlPanel);
  synths.forEach(s => {window[s.name] = s}); // for development

  return Panel(children);
}

/** Display a set of controls for a target Synthesizer. */
function ControlPanel(syn) {
  syn.panels = [
    VolumeFader(syn),
    EQPanel(syn)
  ];

  return Panel(syn.panels, syn.displayName);
}

/** Display a fader for the synthesizer's volume. */
function VolumeFader(syn) {
  const input = document.createElement('input');
  const volume = {
    name: syn.displayName + ' Volume',
    min: -12,
    max: 12,
    value: 0,
    step: 1
  }

  // Each synth already has a member #volume; use that rather than new Tone.Volume.
  function onChange(event) {
    syn.volume.value = event.target.value;
  }

  return Range(volume, onChange);
}

/** Create an EQ3 for `syn`, connect it, and display a panel. */
function EQPanel(syn) {
  const eq = new Tone.EQ3();
  const volume = {
    min: -12,
    max: 12,
    value: 0,
    step: 1
  }

  const lowCutoff = {
    name: 'Low Cutoff',
    min: 120,
    max: 360,
    value: 240,
    step: 4
  }

  const highCutoff = {
    name: 'High Cutoff',
    min: 1800,
    max: 3200,
    value: 2400,
    step: 40
  }

  const bands = ['low', 'mid', 'high'];
  const ranges = bands.map((band) => Range({name: band, ...volume}, (event) => {
    // Set the new volume at this band range. 
    eq[band].value = event.target.value;
  }));

  const lowCutoffRange = Range(lowCutoff, function onLowFrequencyChange(event) {
    eq.lowFrequency.value = event.target.value;
  });

  const highCutoffRange = Range(highCutoff, function onHighFrequencyChange(event) {
    eq.highFrequency.value = event.target.value;
  });

  syn.chain(eq, Tone.Master);
  return Panel([...ranges, lowCutoffRange, highCutoffRange], syn.displayName + ' EQ');
}

/** Display a panel of related controls. */
function Panel(children, displayName = '') {
  const panel = document.createElement('div');
  panel.className = 'panel';

  if (displayName) {
    const label = document.createElement('h2');
    label.textContent = displayName;
    panel.appendChild(label);
  }

  for (const child of children) 
    panel.appendChild(child);

  return panel;
}

/** Create an <input type="range" /> for arbitrary controls. */
function Range(values, onInput) {
  const input = document.createElement('input');
  const defaults = {
    type: 'range',
    name: '',
    min: -1,
    max:1,
    step: 1,
    value: 0
  }

  values = Object.assign(defaults, values);
  for (const k in values) input[k] = values[k];
 
  input.addEventListener("input", onInput);

  const group = document.createElement('div');
  const label = document.createElement('label');
  label.textContent = values.name;

  group.appendChild(label);
  group.appendChild(input);
  return group;
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

/** Convert a midi note signal to a pitch frequency. */
function midiToFrequency(m) {
  const freq = Math.pow(2, (m-69)/12) * 440;
  return freq;
}

/** Convert a scale degree to a frequency. */
function degreeToMidi(note, octave = 5, root = 'c') {
  note = parseInt(note);
  // Note is between 0 and 11. 
  const rootMap = ['c', 'c#', 'd', 'd#', 'e', 'e#', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
  const keyMod = rootMap.findIndex((pitch) => pitch == root.toLowerCase());
  return keyMod + note + (octave * 12)
}

/** Modify object properties in place. */
function assign(object, fields) {
  for (let k in fields)
    object[k] = fields[k];
}

document.querySelector("#play").addEventListener('click', start);