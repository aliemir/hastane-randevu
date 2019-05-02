const state = {
  recognition: null,
  recognitionActive: 0,
  synth: null,
  utterMessage: null,
  stemmer: new Snowball('Turkish'),
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
  userMessageCallbackFunction: () => {
    return;
  }
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
      name: 'Eskişehir Yunus Emre Devlet Hastanesi',
      location: {
        longitude: 39.7726,
        latitude: 30.5098
      },
      earliestDateAvailable: ''
    },
    {
      name: 'Eskişehir Şehir Hastanesi',
      location: {
        longitude: 39.7477,
        latitude: 30.5952
      },
      earliestDateAvailable: ''
    },
    {
      name: 'Osmangazi Üniversitesi Hastanesi',
      location: {
        longitude: 39.7516,
        latitude: 30.4884
      },
      earliestDateAvailable: ''
    },
    {
      name: 'İzmir Urla Devlet Hastanesi',
      location: {
        longitude: 38.3305,
        latitude: 26.7455
      },
      earliestDateAvailable: ''
    }
  ],
  symp2clinic: [
    {
      id: 101,
      alias: 'Baş Ağrısı',
      bodyPart: ['baş'],
      complaint: ['ağrıyor', 'ağrı', 'ağrıs'],
      clinics: ['Nöroloji', 'Beyin Cerrahisi', 'Göz']
    },
    {
      id: 102,
      alias: 'Mide Bulantısı',
      bodyPart: ['mide', 'mi'],
      complaint: ['bulan', 'bula', 'bulantı', 'bulanmak', 'bulanıyor'],
      clinics: ['Dahiliye', 'Gastroentereloji']
    },
    {
      id: 103,
      alias: 'Karın Ağrısı',
      bodyPart: ['karın', 'karn', 'karnı', 'karını'],
      complaint: ['ağrıyor', 'ağrı', 'ağrıs'],
      clinics: ['Dahiliye', 'Genel Cerrahi', 'Kadın Hastalıkları']
    },
    {
      id: 104,
      alias: 'Kulak Çınlaması',
      bodyPart: ['kulak'],
      complaint: ['çınlama', 'çınla', 'çınlamas', 'çınlıyor'],
      clinics: ['K.B.B.', 'Nöroloji']
    },
    {
      id: 105,
      alias: 'Göğüs Ağrısı',
      bodyPart: ['göğüs', 'göğs'],
      complaint: ['ağrıyor', 'ağrı', 'ağrıs'],
      clinics: ['Göğüs Hastalıkları', 'Kardiyoloji', 'Dahiliye']
    },
    {
      id: 106,
      alias: 'Bel Ağrısı',
      bodyPart: ['bel'],
      complaint: ['ağrıyor', 'ağrı', 'ağrıs'],
      clinics: ['Fizik Tedavi', 'Ortopedi', 'Beyin Cerrahisi']
    },
    {
      id: 107,
      alias: 'Sırt Ağrısı',
      bodyPart: ['sırt', 'sır'],
      complaint: ['ağrıyor', 'ağrı', 'ağrıs'],
      clinics: ['Fizik Tedavi', 'Ortopedi', 'Beyin Cerrahisi']
    },
    {
      id: 115,
      alias: 'Göz Kaşıntısı',
      bodyPart: ['göz'],
      complaint: ['kaş', 'kaşıntı', 'kaşınıyor'],
      clinics: ['Göz', 'Alerji']
    },
    {
      id: 108,
      alias: 'Kaşıntı',
      bodyPart: ['kaş', 'kaşıntı', 'kaşınıyor'],
      complaint: ['kaş', 'kaşıntı', 'kaşınıyor'],
      clinics: ['Dermatoloji', 'Dahiliye']
    },
    {
      id: 109,
      alias: 'Kızarıklık',
      bodyPart: ['kızarıklık', 'kızarık', 'kızar', 'kızartı'],
      complaint: ['kızarıklık', 'kızarık', 'kızar', 'kızartı'],
      clinics: ['Dermatoloji', 'Dahiliye']
    },
    {
      id: 110,
      alias: 'İshal / Kabız / Gaz',
      bodyPart: ['ishal', 'kabız', 'kap', 'gaz', 'kabızlık'],
      complaint: [
        'sıkışıyor',
        'sıkışma',
        'sıkışmas',
        'sıkış',
        'ishal',
        'kabız',
        'kap',
        'ol',
        'gaz'
      ],
      clinics: ['Dahiliye', 'Genel Cerrahi']
    },
    {
      id: 111,
      alias: 'Boğaz Ağrısı',
      bodyPart: ['boğaz'],
      complaint: ['ağrıyor', 'ağrı', 'ağrıs'],
      clinics: ['K.B.B.']
    },
    {
      id: 112,
      alias: 'Kusma',
      bodyPart: ['kus', 'kusuyor', 'kustum', 'kusma'],
      complaint: ['kus', 'kusuyor', 'kustum', 'kusma'],
      clinics: ['Dahiliye', 'Genel Cerrahi', 'Nöroloji', 'Beyin Cerrahisi']
    },
    {
      id: 113,
      alias: 'Ateş',
      bodyPart: ['ateş', 'ateşlen', 'ateşle', 'ateşlendim', 'ateşlenmek'],
      complaint: [
        'ateşleniyor',
        'ateşle',
        'ateşlendim',
        'yüksek',
        'yükselmek',
        'yük',
        'çok',
        'yüksel',
        'yükseliyor',
        'arttı'
      ],
      clinics: ['Enfeksiyon', 'Dahiliye', 'Nöroloji', 'Onkoloji']
    },
    {
      id: 114,
      alias: 'Burun Akıntısı / Tıkanıklığı',
      bodyPart: ['burun', 'burn', 'burnum'],
      complaint: [
        'ak',
        'akıntısı',
        'akıyor',
        'tıkal',
        'tıkanık',
        'tıkanıyor',
        'tıkan',
        'tıkanıklık'
      ],
      clinics: ['K.B.B.', 'Nöroloji', 'Dahiliye']
    },
    {
      id: 116,
      alias: 'Göz Ağrısı',
      bodyPart: ['göz'],
      complaint: ['ağrıyor', 'ağrı', 'ağrıs'],
      clinics: ['Göz', 'Nöroloji']
    },
    {
      id: 117,
      alias: 'Göz Batması / Yanması',
      bodyPart: ['göz'],
      complaint: ['bat', 'batıyor', 'batmas', 'yanıyor', 'yanma'],
      clinics: ['K.B.B.', 'Nöroloji', 'Dahiliye']
    },
    {
      id: 118,
      alias: 'Ayak Ağrısı',
      bodyPart: ['ayak'],
      complaint: ['ağrıyor', 'ağrı', 'ağrıs'],
      clinics: ['Ortopedi', 'Dahiliye']
    },
    {
      id: 119,
      alias: 'Tansiyon',
      bodyPart: ['tansiyon', 'tansiyo'],
      complaint: [
        'düşüyor',
        'düş',
        'yük',
        'yüksel',
        'çık',
        'çıkmış',
        'yükseliyor',
        'fırladı',
        'fırlıyor'
      ],
      clinics: ['Dahiliye', 'Kalp Cerrahisi']
    },
    {
      id: 120,
      alias: 'El Titremesi',
      bodyPart: ['el'],
      complaint: ['titriyor', 'titre', 'titremes'],
      clinics: ['Nöroloji', 'Dahiliye']
    },
    {
      id: 121,
      alias: 'Boyun / Bel Tutulması',
      bodyPart: ['boyun', 'boyn', 'boy', 'bel'],
      complaint: ['tutul', 'tutuluyor', 'tutuk'],
      clinics: ['Ortopedi', 'Fizik Tedavi']
    },
    {
      id: 122,
      alias: 'Kalp Sıkışması',
      bodyPart: ['kalp'],
      complaint: ['sıkışıyor', 'sıkış', 'sıkışma', 'sıkışmas'],
      clinics: ['Kardiyoloji', 'Dahiliye', 'Psikiyatri']
    },
    {
      id: 123,
      alias: 'Nefes Darlığı',
      bodyPart: ['nefes'],
      complaint: ['darlık', 'daralıyor', 'daral'],
      clinics: ['Göğüs Hastalığı', 'Kardiyoloji', 'Dahiliye']
    },
    {
      id: 124,
      alias: 'Öksürük',
      bodyPart: ['öksürmek', 'öksürük', 'öksürüyor'],
      complaint: ['öksürmek', 'öksürük', 'öksürüyor', 'var'],
      clinics: ['K.B.B.', 'Dahiliye']
    },
    {
      id: 125,
      alias: 'Halsizlik',
      bodyPart: ['halsiz', 'halsizlik'],
      complaint: ['halsiz', 'halsizlik', 'var'],
      clinics: ['Dahiliye', 'Nöroloji']
    },
    {
      id: 126,
      alias: 'Baş Dönmesi',
      bodyPart: ['baş'],
      complaint: ['dönüyor', 'dö', 'dönme', 'dönmes'],
      clinics: ['Nöroloji', 'K.B.B.', 'Kadın Hastalıkları']
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
  startBtn: document.querySelector('#startBtn'),
  addToHomeScreenBtn: document.querySelector('#addToHomeScreen'),
  addToHomeScreenPrompt: document.querySelector('#addToHomeScreenPrompt'),
  messages: document.querySelector('.messages'),
  userSpeechInput: document.querySelector('.userspeech'),
  nightElements: [
    document.querySelector('.startBtn'),
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

let deferredPrompt;

const resizeHeight = () => {
  document.querySelector('.assistant').style.height = `${window.innerHeight}px`;
};

window.addEventListener('beforeinstallprompt', e => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
});

const addToHomeScreenBtn = () => {
  elements.addToHomeScreenPrompt.style.display = 'block';
};

const acceptHomeButtonPrompt = () => {
  console.log('nice');
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choiceResult => {
    if (choiceResult.outcome === 'accepted') {
      console.log('accepted');
    } else {
      console.log('dismissed');
    }
  });
  cancelHomeButtonPrompt();
};

const cancelHomeButtonPrompt = () => {
  elements.addToHomeScreenPrompt.style.display = 'none';
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

const getWeightedClinicSuggestion = () => {
  let clinicsList = state.user.symptoms.map(s => {
    if (database.symp2clinic.filter(d => d.id === s)[0]) {
      return database.symp2clinic.filter(d => d.id === s)[0].clinics;
    }
  });
  clinicsList = [].concat(...clinicsList);
  let mf = 0;
  let mfi;
  let f = 0;
  clinicsList.forEach(x => {
    clinicsList.forEach(y => {
      if (x == y) {
        f++;
        if (mf < f) {
          mf = f;
          mfi = x;
        }
      }
    });
    f = 0;
  });
  if (mf < 2 && state.user.symptoms.length > 1) {
    mfi = 'Aile Hekimliği';
  }
  return mfi;
};

const stemMessage = message => {
  //Convert to lowercase, remove punctuation, remove emojis and split every word into array.
  let tokenize = message
    .toLowerCase()
    .replace(/[.,?&%@!]|/g, '')
    .replace(
      /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    )
    .split(' ');
  //map through every words in array and tokenize each of them with stemmer
  let tokenized = tokenize.map(t => {
    state.stemmer.setCurrent(t);
    state.stemmer.stem();
    return state.stemmer.getCurrent();
  });
  return tokenized;
};

const checkSymptomMatch = message => {
  const tokenArr = stemMessage(message);
  const symptoms = database.symp2clinic;
  const foundSymptomPlaces = symptoms.filter(el => {
    if (el.bodyPart.filter(part => tokenArr.includes(part)).length > 0) {
      return true;
    } else {
      return false;
    }
  });
  const foundMatchingComplaintsByPlace = foundSymptomPlaces.filter(el => {
    if (el.complaint.filter(comp => tokenArr.includes(comp)).length > 0) {
      return true;
    } else {
      return false;
    }
  });
  foundMatchingComplaintsByPlace.forEach(sym => {
    state.user.symptoms.push(sym.id);
  });
  if (foundMatchingComplaintsByPlace.length > 0) {
    return true;
  } else {
    return false;
  }
};

const synthMessage = message => {
  message = message
    .replace(
      /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    )
    .replace(/\<.*?\>/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(':', '  ');
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

const checkCode = message => {
  if (message.split(' ').includes('/semptomlar')) {
    const symptoms = database.symp2clinic.map(x => `<li>${x.alias}</li>`);
    createMessage(
      'incoming',
      `Şimdilik algılayabildiğim şikayet sayısı : ${
        symptoms.length
      }.</br><ul style="padding-left:20px;">${symptoms.join('')}</ul>`,
      elements.messages,
      0
    );
    return true;
  } else {
    return false;
  }
};

const handleSendMessage = () => {
  state.synth.cancel();
  const msg = elements.userSpeechInput.value;
  elements.userSpeechInput.value = '';
  if (checkCode(msg)) {
    return false;
  }
  createMessage('outgoing', msg, elements.messages);
  state.userMessageCallbackFunction(msg);
  return false;
};

const createMessage = (type, msg, messagelist, synthesize = 1) => {
  //type = 'incoming' || 'outgoing'
  //typeof(message) = string
  if ((type == 'incoming' || type == 'outgoing') && typeof msg == 'string') {
    if (type == 'incoming' && state.settings.volume && synthesize) {
      synthMessage(msg);
    }
    const message = document.createElement('li');
    message.classList.add('message', type);
    message.innerHTML = msg;
    messagelist.appendChild(message);
    messagelist.scrollTop = messagelist.scrollHeight;

    //Update Night Elements
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
  document.querySelector('.assistant').scroll = document.querySelector(
    '.assistant'
  ).scrollHeight;
  resizeHeight();
  initializeSpeechRecognition();
  initializeSpeechSynthesis();
};

/*
const gotInfo = (messageTemplate, middleware, nextFunc) => {
  return function(message) {
    createMessage('incoming', messageTemplate, elements.messages);
    middleware(message);
    state.userMessageCallbackFunction = nextFunc();
  };
}; */

const getInfo = (messageTemplate, callbackFunc) => {
  createMessage('incoming', messageTemplate, elements.messages);
  state.userMessageCallbackFunction = callbackFunc;
};

const getApprove = (nextFunc, rejectFunc) => {
  return function(message) {
    if (
      message
        .toLowerCase()
        .split(' ')
        .filter(el =>
          [
            'evet',
            'onaylıyorum',
            'onay',
            'doğru',
            'aynen',
            'doğrudur'
          ].includes(el)
        ).length > 0
    ) {
      nextFunc();
    } else {
      rejectFunc();
    }
  };
};

const gotName = message => {
  if (message.length < 5 || message.split(' ').length < 2) {
    createMessage(
      'incoming',
      'Adınız ve soyadınız hatalı görünüyor. 🧐',
      elements.messages
    );
    getInfo('Adınız ve soyadınız ?', gotName);
  } else {
    createMessage(
      'incoming',
      `Adınız ve soyadınız, <strong>${message}</strong>. Onaylıyor musunuz ?`,
      elements.messages
    );
    state.user.name = message;
    state.userMessageCallbackFunction = getApprove(
      () => {
        getInfo('TC Kimlik numaranız ?', gotID);
      },
      () => {
        getInfo('Adınız ve soyadınız ?', gotName);
      }
    );
  }
};

const gotID = message => {
  const id = parseFloat(message.replace(/\D/g, ''));
  if (!(id > 10000000000 && id < 100000000000)) {
    createMessage(
      'incoming',
      'TC Kimlik numaranız hatalı görünüyor. 🧐',
      elements.messages
    );
    getInfo('TC Kimlik numaranız ?', gotID);
  } else {
    createMessage(
      'incoming',
      `TC Kimlik numaranız, <strong>${id
        .toString()
        .match(/.{3}|.{1,2}/g)
        .join(' . ')}</strong> . Onaylıyor musunuz ?`,
      elements.messages
    );
    state.user.tc = id;
    state.userMessageCallbackFunction = getApprove(
      () => {
        createMessage(
          'incoming',
          'Bilgileriniz kaydedildi, teşekkürler.',
          elements.messages
        );
        diagnosePhase();
      },
      () => {
        getInfo('TC Kimlik numaranız ?', gotID);
      }
    );
  }
};

const gotSymptom = message => {
  if (checkSymptomMatch(message)) {
    createMessage(
      'incoming',
      'Şikâyetiniz kaydedildi. Başka bir şikâyetiniz var mı ?',
      elements.messages
    );
    state.userMessageCallbackFunction = getApprove(
      () => {
        getInfo('Şikâyetiniz nedir ?', gotSymptom);
      },
      () => {
        suggestionPhase();
      }
    );
  } else {
    //sikayetinizi algilayamadim, lutfen tekrar deneyin.
    createMessage(
      'incoming',
      'Üzgünüm. Şikâyetinizi algılayamadım. Başka bir şikâyetiniz var mı ?',
      elements.messages
    );
    state.userMessageCallbackFunction = getApprove(
      () => {
        getInfo('Şikâyetiniz nedir ?', gotSymptom);
      },
      () => {
        suggestionPhase();
      }
    );
  }
};

const gotAppointment = message => {
  if (state.location.longitude == 0) {
    getInfo(
      'Konumunuz bilinmiyor. Lütfen <i class="fas fa-map-marker-alt"></i> lokasyon butonuna tıklayın. Konumunuz belirlenince herhangi bir mesaj yazarak devam edebilirsiniz.',
      gotAppointment
    );
  } else {
    const nearest = findNearestHospital(state.location, database.hospitals);
    const d = new Date();
    let days = d.getDate();
    days = days + Math.floor(Math.random() * (30 - days));
    let month = d.getMonth();
    let hours = 9 + Math.floor(Math.random() * 8);
    hours = hours == 9 ? '0' + hours : hours;
    let minutes = Math.floor(Math.random() * 5);
    minutes = minutes == 0 ? '00' : minutes + '0';
    const aylar = [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık'
    ];
    const earliestDate =
      days + ' ' + aylar[month] + ', saat ' + hours + ':' + minutes;
    createMessage(
      'incoming',
      `Size en yakın hastane: <strong>${nearest.name}</strong>... <strong>${
        state.user.clinic
      }</strong> polikliniği icin en yakın randevu tarihi: <strong>${earliestDate}</strong>. Randevuyu onaylıyor musunuz ?`,
      elements.messages
    );
    state.userMessageCallbackFunction = getApprove(
      () => {
        acceptAppointment();
      },
      () => {
        rejectAppointment();
      }
    );
  }
};

const acceptAppointment = message => {
  getInfo(
    'Randevu kaydedildi! Lütfen randevu saatinden 15 dakika önce hastanede olunuz. Geçmiş olsun!',
    () => {
      createMessage(
        'incoming',
        'Tekrar başlamak için sayfayı yenileyin...',
        elements.messages
      );
    }
  );
};
const rejectAppointment = message => {
  getInfo('Üzgünüm, size yardımcı olamıyorum. Görüşme sonlandırıldı.', () => {
    createMessage(
      'incoming',
      'Tekrar başlamak için sayfayı yenileyin...',
      'elements.messages'
    );
  });
};

const suggestionPhase = () => {
  state.user.clinic = getWeightedClinicSuggestion();
  if (state.user.clinic == 'Aile Hekimliği' || state.user.clinic == undefined) {
    getInfo(
      'Uygun poliklinik bulunamadı. Lütfen aile hekiminize başvurun.',
      () => {
        createMessage(
          'incoming',
          'Tekrar başlamak için sayfayı yenileyin...',
          elements.messages
        );
      }
    );
    return false;
  }
  createMessage(
    'incoming',
    `Size önerilen poliklinik, <strong> ${state.user.clinic ||
      'bulunamadı'} </strong>`,
    elements.messages
  );
  createMessage(
    'incoming',
    'En yakın hastaneden randevu almak ister misiniz?',
    elements.messages
  );
  state.userMessageCallbackFunction = getApprove(
    () => {
      appointmentPhase();
    },
    () => {
      getInfo('Görüşme sonlandırıldı.', () => {
        createMessage(
          'incoming',
          'Tekrar başlamak için sayfayı yenileyin...',
          elements.messages
        );
      });
    }
  );
};

const appointmentPhase = () => {
  if (state.location.longitude == 0) {
    getInfo(
      'Konumunuz bilinmiyor. Lütfen <i class="fas fa-map-marker-alt"></i> lokasyon butonuna tıklayın. Konumunuz belirlenince herhangi bir mesaj yazarak devam edebilirsiniz.',
      gotAppointment
    );
  } else {
    state.userMessageCallbackFunction = gotAppointment;
    gotAppointment();
  }
};

const diagnosePhase = () => {
  getInfo(
    'Şikâyetlerinizi dinlemeye hazırım..  İlk şikâyetiniz nedir ?',
    gotSymptom
  );
};

const startConversation = () => {
  elements.startBtn.disabled = true;
  createMessage(
    'incoming',
    'Merhaba, randevu robotuna hoşgeldiniz! 🐣🐣',
    elements.messages
  );
  getInfo('Adınız ve Soyadınız ?', gotName);
};
