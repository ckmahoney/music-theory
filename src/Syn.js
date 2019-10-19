
const presets = [
    { name: 'Synth',
      volume: 6
    },
    { name: 'MonoSynth',
      volume: -18 
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

export function createSyn(voice = 0) {
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
export function createPart(synth, pitches) {
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