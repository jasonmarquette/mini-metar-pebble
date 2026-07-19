var messageKeys = require('message_keys');

var DEFAULT_AIRPORT = 'KCXO';
var AIRPORTS = [];
var currentAirportIndex = 0;

var METAR_URL = 'https://jasonmarquette.com/api/metar';
var CONFIG_URL =
  'https://jasonmarquette.com/pebble/mini-metar-config.html';

function cleanAirport(airport) {
  return String(airport || '')
    .trim()
    .toUpperCase();
}

function parseAirportList(value) {
  var rawAirports;

  if (Array.isArray(value)) {
    rawAirports = value;
  } else {
    rawAirports = String(value || '').split(/[\s,;]+/);
  }

  var airports = [];

  rawAirports.forEach(function(airport) {
    var cleanedAirport = cleanAirport(airport);

    if (
      /^[A-Z0-9]{3,4}$/.test(cleanedAirport) &&
      airports.indexOf(cleanedAirport) === -1
    ) {
      airports.push(cleanedAirport);
    }
  });

  return airports;
}

function saveAirportList() {
  localStorage.setItem('airports', JSON.stringify(AIRPORTS));
  localStorage.setItem('airport', DEFAULT_AIRPORT);
}

function loadAirportList() {
  var savedList = localStorage.getItem('airports');
  var savedAirport = localStorage.getItem('airport');
  var parsedList = [];

  if (savedList) {
    try {
      parsedList = parseAirportList(JSON.parse(savedList));
    } catch (error) {
      parsedList = parseAirportList(savedList);
    }
  }

  if (!parsedList.length && savedAirport) {
    parsedList = parseAirportList(savedAirport);
  }

  if (!parsedList.length) {
    parsedList = ['KCXO'];
  }

  AIRPORTS = parsedList;

  var savedIndex = AIRPORTS.indexOf(cleanAirport(savedAirport));
  currentAirportIndex = savedIndex >= 0 ? savedIndex : 0;
  DEFAULT_AIRPORT = AIRPORTS[currentAirportIndex];

  saveAirportList();
}

function setAirportList(value, selectedAirport) {
  var airports = parseAirportList(value);

  if (!airports.length) {
    return;
  }

  AIRPORTS = airports;

  var selected = cleanAirport(selectedAirport);
  var selectedIndex = AIRPORTS.indexOf(selected);

  currentAirportIndex = selectedIndex >= 0 ? selectedIndex : 0;
  DEFAULT_AIRPORT = AIRPORTS[currentAirportIndex];
  saveAirportList();

  console.log('Airport list set to ' + AIRPORTS.join(', '));
  console.log('Active airport set to ' + DEFAULT_AIRPORT);
}

function setAirport(airport) {
  var cleanedAirport = cleanAirport(airport);

  if (!cleanedAirport) {
    return;
  }

  var existingIndex = AIRPORTS.indexOf(cleanedAirport);

  if (existingIndex === -1) {
    AIRPORTS.push(cleanedAirport);
    currentAirportIndex = AIRPORTS.length - 1;
  } else {
    currentAirportIndex = existingIndex;
  }

  DEFAULT_AIRPORT = cleanedAirport;
  saveAirportList();
}

function selectAirport(offset) {
  if (!AIRPORTS.length) {
    loadAirportList();
  }

  currentAirportIndex =
    (currentAirportIndex + offset + AIRPORTS.length) %
    AIRPORTS.length;

  DEFAULT_AIRPORT = AIRPORTS[currentAirportIndex];
  saveAirportList();

  console.log(
    'Selected airport ' + DEFAULT_AIRPORT +
    ' (' + (currentAirportIndex + 1) +
    ' of ' + AIRPORTS.length + ')'
  );

  fetchMetar(DEFAULT_AIRPORT);
}

function getUseCelsius() {
  return localStorage.getItem('useCelsius') === '1';
}

function getUseHpa() {
  return localStorage.getItem('useHpa') === '1';
}

function sendWeatherToWatch(metar, requestedAirport) {
  var weather = {
    Airport: cleanAirport(metar.airport) || requestedAirport,
    Category: metar.category || '---',
    TemperatureC: Number(metar.temperatureC) || 0,
    PressureHpa: Number(metar.pressureHpa) || 0,
    WindDirection:
      metar.windDirection === undefined ||
      metar.windDirection === null
        ? -1
        : Number(metar.windDirection),
    WindSpeedKt: Number(metar.windSpeedKt) || 0,
    UpdatedAt:
      Number(metar.updatedAt) ||
      Math.floor(Date.now() / 1000),
    Offline: 0,
    UseCelsius: getUseCelsius() ? 1 : 0,
    UseHpa: getUseHpa() ? 1 : 0
  };

  console.log('Sending weather: ' + JSON.stringify(weather));

  Pebble.sendAppMessage(
    weather,
    function() {
      console.log('Live METAR sent to watch.');
    },
    function(error) {
      console.log(
        'Could not send METAR: ' + JSON.stringify(error)
      );
    }
  );
}

function sendOfflineStatus(airportCode) {
  var offlineMessage = {
    Offline: 1,
    Airport: airportCode || DEFAULT_AIRPORT,
    UseCelsius: getUseCelsius() ? 1 : 0,
    UseHpa: getUseHpa() ? 1 : 0
  };

  Pebble.sendAppMessage(
    offlineMessage,
    function() {
      console.log('Offline status sent.');
    },
    function(error) {
      console.log(
        'Could not send offline status: ' +
        JSON.stringify(error)
      );
    }
  );
}

function fetchMetar(airport) {
  var airportCode = cleanAirport(airport || DEFAULT_AIRPORT);

  if (!airportCode) {
    airportCode = 'KCXO';
  }

  var url =
    METAR_URL +
    '?airport=' +
    encodeURIComponent(airportCode) +
    '&_=' +
    Date.now();

  console.log('Requesting METAR for ' + airportCode);
  console.log('METAR URL: ' + url);

  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.timeout = 15000;

  request.onload = function() {
    console.log('METAR HTTP status: ' + request.status);

    if (request.status === 204) {
      console.log('No recent METAR found for ' + airportCode);
      sendOfflineStatus(airportCode);
      return;
    }

    if (request.status < 200 || request.status >= 300) {
      console.log('METAR request failed: ' + request.responseText);
      sendOfflineStatus(airportCode);
      return;
    }

    var response;

    try {
      response = JSON.parse(request.responseText);
    } catch (error) {
      console.log('Could not parse METAR JSON: ' + error.message);
      sendOfflineStatus(airportCode);
      return;
    }

    if (!response || response.error) {
      console.log('METAR response did not contain valid weather.');
      sendOfflineStatus(airportCode);
      return;
    }

    console.log('METAR received: ' + JSON.stringify(response));
    sendWeatherToWatch(response, airportCode);
  };

  request.onerror = function() {
    console.log('METAR network request failed.');
    sendOfflineStatus(airportCode);
  };

  request.ontimeout = function() {
    console.log('METAR request timed out.');
    sendOfflineStatus(airportCode);
  };

  request.send();
}

function getPayloadValue(payload, keyName) {
  if (payload[keyName] !== undefined) {
    return Number(payload[keyName]);
  }

  var numericKey = messageKeys[keyName];

  if (
    numericKey !== undefined &&
    payload[numericKey] !== undefined
  ) {
    return Number(payload[numericKey]);
  }

  return 0;
}

loadAirportList();

Pebble.addEventListener('ready', function() {
  console.log('Mini METAR PebbleKit JS ready.');
  console.log('Current airport: ' + DEFAULT_AIRPORT);
  console.log('Saved airports: ' + AIRPORTS.join(', '));
  fetchMetar(DEFAULT_AIRPORT);
});

Pebble.addEventListener('appmessage', function(event) {
  var payload = event.payload || {};

  console.log(
    'Message received from watch: ' + JSON.stringify(payload)
  );

  var requestValue = getPayloadValue(payload, 'RequestWeather');

  console.log('RequestWeather value: ' + requestValue);

  if (requestValue === 2) {
    selectAirport(1);
    return;
  }

  if (requestValue === 3) {
    selectAirport(-1);
    return;
  }

  if (requestValue === 1) {
    fetchMetar(DEFAULT_AIRPORT);
  }
});

Pebble.addEventListener('showConfiguration', function() {
  console.log('Opening configuration page...');

  var url =
    CONFIG_URL +
    '?airport=' +
    encodeURIComponent(DEFAULT_AIRPORT) +
    '&airports=' +
    encodeURIComponent(AIRPORTS.join(',')) +
    '&useCelsius=' +
    (getUseCelsius() ? '1' : '0') +
    '&useHpa=' +
    (getUseHpa() ? '1' : '0');

  Pebble.openURL(url);
});

Pebble.addEventListener('webviewclosed', function(event) {
  console.log(
    'Configuration closed. Response: ' + event.response
  );

  if (!event.response) {
    return;
  }

  var settings;

  try {
    settings = JSON.parse(decodeURIComponent(event.response));
  } catch (error) {
    console.log('Could not parse settings: ' + error.message);
    return;
  }

  if (settings.airports) {
    setAirportList(settings.airports, settings.airport);
  } else if (settings.airport) {
    setAirport(settings.airport);
  }

  localStorage.setItem(
    'useCelsius',
    settings.useCelsius ? '1' : '0'
  );
  localStorage.setItem(
    'useHpa',
    settings.useHpa ? '1' : '0'
  );

  console.log('Settings saved: ' + JSON.stringify(settings));
  fetchMetar(DEFAULT_AIRPORT);
});
