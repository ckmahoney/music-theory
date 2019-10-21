import Tone from 'tone';
import * as Notes from './Notes.js';

const dMinorScale = Notes.getPitchedScale(['d', 'minor'], 5);


function createArp() {
  const degrees = [3, 10, 3, 5, 3, 12, 3, 10, 2];
  const notes = Notes.degreeToPitches(degrees, ['d', 'minor'], 4);
  const pluck = new Tone.Synth();

  const filter = new Tone.AutoFilter(2);
  filter.start();
  filter.wet.value = 0.2;
  filter.wet.rampTo(.8, 30);

  const dist = new Tone.Distortion().toMaster();
  dist.wet.value = .05
  dist.wet.rampTo(.6, 60);

  const part = new Tone.Pattern(function(time, note){
    pluck.triggerAttackRelease(note, 0.55);
  }, notes);

  pluck.chain(filter, dist, Tone.Master);
  return [pluck, part];
}

function generatePart() {
  const melody1 = Notes.randomFromList(dMinorScale, 5);
  const melody2 = Notes.randomFromList(dMinorScale, 4);
 
  const playback = new Tone.Part()

  function first(time, note) {
    const part = this;
    this.loop = 2;

  }

  function second(time, note) {
    this.loop = 1;

  }

}

function createBassline() {
  const degrees = [0, 7];
  const notes = Notes.degreeToPitches(degrees, ['d', 'minor'], 1);
  const bass = new Tone.MonoSynth();
  const aeg = new Tone.AmplitudeEnvelope({
    "attack": 0.1,
    "decay": 0.2,
    "sustain": 1.0,
    "release": 0.8
  })

  const filter = new Tone.Filter(400, 'lowpass', -48);

  bass.volume.value = -18;

  const feg = new Tone.FrequencyEnvelope("0:0:1", "0:0:1", .2, 0);
  feg.baseFrequency = bass.filter.frequency.value  * 3;

  const events = notes.map((n, i) => ["0:" + i * 2, n]);

  const part = new Tone.Part(function(time, note) {
    bass.triggerAttackRelease(note, "0:0:3"); 
  }, events);

  part.loop = true;
  aeg.toMaster();
  bass.chain(filter, Tone.Master);
  // bass.chain(aeg, Tone.Master)

  return [bass, part];
}

function createKick() {
  const kick = new Tone.Synth({
    envelope: {
      attack: 0,
      decay: "0:0:3",
      sustain: 0.3,
      release: "0:0:1"
    }
  });

  kick.volume.value = 12;

  const part = new Tone.Loop(function(time) {
    console.log("kick");
    kick.triggerAttackRelease("D2", "0:0:2");
  }, "4n");

  kick.chain(Tone.Master)


  return [kick, part];
}

function createHat() {
  const hat = new Tone.Synth();
  const filter = new Tone.AutoFilter(200, 6700,1);


  filter.filter = Object.assign({}, filter.filter, {
    frequency: 2, 
    type : 'highpass' ,
    rolloff : -96 ,
    Q : 100
  })

  filter.octave = 2.5;
  filter.baseFrequency = 4800;
  filter.start();

  const autoFilter = new Tone.AutoFilter("8n").toMaster().start();
  const reverb = new Tone.Reverb();
  reverb.generate();

  hat.chain(filter, reverb, Tone.Master);

  const part = new Tone.Loop(function(time, note) {
    console.log("hat");
    hat.triggerAttackRelease("A5", "0:0:2");
  }, "3n");




  return [hat, part];
}

// quickfix for stopping on stop. 
let pad;

function playTechnoMusic(freq) {
  Tone.Transport.bpm.value = 132;
  Tone.Transport.start();
  let phrase = 0;
  const events = [];
  for (let i = 0; i < 64 * 4; i++) 
    events.push(i);

  const play = (synth, note, dur, t, vel) => 
    synth.triggerAttackRelease(note, dur, t, vel);

  const kickCompressor = new Tone.Compressor({threshold: -36, ratio: 15});
  const kick = new Tone.MetalSynth({
    frequency : 1,
    envelope : {
      attack : 0.001,
      decay : 0.2,
      release : 0.2
    },
    harmonicity : 1.04 ,
    modulationIndex : 3,
    resonance : 80,
    octaves : 4
  }).chain(kickCompressor, Tone.Master);

  const hh = new Tone.MetalSynth({
    frequency : 600 ,
    envelope : {
      attack : 0.005 ,
      decay : 0.02,
      sustain : 0
    },
    harmonicity : 5.1 ,
    modulationIndex : 32 ,
    resonance : 4000 ,
    octaves : 1.5
  });

  const snare = new Tone.NoiseSynth({
    noise : {
      type : 'white'
    },
    envelope : {
      attack : 0.005 ,
      decay : 0.2,
      sustain : 0
    }
  }).toMaster();

  const tomCompressor = new Tone.Compressor({threshold: -24, ratio: 2.4});
  const tom = new Tone.MembraneSynth({
    pitchDecay : 0.1,
    octaves : 10 ,
    oscillator : {
      type : 'sine'
    },
    envelope : {
      attack : 0.001 ,
      decay : 0.4 ,
      sustain : 0.01 ,
      release : 1.4 ,
      attackCurve : 'exponential'
    }
  }).chain(tomCompressor, Tone.Master);

  const padFilter = new Tone.AutoFilter({
    frequency : 0.06 ,
    type : 'sine' ,
    depth : 1,
    baseFrequency : 1200 ,
    octaves : 3.6 ,
    filter : {
      type : 'highpass' ,
      rolloff : -24 ,
      Q : 4
    }
  });

  const clapDist = new Tone.Chebyshev({order: 3, oversample: '4x'});
  clapDist.wet.value = .1;
  clapDist.wet.rampTo(.4, 80);
  const clap = new Tone.NoiseSynth({
    frequency : 200,
    envelope: {
      attack: 0,
      decay: 0.09,
      sustain: 0.9,
      release: 0.001
    },
    harmonicity : 2 ,
    modulationIndex : 32 ,
    resonance : 600 ,
    octaves : 2.5
  }).chain(clapDist, Tone.Master);
  clap.volume.value = -18;

  const padVerb = new Tone.Freeverb({roomSize: 0.95, dampening: 12000});

  padFilter.start();
  padFilter.wet.value = 0.3;
  padFilter.wet.rampTo(1, 13);

  pad = new Tone.PolySynth(6, Tone.Synth, {
    envelope: {
      attack: 5
    },
    oscillator : {
      type : "square"
    }
  }).chain(padFilter, padVerb, Tone.Master);

  pad.volume.value = -12;
  pad.set("detune", -1200);
  pad.triggerAttack(["F6", "A6", "D6"], '1m', .1);

  const leadDelay = new Tone.FeedbackDelay({delayTime: "4n", feedback: 0.65}); 
  const lead = new Tone.FMSynth({
    harmonicity : 5,
    modulationIndex : 1/8,
    detune : 30,
    oscillator : {
      type : 'sine'
    },
    envelope : {
      attack : 0,
      decay : '16n',
      sustain : 0.2,
      release : 0.5
    },
    modulation : {
      type : 'square'
    },
    modulationEnvelope : {
      attack : 0.1 ,
      decay : 0 ,
      sustain : 1 ,
      release : 0.5
    }
  }).chain(leadDelay, Tone.Master);

  const leadDegrees = [
    [0, 3, 2, null],
    [5, 3, -5],
    [0, 5, 2],
    [2, 3, 7]
  ];

  const leadNotes = leadDegrees.map((phrase) => 
    Notes.degreeToPitches(phrase, ['d', 'minor'], 5));

  const bar = (tick) => tick % 16;
  const beat = (tick) => tick % 4;

  new Tone.Sequence(function(time, tick) {
    if (phrase == 1) {
      hh.toMaster();
    }

    if (tick === 0) {
      console.log("Phrase: ", phrase)
      let seq = new Tone.Sequence(function (t, note) {
        console.log("playing note ", note);
        play(lead, note, '8n.', '+6n');
      }, leadNotes[phrase], '4m');

      seq.loop = false;
      seq.start();

      // make the lead sound cooler as the song progresses.
      lead.detune.value = phrase * 15;
    }

    if ((tick + 4) % 8 === 0) {
      play(clap, '8n');
    }

    if (tick === 64 * 4 - 1) {
      phrase++;
    }

    if (tick % 4 === 2) {
      play(hh, '16n');
    }

    if (beat(tick) === 0) {
      play(kick, '8n');
      phrase > 0 && play(tom, 'A1', '8n.');
    }

    if ([10, 14, 30, 31].includes(tick)) {
      let velMod = tick / 100;
      play(snare, '8n', time, .5 + velMod);
    }
  }, events, '16n').start('+0.2');
} 

const technoButton = document.createElement('button');
technoButton.id = 'play-techno-music';
technoButton.textContent = 'Play Javascript Music';
document.body.appendChild(technoButton);

function startButton() {
  playTechnoMusic();
  technoButton.textContent = 'Stop';
  technoButton.removeEventListener('click', startButton);
  technoButton.addEventListener('click', stopButton);
}

function stopButton() {
  pad.volume.value = -Infinity;
  Tone.Transport.stop();
  technoButton.textContent = 'Play Javascript Music '
  technoButton.removeEventListener('click', stopButton);
  technoButton.addEventListener('click', startButton);
}

technoButton.addEventListener('click', startButton);