import Tone from 'tone';
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
  return Panel([...ranges, lowCutoffRange, highCutoffRange], syn.displayName + ' EQ');
}

/** Display a panel of related controls. */
export function Panel(children, displayName = '') {
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
export function Range(values, onInput) {
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

/** Display visual controls to control a synthesizer. */
export function createGUI(synths) {
  const children = synths.map(ControlPanel);
  synths.forEach(s => {window[s.name] = s}); // for development

  return Panel(children);
}

/** Display a set of controls for a target Synthesizer. */
export function ControlPanel(syn) {
  syn.panels = [
    VolumeFader(syn),
    EQPanel(syn)
  ];

  return Panel(syn.panels, syn.displayName);
}

/** Display a fader for the synthesizer's volume. */
export function VolumeFader(syn) {
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