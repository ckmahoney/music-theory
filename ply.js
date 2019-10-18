'use strict';
import Tone from 'tone';
window.Tone = Tone;


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

lead.displayName = "Lead Synth";

const kickFilterFreq = 200;
const kickFilter = new Tone.AutoFilter("4n", kickFilterFreq, 1);
const kick = new Tone.FMSynth({
  envelope: {
    decay: 0.1,
    sustain: 0.1,
    release: 0.1
  }
});

kick.displayName = "Kick";

const kickPart = new Tone.Part((t, n) => {
  kick.triggerAttackRelease(n, "8n", t);
}, [["0:0", "G1"],["0:1", "G1"], ["0:2", "G1"], ["0:3", "G#1"], ["0:3:2", "G1"]]);

const leadPart = new Tone.Part((time, note) => {
  lead.triggerAttackRelease(note, "8n", time);
}, [["0:0", "C2"], ["0:2", "G3"], ["0:3:2", "G2"]]);

function start() {
  if (Tone.Transport.state == 'started')
    return Tone.Transport.pause();

  Tone.Transport.bpm.value = 132;
  Tone.start();
  Tone.Transport.start();

  leadPart.loop = true;
  leadPart.start();
  kickPart.loop = true;
  kickPart.start();

  const gui = createGUI(kick, lead);
  document.body.appendChild(gui);
}

/** Display visual controls to control a synthesizer. */
function createGUI(kick, lead) {
  const kickVol = VolumeFader(kick);
  const leadVol = VolumeFader(lead);

  const kickEQ = EQPanel(kick);
  const leadEQ = EQPanel(lead);

  const kickPanel = Panel([kickVol, kickEQ], kick.displayName);
  const leadPanel = Panel([leadVol, leadEQ], lead.displayName);
  window.lead = lead;
  window.kick = kick;
  // lead.toMaster();
  // kick.toMaster();
  return Panel([kickPanel, leadPanel]);
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
    console.log('editing band ' + band);
    console.log(eq[band].value);
    console.log(event.target.value);
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

document.querySelector("#play").addEventListener('click', start);