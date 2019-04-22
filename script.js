const state = {
  recognition: null,
  recognitionActive: 0,
  synth: null,
  utterMessage: null,
  settings: {
    speechSupported: 0,
    volume: 1,
    readability: 0,
    night: 0
  },
  user: {
    name: '',
    tc: 0,
    symptoms: [],
    clinic: '',
    hospital: null
  },
  location: {
    longitude: 0,
    latitude: 0,
    name: ''
  },
  conversationStatus: '',
  userMessageCallbackFunction: null
};
/* Convesation Status List
 * WELCOME - get name and citizen ID
 * DIAGNOSE - get desired number of symptoms and compare in background
 * APPOINTMENT - get nearest hospital with location
 * CLOSING - end conversation and ask for start over
 * HALT - end
 */

const database = {
  hospitals: [
    {
      name: 'yunus emre',
      location: {
        longitude: 0,
        latitude: 0
      }
    },
    {
      name: 'sehir hastanesi',
      location: {
        longitude: 0,
        latitude: 0
      }
    },
    {
      name: 'izmir devlet hastanesi',
      location: {
        longitude: 0,
        latitude: 0
      }
    }
  ],
  symp2clinic: [
    {
      words: ['bas', 'agriyor', 'agri'],
      clinics: ['kbb', 'noroloji', 'dahiliye']
    },
    {
      words: ['mide', 'bulan', 'bulanti'],
      clinics: ['dahiliye', 'baska bi yer']
    }
  ]
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

const findNearestHospital = (location, hospitals) => {
  return hospitals.sort((h1, h2) => {
    const h1Distance = Math.sqrt(
      Math.pow(location.longitude - h1.location.longitude, 2) +
        Math.pow(location.latitude - h1.location.latitude, 2)
    );
    const h2Distance = Math.sqrt(
      Math.pow(location.longitude - h2.location.longitude, 2) +
        Math.pow(location.latitude - h2.location.latitude, 2)
    );
    if (h1Distance > h2Distance) return 1;
    else if (h2Distance > h1Distance) return -1;
    else return 0;
  })[0];
};

const synthMessage = message => {
  message = message.replace(
    /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ''
  );
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
  createMessage('incoming', message, elements.messages);
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

const handleRecognitionResults = event => {
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
  createMessage('outgoing', msg, elements.messages);
  state.userMessageCallbackFunction(msg);
};

const createMessage = (type, msg, messagelist) => {
  //type = 'incoming' || 'outgoing'
  //typeof(message) = string
  if ((type == 'incoming' || type == 'outgoing') && typeof msg == 'string') {
    if (type == 'incoming' && state.settings.volume) {
      synthMessage(msg);
    }
    const message = document.createElement('li');
    message.classList.add('message', type);
    message.innerHTML = msg;
    messagelist.appendChild(message);
    messagelist.scrollTop = messagelist.scrollHeight;
    elements.nightElements = [
      document.querySelector('.startBtn'),
      document.querySelector('.header'),
      document.querySelector('.assistant'),
      ...document.querySelectorAll('.message'),
      document.querySelector('.userspeech'),
      document.querySelectorAll('.button')
    ];
  }
};

window.onload = () => {
  initializeSpeechRecognition();
  initializeSpeechSynthesis();
};

const getInfo = (messageTemplate, callbackFunc) => {
  createMessage('incoming', messageTemplate, elements.messages);
  state.userMessageCallbackFunction = callbackFunc;
};

/*
const gotInfo = (messageTemplate, middleware, nextFunc) => {
  return function(message) {
    createMessage('incoming', messageTemplate, elements.messages);
    middleware(message);
    state.userMessageCallbackFunction = nextFunc();
  };
}; */

const getApprove = (nextFunc, rejectFunc) => {
  return function(message) {
    if (
      ['evet', 'onaylıyorum', 'onay', 'doğru', 'aynen'].includes(
        message.toLowerCase()
      )
    ) {
      nextFunc();
    } else {
      rejectFunc();
    }
  };
};

const gotName = message => {
  createMessage(
    'incoming',
    `Adiniz, ${message}. Onayliyor musunuz ?`,
    elements.messages
  );
  state.user.name = message;
  state.userMessageCallbackFunction = getApprove(
    () => {
      getInfo('TC Kimlik numaraniz ?', gotID);
    },
    () => {
      getInfo('Adiniz ve soyadiniz ?', gotName);
    }
  );
};

const gotID = message => {
  const id = parseFloat(message.split(' ').join(''));
  if (!(id > 10000000000 && id < 100000000000)) {
    createMessage(
      'incoming',
      'TC kimlik numaraniz hatali gorunuyor. 🧐',
      elements.messages
    );
    getInfo('TC Kimlik numaraniz ?', gotID);
  } else {
    createMessage(
      'incoming',
      `TC Kimlik Numaraniz, ${id
        .toString()
        .match(/.{3}|.{1,2}/g)
        .join(' ')}. Onayliyor musunuz ?`,
      elements.messages
    );
    state.user.tc = id;
    state.userMessageCallbackFunction = getApprove(
      () => {
        getInfo('Belirtiler fazi', getSymptom);
      },
      () => {
        getInfo('TC Kimlik numaraniz ?', gotID);
      }
    );
  }
};

const getSymptom = () => {
  console.log(state.user.name);
  console.log(state.user.tc);
};

const welcomePhase = () => {
  createMessage(
    'incoming',
    'Merhaba randevu robotuna hoşgeldiniz! 🐣🐣',
    elements.messages
  );
  getInfo('Adiniz ve soyadiniz ?', gotName);
};
