// Request/response middleware. Static — not regenerated.

// Inject the business token as a Bearer header on every outbound request.
const includeBearerToken = (request, z, bundle) => {
  if (bundle.authData && bundle.authData.api_token) {
    request.headers = request.headers || {};
    request.headers.Authorization = `Bearer ${bundle.authData.api_token}`;
  }
  return request;
};

// Surface API errors as readable Zapier errors instead of silent failures.
const checkForErrors = (response, z) => {
  if (response.status >= 400) {
    throw new z.errors.Error(
      `inTandem API ${response.status}: ${response.content}`,
      'APIError',
      response.status
    );
  }
  return response;
};

module.exports = { includeBearerToken, checkForErrors };
