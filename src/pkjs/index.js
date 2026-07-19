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

function sendAppMessageWithRetry(message, description, attempt) {
  var retryAttempt = attempt || 0;

  Pebble.sendAppMessage(
    message,
    function() {
      console.log(description + ' sent to watch.');
    },
    function(error) {
      console.log(
        description + ' failed: ' + JSON.stringify(error)
      );

      if (retryAttempt < 3) {
        setTimeout(function() {
          sendAppMessageWithRetry(
            message,
            description,
            retryAttempt + 1
          );
        }, 400 * (retryAttempt + 1));
      }
    }
  );
}

function sendSelectedAirportToWatch(airport) {
  var message = {};
  message[messageKeys.Airport] = airport;

  sendAppMessageWithRetry(
    message,
    'Selected airport ' + airport,
    0
  );
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

  sendSelectedAirportToWatch(DEFAULT_AIRPORT);
  fetchMetar(DEFAULT_AIRPORT);
}

function getUseCelsius() {
  return localStorage.getItem('useCelsius') === '1';
}

function getUseHpa() {
  return localStorage.getItem('useHpa') === '1';
}

function sendWeatherToWatch(metar, requestedAirport) {
  var weather = {};

  // Always display the airport the user selected. Some API responses may
  // contain a stale or default airport value, which would otherwise replace
  // the new airport on the watch immediately after selection.
  weather[messageKeys.Airport] = requestedAirport;
  weather[messageKeys.Category] = metar.category || '---';
  weather[messageKeys.TemperatureC] =
    Number(metar.temperatureC) || 0;
  weather[messageKeys.PressureHpa] =
    Number(metar.pressureHpa) || 0;
  weather[messageKeys.WindDirection] =
    metar.windDirection === undefined ||
    metar.windDirection === null
      ? -1
      : Number(metar.windDirection);
  weather[messageKeys.WindSpeedKt] =
    Number(metar.windSpeedKt) || 0;
  weather[messageKeys.UpdatedAt] =
    Number(metar.updatedAt) ||
    Math.floor(Date.now() / 1000);
  weather[messageKeys.Offline] = 0;
  weather[messageKeys.UseCelsius] = getUseCelsius() ? 1 : 0;
  weather[messageKeys.UseHpa] = getUseHpa() ? 1 : 0;

  console.log(
    'Sending weather for selected airport ' + requestedAirport +
    '; API airport was ' + cleanAirport(metar.airport)
  );

  sendAppMessageWithRetry(
    weather,
    'Live METAR for ' + requestedAirport,
    0
  );
}

function sendOfflineStatus(airportCode) {
  var offlineMessage = {};

  offlineMessage[messageKeys.Offline] = 1;
  offlineMessage[messageKeys.Airport] =
    airportCode || DEFAULT_AIRPORT;
  offlineMessage[messageKeys.UseCelsius] =
    getUseCelsius() ? 1 : 0;
  offlineMessage[messageKeys.UseHpa] =
    getUseHpa() ? 1 : 0;

  sendAppMessageWithRetry(
    offlineMessage,
    'Offline status for ' + airportCode,
    0
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
  sendSelectedAirportToWatch(DEFAULT_AIRPORT);
  fetchMetar(DEFAULT_AIRPORT);
});