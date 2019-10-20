'use strict';
import Tone from 'tone';
import * as Notes from './src/Notes.js';
import { GUI } from './src/Components.js';
import * as Syn from './src/Syn.js';

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
  window.parts = [];
  const adsr = {
    a: 0.08,
    d: 1,
    s: .8,
    r: 0.5
  }


  // const kickPart = new Tone.Part((t, n) => {
  //   kick.triggerAttackRelease(n, "8n", t);
  // }, [["0:0", "G1"],["0:1", "G1"], ["0:2", "G1"], ["0:3", "G#1"], ["0:3:2", "G1"]]);
  // assign(kick, {name: 'kick', displayName: 'Kick'});



  const parts = Notes.diatonicHarmony(Notes.scales.major);
  const syns = parts.map(Syn.createSynth);

  const gui = GUI(syns);
  document.body.appendChild(gui);
  document.querySelector("#play").addEventListener('click', start);
}


/** Modify object properties in place. */
export function assign(target, fields = {}) {
  for (let k in fields)
    target[k] = fields[k];
}
