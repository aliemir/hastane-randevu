const state = {
  recognition: null,
  recognitionActive: 0,
  synth: null,
  utterMessage: null,
  settings: {
    volume: 1,
    readability: 0,
    night: 0
  },
  location: {
    longitude: 0,
    latitude: 0,
    name: ''
  },
  name: 'a'
};

const elements = {
  locationAddr: document.querySelector('#locationAddr'),
  volumeBtn: document.querySelector('#volumeBtn'),
  locationBtn: document.querySelector('#locationBtn'),
  microphoneBtn: document.querySelector('#microphoneBtn'),
  readabilityBtn: document.querySelector('#readabilityBtn'),
  nightModeBtn: document.querySelector('#nightModeBtn'),
  messages: document.querySelector('.messages'),
  userSpeechInput: document.querySelector('.userspeech'),
  nightElements: [
    document.querySelector('.header'),
    document.querySelector('.assistant'),
    ...document.querySelectorAll('.message'),
    document.querySelector('.userspeech'),
    document.querySelectorAll('.button')
  ]
};

const initializeSpeechSynthesis = () => {
  state.synth = window.speechSynthesis;
};

const synthMessage = message => {
  const voices = state.synth.getVoices();
  state.utterMessage = new SpeechSynthesisUtterance(message);
  state.utterMessage.voice = state.synth
    .getVoices()
    .find(v => v.lang == 'tr-TR');
  state.utterMessage.pitch = 1.1;
  state.utterMessage.rate = 1.0;
  state.synth.speak(state.utterMessage);
};

const initializeSpeechRecognition = () => {
  if (!('webkitSpeechRecognition' in window)) {
    console.log('Speech Recognition is not supported.');
    elements.microphoneBtn.onclick = () => {
      alert('Ses tanima ozelligi cihazinizda desteklenmemektedir.');
    };
  } else {
    state.recognition = new webkitSpeechRecognition(); //That is the object that will manage our whole recognition process.
    state.recognition.continuous = false; //Suitable for dictation.
    state.recognition.interimResults = true; //If we want to start receiving results even if they are not final.
    //Define some more additional parameters for the recognition:
    state.recognition.lang = 'tr-TR';
    state.recognition.onstart = handleRecognitionStart;
    state.recognition.maxAlternatives = 1; //Since from our experience, the highest result is really the best...
    state.recognition.onend = handleRecognitionEnd;
    state.recognition.onresult = handleRecognitionResults;
  }
};

const processUserMessage = message => {
  if (state.settings.volume) {
    synthMessage(message);
  }
  createMessage('incoming', message);
};

const handleRecognitionStart = () => {
  toggleInterimClass();
};

const handleRecognitionEnd = () => {
  toggleInterimClass();
  handleSendMessage();
};

const toggleInterimClass = () => {
  if (elements.userSpeechInput.classList.contains('interim')) {
    elements.userSpeechInput.classList.remove('interim');
  } else {
    elements.userSpeechInput.classList.add('interim');
  }
};

const handleRecognitionResults = function(event) {
  if (typeof event.results === 'undefined') {
    state.recognition.stop();
    return;
  }
  for (var i = event.resultIndex; i < event.results.length; ++i) {
    if (event.results[i].isFinal) {
      //Final results
      elements.userSpeechInput.value = event.results[i][0].transcript;
    } else {
      elements.userSpeechInput.value = event.results[i][0].transcript;
    }
  }
};

const handleLocation = () => {
  function locationSuccess(position) {
    async function getLocationName(longitude, latitude) {
      let response = await fetch(
        'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' +
          latitude.toFixed(3) +
          '&lon=' +
          longitude.toFixed(3)
      );
      let data = (await response.json()).display_name.split(', ');
      let name = data[0] + ', ' + data[1];
      return name;
    }
    state.location.longitude = position.coords.longitude;
    state.location.latitude = position.coords.latitude;
    getLocationName(state.location.longitude, state.location.latitude)
      .then(name => {
        state.location.name = name;
      })
      .then(() => {
        elements.locationAddr.innerHTML = state.location.name;
      });
  }
  function locationError() {
    elements.locationAddr.innerHTML = 'Lutfen tekrar deneyin.';
    console.log('Something happened when retrieving location data.');
  }

  if (!navigator.geolocation) {
    console.log('geolocation is not supported.');
  } else {
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
  }
};

const handleVolume = () => {
  const status = elements.volumeBtn.firstElementChild.classList.contains(
    'fa-volume-up'
  );
  // 1 is volume-up 0 is volume-mute
  if (status) {
    elements.volumeBtn.firstElementChild.classList.remove('fa-volume-up');
    elements.volumeBtn.firstElementChild.classList.add('fa-volume-mute');
    state.settings.volume = 0;
  } else {
    elements.volumeBtn.firstElementChild.classList.remove('fa-volume-mute');
    elements.volumeBtn.firstElementChild.classList.add('fa-volume-up');
    state.settings.volume = 1;
  }
};

const handleMicrophone = () => {
  if (state.recognitionActive == 0) {
    state.recognition.start();
  } else {
    state.recognition.stop();
  }
};

const handleReadability = () => {
  if (state.settings.readability) {
    state.settings.readability = 0;
    elements.messages.classList.remove('readability');
  } else {
    state.settings.readability = 1;
    elements.messages.classList.add('readability');
  }
};

const handleNightMode = () => {
  if (state.settings.night) {
    state.settings.night = 0;
    elements.nightElements.forEach(el => {
      el.classList.remove('night');
    });
  } else {
    state.settings.night = 1;
    elements.nightElements.forEach(el => {
      el.classList.add('night');
    });
  }
};

const handleSendMessage = () => {
  const msg = elements.userSpeechInput.value;
  elements.userSpeechInput.value = '';
  createMessage('outgoing', msg);
  processUserMessage(msg);

  //check this again
  elements.nightElements = [
    document.querySelector('.header'),
    document.querySelector('.assistant'),
    ...document.querySelectorAll('.message'),
    document.querySelector('.userspeech'),
    document.querySelectorAll('.button')
  ];
};

const createMessage = (type, msg) => {
  //type = 'incoming' || 'outgoing'
  //typeof(message) = string
  if ((type == 'incoming' || type == 'outgoing') && typeof msg == 'string') {
    const message = document.createElement('li');
    message.classList.add('message', type);
    message.innerHTML = msg;
    elements.messages.appendChild(message);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }
};

window.onclick = function(e) {
  console.log(e.target);
};

window.onload = () => {
  initializeSpeechRecognition();
  initializeSpeechSynthesis();
};
