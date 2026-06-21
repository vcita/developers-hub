// Authentication — API token (business-level staff/app token). Static.
const { BASE_URL } = require('./constants');

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'api_token',
      label: 'vcita API Token',
      type: 'string',
      required: true,
      helpText:
        'A business-level (staff/app) vcita API token. Sent as a Bearer token on every request.',
    },
  ],
  // Validates the token against a cheap business-scoped endpoint.
  test: {
    url: `${BASE_URL}/platform/v1/webhooks`,
    method: 'GET',
  },
  connectionLabel: 'vcita ({{bundle.authData.api_token}})',
};
