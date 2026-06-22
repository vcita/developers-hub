// Authentication — API token (business-level staff/app token). Static.
const { BASE_URL } = require('./constants');

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'api_token',
      label: 'inTandem API Token',
      type: 'string',
      required: true,
      helpText:
        'A business-level (staff/app) inTandem API token, sent as a Bearer token on every request. ' +
        'See [the inTandem API authentication docs](https://developers.intandem.tech/docs/authentication) for how to obtain one.',
    },
  ],
  // Validates the token against a cheap business-scoped endpoint.
  test: {
    url: `${BASE_URL}/platform/v1/webhooks`,
    method: 'GET',
  },
  connectionLabel: 'inTandem ({{bundle.authData.api_token}})',
};
