# Mini METAR for Pebble

A Pebble watch app that displays current METAR weather for a configurable airport.

The watch requests weather through PebbleKit JS, which calls a small Flask API and sends the result back to the watch using AppMessage.

## Features

- Displays the selected airport ICAO code
- Shows the current flight category: VFR, MVFR, IFR, or LIFR
- Color-coded flight category on color Pebble watches
- Displays temperature in Fahrenheit or Celsius
- Displays pressure in inHg or hPa
- Displays wind direction and speed in knots
- Shows how long ago the METAR was updated
- Supports manual and automatic weather refreshes
- Includes a web-based configuration page
- Responsive layout for rectangular and round Pebble displays

## Supported platforms

The project currently builds for:

- `basalt` — Pebble Time
- `gabbro` — Pebble Round 2
- `emery` — Pebble Time 2

## Architecture

```text
Pebble watch
    ⇅ AppMessage
PebbleKit JavaScript
    ⇅ HTTPS
Flask METAR API
    ⇅
AviationWeather.gov
```

The watch-side application is written in C. The phone-side integration is written in JavaScript using PebbleKit JS.

## Project structure

```text
src/c/mini-metar-pebble.c       Application entry point
src/c/app_message/              AppMessage communication
src/c/formatter/                Temperature, pressure, wind, and time formatting
src/c/weather/                  Weather state and display coordination
src/c/windows/                  Pebble user interface
src/pkjs/index.js               Phone-side METAR retrieval and settings
package.json                    App metadata, platforms, and message keys
wscript                         Pebble SDK build configuration
```

## Configuration

The configuration page allows the user to select:

- Airport ICAO identifier, such as `KCXO`
- Fahrenheit or Celsius
- inHg or hPa

The selected settings are saved through PebbleKit JS and sent to the watch with each weather update.

Configuration page:

<https://jasonmarquette.com/pebble/mini-metar-config.html>

## Building

Install and configure the Pebble SDK, then run:

```bash
pebble build
```

A successful build creates:

```text
build/mini-metar-pebble.pbw
```

## Running in an emulator

Pebble Time:

```bash
pebble install --emulator basalt
```

Pebble Round 2:

```bash
pebble install --emulator gabbro
```

Pebble Time 2:

```bash
pebble install --emulator emery
```

## Installing on a watch

With a compatible phone and Pebble development connection available:

```bash
pebble install --phone <phone-ip-address>
```

## Weather data

The app currently retrieves METAR data through:

```text
https://jasonmarquette.com/api/metar
```

Routine METAR observations are commonly issued approximately once per hour. A future improvement is to investigate and more clearly identify stale observations when the displayed METAR becomes unusually old.

## Development status

Working features include live METAR retrieval, configurable airport selection, unit preferences, category colors, responsive layouts, and support for Basalt, Gabbro, and Emery.

## Pebble SDK documentation

Pebble SDK documentation and resources are available at:

<https://developer.repebble.com>
