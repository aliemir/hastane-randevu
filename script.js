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
      name: 'yunus emre',
      location: {
        longitude: 10,
        latitude: 10
      },
      earliestDateAvailable: ''
    },
    {
      name: 'sehir hastanesi',
      location: {
        longitude: 3,
        latitude: 3
      },
      earliestDateAvailable: ''
    },
    {
      name: 'izmir devlet hastanesi',
      location: {
        longitude: 0,
        latitude: 0
      },
      earliestDateAvailable: ''
    }
  ],
  symp2clinic: [
    {
      id: 101,
      alias: 'baş ağrısı',
      bodyPart: ['baş'],
      complaint: ['ağrıyor', 'ağrı'],
      clinics: ['kbb', 'noroloji', 'dahiliye']
    },
    {
      id: 102,
      alias: 'mide bulantısı',
      bodyPart: ['mide', 'mi'],
      complaint: ['bulan', 'bula', 'bulantı', 'bulanmak'],
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
  startBtn: document.querySelector('#startBtn'),
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
    mfi = 'Aile Hekimligi';
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
      `Simdilik algilayabildigim sikayet sayisi : ${
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
    return true;
  }
  createMessage('outgoing', msg, elements.messages);
  state.userMessageCallbackFunction(msg);
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
          ['evet', 'onaylıyorum', 'onay', 'doğru', 'aynen'].includes(el)
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
      `Adınız ve soyadınız, ${message}. Onaylıyor musunuz ?`,
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
      `TC Kimlik numaranız, ${id
        .toString()
        .match(/.{3}|.{1,2}/g)
        .join(' ')}. Onaylıyor musunuz ?`,
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
      'Uzgunum. Şikâyetinizi algilayamadim. Başka bir şikâyetiniz var mı ?',
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
      'Konumunuz bilinmiyor. Lutfen <i class="fas fa-map-marker-alt"></i> lokasyon butonuna tiklayin. Konumunuz belirlenince herhangi bir mesaj yazarak devam edebilirsiniz.',
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
      `Size en yakin hastane <strong>${nearest.name}</strong>... <strong>${
        state.user.clinic
      }</strong> poliklinigi icin en yakin randevu tarihi: <strong>${earliestDate}</strong>. Randevuyu onayliyor musunuz ?`,
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
    'Randevu kaydedildi! Lutfen randevu saatinden 15 dakika once hastanede olunuz. Gecmis olsun!',
    () => {
      createMessage(
        'incoming',
        'Tekrar baslamak icin sayfayi yenileyin...',
        elements.messages
      );
    }
  );
};
const rejectAppointment = message => {
  getInfo('Uzgunum, size yardimci olamiyorum. Gorusme sonlandirildi', () => {
    createMessage(
      'incoming',
      'Tekrar baslamak icin sayfayi yenileyin...',
      'elements.messages'
    );
  });
};

const suggestionPhase = () => {
  state.user.clinic = getWeightedClinicSuggestion();
  if (state.user.clinic == 'Aile Hekimligi' || state.user.clinic == undefined) {
    getInfo(
      'Uygun poliklinik bulunamadi. Lutfen aile hekiminize basvurun.',
      () => {
        createMessage(
          'incoming',
          'Tekrar baslamak icin sayfayi yenileyin...',
          elements.messages
        );
      }
    );
    return false;
  }
  createMessage(
    'incoming',
    `Size onerilen poliklinik, <strong> ${state.user.clinic ||
      'bulunamadi'} </strong>`,
    elements.messages
  );
  createMessage(
    'incoming',
    'En yakin hastaneden randevu almak ister misiniz?',
    elements.messages
  );
  state.userMessageCallbackFunction = getApprove(
    () => {
      appointmentPhase();
    },
    () => {
      getInfo('Gorusme sonlandirildi.', () => {
        createMessage(
          'incoming',
          'Tekrar baslamak icin sayfayi yenileyin...',
          elements.messages
        );
      });
    }
  );
};

const appointmentPhase = () => {
  if (state.location.longitude == 0) {
    getInfo(
      'Konumunuz bilinmiyor. Lutfen <i class="fas fa-map-marker-alt"></i> lokasyon butonuna tiklayin. Konumunuz belirlenince herhangi bir mesaj yazarak devam edebilirsiniz.',
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
