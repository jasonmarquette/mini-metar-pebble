var DEFAULT_AIRPORT = 'KCXO';
var savedAirport = localStorage.getItem('airport');

if (savedAirport) {
  DEFAULT_AIRPORT = savedAirport;
}
var METAR_URL = 'https://jasonmarquette.com/api/metar';
var CONFIG_URL =
  'https://jasonmarquette.com/pebble/mini-metar-config.html';

function setAirport(airport) {
  DEFAULT_AIRPORT = String(airport)
    .trim()
    .toUpperCase();

  localStorage.setItem('airport', DEFAULT_AIRPORT);

  console.log('Airport set to ' + DEFAULT_AIRPORT);
}

function sendWeatherToWatch(metar) {
  var weather = {
    Airport: metar.airport || DEFAULT_AIRPORT,
    Category: metar.category || '---',
    TemperatureC: Number(metar.temperatureC) || 0,
    PressureHpa: Number(metar.pressureHpa) || 0,
    WindDirection:
      metar.windDirection === undefined
        ? -1
        : Number(metar.windDirection),
    WindSpeedKt: Number(metar.windSpeedKt) || 0,
    UpdatedAt:
  Number(metar.updatedAt) ||
  Math.floor(Date.now() / 1000),
Offline: 0,
UseCelsius:
  localStorage.getItem('useCelsius') === '1' ? 1 : 0,
UseHpa:
  localStorage.getItem('useHpa') === '1' ? 1 : 0
  };

  console.log(
    'Sending weather: ' + JSON.stringify(weather)
  );

  Pebble.sendAppMessage(
    weather,
    function() {
      console.log('Live METAR sent to watch.');
    },
    function(error) {
      console.log(
        'Could not send METAR: ' +
        JSON.stringify(error)
      );
    }
  );
}

function sendOfflineStatus() {
  Pebble.sendAppMessage(
    {
      Offline: 1
    },
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
  var airportCode = String(
    airport || DEFAULT_AIRPORT
  )
    .trim()
    .toUpperCase();

  var url =
    METAR_URL +
    '?airport=' +
    encodeURIComponent(airportCode);

  console.log('Requesting METAR for ' + airportCode);

  var request = new XMLHttpRequest();

  request.open('GET', url, true);
  request.timeout = 15000;

  request.onload = function() {
    console.log(
      'METAR HTTP status: ' + request.status
    );

    if (request.status === 204) {
      console.log(
        'No recent METAR found for ' + airportCode
      );

      sendOfflineStatus();
      return;
    }

    if (request.status < 200 || request.status >= 300) {
      console.log(
        'METAR request failed: ' + request.responseText
      );

      sendOfflineStatus();
      return;
    }

    var response;

    try {
      response = JSON.parse(request.responseText);
    } catch (error) {
      console.log(
        'Could not parse METAR JSON: ' + error.message
      );

      sendOfflineStatus();
      return;
    }

    if (!response || response.error) {
      console.log(
        'METAR response did not contain valid weather.'
      );

      sendOfflineStatus();
      return;
    }

    console.log(
      'METAR received: ' + JSON.stringify(response)
    );

    sendWeatherToWatch(response);
  };

  request.onerror = function() {
    console.log('METAR network request failed.');
    sendOfflineStatus();
  };

  request.ontimeout = function() {
    console.log('METAR request timed out.');
    sendOfflineStatus();
  };

  request.send();
}

Pebble.addEventListener('ready', function() {
  console.log('Mini METAR PebbleKit JS ready.');
  fetchMetar(DEFAULT_AIRPORT);
});

Pebble.addEventListener('appmessage', function(event) {
  var payload = event.payload || {};

  if (payload.RequestWeather) {
    console.log('Watch requested weather refresh.');
    fetchMetar(DEFAULT_AIRPORT);
  }
});
Pebble.addEventListener('webviewclosed', function(event) {

  if (!event.response) {
    return;
  }

  var settings;

  try {
    settings = JSON.parse(
      decodeURIComponent(event.response)
    );
  } catch (e) {
    console.log('Could not parse settings.');
    return;
  }

  if (settings.airport) {
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

  console.log(
    'Settings saved: ' +
    JSON.stringify(settings)
  );

  fetchMetar(DEFAULT_AIRPORT);
});
Pebble.addEventListener('showConfiguration', function() {
  console.log('Opening configuration page...');

  var url =
    CONFIG_URL +
    '?airport=' +
    encodeURIComponent(DEFAULT_AIRPORT) +
    '&useCelsius=' +
    (localStorage.getItem('useCelsius') || '0') +
    '&useHpa=' +
    (localStorage.getItem('useHpa') || '0');

  Pebble.openURL(url);
});
