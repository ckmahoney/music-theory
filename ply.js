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
    const syn = createSyn(i);
    const part = createPart(syn, p);
    return syn;
  });

  // ManualInput.assign(leadPart);

  assign(lead, {name: 'lead', displayName: 'Lead Synth'});
  assign(kick, {name: 'kick', displayName: 'Kick'});

  const gui = Components.GUI([kick, ...syns]);
  document.body.appendChild(gui);
  document.querySelector("#play").addEventListener('click', start);
}

/** Modify object properties in place. */
export function assign(target, fields = {}) {
  for (let k in fields)
    target[k] = fields[k];
}
