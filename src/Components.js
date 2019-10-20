import Tone from 'tone';
import * as Notes from './Notes.js';
import * as Syn from './Syn.js';

/** Display visual controls to control a synthesizer. */
export function GUI(synths) {
  synths.forEach(s => {window[s.name] = s}); // for development

  const controlPanels = synths.map((synth) => {
    const noteMeta = {
      octave: synth.part.octave || 4,
      duration: synth.duration || "16n"
    };
    return ControlPanel(synth, noteMeta)
  });

  const gui = Panel(controlPanels);
  gui.className = 'gui';
  return gui;
}

/** Display a set of controls for a target Synthesizer. */
export function ControlPanel(syn, noteMeta) {
  const { part } = syn;
  const { octave, duration } = noteMeta;

  const panels = [
    PatternInput(part, part.pattern),
    OctavePanel(part),
    PlaybackPanel(part),
    DurationPanel(syn),
    VolumeFader(syn),
    EQPanel(syn)
  ];

  const controlPanel = Panel(panels, syn.displayName);
  controlPanel.classList.add('control-panel');
  return controlPanel;
}

/** Display an input for controlling the notes of a Part. */
export function PatternInput(part, defaultPattern = []) {
  const input = document.createElement('input');
  input.value = defaultPattern.length && defaultPattern.toString() || Notes.scales.major.toString();
  input.addEventListener('input', (e) => {
    Syn.updatePart(part, Notes.parseInput(e.target.value));
  });

  part.input = input;
  return input;
}

/** Display a panel for two octave buttons and metadata. */
export function OctavePanel(part) {
  const octMod = document.createElement('p');
  octMod.textContent = part.octave;

  function update(event) {
    octMod.textContent = part.octave;
  }
  const label = document.createElement('label');
  label.textContent = 'octave';
  const octUp = OctaveButton(part, '+', update);
  const octDown = OctaveButton(part, '-', update);
  const panel = Panel([label, octDown, octMod,  octUp]);
  panel.classList.add('octave-control');
  return panel;
}

/** Display buttons to start and stop a synth's part. */
export function PlaybackPanel(part) {
  const stop = document.createElement('button');
  const play = document.createElement('button');
  stop.textContent = '||';
  play.textContent = '|>';
  stop.addEventListener('click', (event) => part.stop("@1n"));
  play.addEventListener('click', (event) => part.start("@1n"));
  const playbackPanel = Panel([stop, play], 'Playback');
  playbackPanel.classList.add('playback-control');
  return playbackPanel;
} 

function DurationPanel(part) {
  const display = document.createElement('span');
  display.classList.add('duration-display');
  display.textContent = part.duration;

  const augment = DurationButton(part, 'augment', (event) => {

    display.textContent = part.duration;
  });

  const diminish = DurationButton(part, 'diminish', (event) => {

    display.textContent = part.duration;
  });


  const panel = Panel([augment, diminish], 'Note Length');
  return panel;
}

/** Create an EQ3 for `syn`, connect it, and display a panel. */
export function EQPanel(syn) {
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
  const container = Panel([...ranges, lowCutoffRange, highCutoffRange], syn.displayName + ' EQ');
  container.classList.add('control-container');
  return container;
}

/** Display a fader to control synth volume. */
export function VolumeFader(syn) {
  const input = document.createElement('input');
  const volume = {
    name: 'Volume',
    min: -36,
    max: 24,
    value: syn.volume.value,
    step: 1
  }

  function onChange(event) {
    syn.volume.value = event.target.value;
  }

  return Range(volume, onChange);
}

/** Display a button to augment or diminish the part duration. */
function DurationButton(part, type = "2x", update) {
  const button = document.createElement('button');
  button.classList.add('duration-button');
  button.textContent = type;
  button.addEventListener('click', function changeOctave(event) {
    if (type == '2x') {
      let timePieces = Notes.timestampToList(part.duration);
      part.update(part.pattern, part.octave + 1)
    }
    else {
      part.update(part.pattern, part.octave - 1);
    }

    update();
  });

  return button;
}

/** Display a button to transpose a set of pitches by octave. */
function OctaveButton(part, type = '+', update) {
  const button = document.createElement('button');
  button.classList.add('octave-button');
  button.textContent = type;
  button.addEventListener('click', function changeOctave(event) {
    if (type == '+')
      part.update(part.pattern, part.octave + 1)
    else 
      part.update(part.pattern, part.octave - 1);

    update();
  });

  return button;
}

/** Display a panel of related controls. */
function Panel(children, displayName = '') {
  const panel = document.createElement('div');
  panel.className = 'panel';

  if (displayName) {
    const label = document.createElement('h2');
    label.classList.add('controls-label');
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
  group.classList.add('control-group');
  return group;
}