module.exports = [
  {
    type: 'heading',
    defaultValue: 'Mini METAR Settings'
  },
  {
    type: 'text',
    defaultValue:
      'Choose the airport and display preferences for the watch app.'
  },
  {
    type: 'input',
    messageKey: 'Airport',
    label: 'Airport',
    defaultValue: 'KCXO',
    attributes: {
      placeholder: 'KCXO',
      maxlength: 4
    }
  },
  {
    type: 'toggle',
    messageKey: 'UseCelsius',
    label: 'Use Celsius',
    defaultValue: false
  },
  {
    type: 'toggle',
    messageKey: 'UseHpa',
    label: 'Use hPa',
    defaultValue: false
  },
  {
    type: 'select',
    messageKey: 'RefreshMinutes',
    label: 'Refresh interval',
    defaultValue: '5',
    options: [
      {
        label: '5 minutes',
        value: '5'
      },
      {
        label: '10 minutes',
        value: '10'
      },
      {
        label: '15 minutes',
        value: '15'
      }
    ]
  },
  {
    type: 'submit',
    defaultValue: 'Save Settings'
  }
];