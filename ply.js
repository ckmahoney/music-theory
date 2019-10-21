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

  const parts = Notes.diatonicHarmony(Notes.scales.major);
  const syns = parts.map(Syn.createSynth);

  const btn = document.createElement('button');
  btn.textContent = "Show DAW";
  btn.addEventListener('click', () => {
    const gui = GUI(syns);
    document.body.appendChild(gui);
    const play = document.createElement('button');
    play.textContent = 'play/pause';
    play.addEventListener('click', start);
    document.body.appendChild(play);
    console.log("buton l45")
    btn.remove();
  });

  document.body.appendChild(btn); 
}


/** Modify object properties in place. */
export function assign(target, fields = {}) {
  for (let k in fields)
    target[k] = fields[k];
}
