---
endpoint: POST /oauth/token
domain: platform_administration
tags: [oauth, requires-manual-testing]
status: skip
skipReason: This endpoint implements OAuth 2.0 Authorization Code flow which requires user interaction. The authorization code can only be obtained through a browser-based user authorization flow (redirect to /oauth/authorize, user grants permission, redirect back with code). Automated API testing cannot complete this flow without user intervention or a pre-obtained authorization code.
savedAt: 2026-01-30T10:00:00.000Z
verifiedAt: 2026-01-30T10:00:00.000Z
timesReused: 0
---
# Exchange OAuth Authorization Code for Access Token

## Summary
This endpoint exchanges an OAuth Authorization Code for an Access Token. It implements the OAuth 2.0 Authorization Code flow and **cannot be tested in isolation** because obtaining an authorization code requires interactive user authorization through a browser.

**Important**: The `grant_type` MUST be `authorization_code`. This endpoint does NOT support `client_credentials` grant type.

## Prerequisites

### 1. Create an OAuth Application (one-time setup)
First, create an app using `POST /platform/v1/apps` with a **Directory token**:

```json
{
  "name": "My OAuth App",
  "app_code_name": "myoauthapp123",
  "redirect_uri": "https://myapp.example.com/oauth/callback",
  "scopes": ["openid"]
}
```

Response will include:
- `data.client_id`: Your OAuth Client ID
- `data.client_secret`: Your OAuth Client Secret (only shown once - save it!)

### 2. Obtain an Authorization Code (requires user interaction)
Redirect users to the authorization endpoint:
```
GET /oauth/authorize?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope=openid&state={random_state}
```

After user authorization, they are redirected to your `redirect_uri` with:
- `code`: The authorization code (use this in the token request)
- `state`: Verify this matches what you sent

### 3. Exchange Code for Token
Call this endpoint with the authorization code.

## Why This Endpoint Cannot Be Automated

The OAuth Authorization Code flow is specifically designed to require user interaction:
1. The user must authenticate with the platform
2. The user must explicitly grant permission to your app
3. Only then is an authorization code issued

This is a security feature, not a bug. The authorization code flow ensures that:
- Users explicitly consent to app access
- Server-to-server attacks cannot obtain tokens without user consent
- The app cannot impersonate users without their knowledge

## UID Resolution Procedure

| Field | Source | Notes |
|-------|--------|-------|
| client_id | `POST /platform/v1/apps` → `data.client_id` | One-time app creation |
| client_secret | `POST /platform/v1/apps` → `data.client_secret` | Only shown once during app creation |
| code | `/oauth/authorize` redirect | Requires browser-based user authorization |
| redirect_uri | Your app's callback URL | Must match app configuration |

## Critical Learnings

1. **Only `authorization_code` grant type is supported** - `client_credentials` is NOT supported
2. **Authorization codes are single-use** - once exchanged, they cannot be reused
3. **Authorization codes expire quickly** - typically within minutes
4. **client_secret is only shown once** - during app creation, store it securely
5. **redirect_uri must match exactly** - the URI used in the token request must match one configured for the app

## Request Template

```json
{
  "method": "POST",
  "path": "/oauth/token",
  "body": {
    "grant_type": "authorization_code",
    "client_id": "{{app.client_id}}",
    "client_secret": "{{app.client_secret}}",
    "code": "{{authorization_code_from_user_flow}}",
    "redirect_uri": "https://myapp.example.com/oauth/callback"
  }
}
```

## Manual Testing Procedure

To manually test this endpoint:

1. **Create an app** (if not already done):
   ```bash
   curl -X POST "https://api.vcita.biz/platform/v1/apps" \
     -H "Authorization: Bearer {directory_token}" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test OAuth App","app_code_name":"testoauth123","redirect_uri":"https://myapp.example.com/callback"}'
   ```
   Save the `client_id` and `client_secret` from the response.

2. **Initiate authorization** (in browser):
   Navigate to:
   ```
   https://app.vcita.com/oauth/authorize?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope=openid&state=random123
   ```

3. **Authorize the app** - Login and grant permission when prompted

4. **Capture the code** - After redirect, extract the `code` parameter from the URL

5. **Exchange for token**:
   ```bash
   curl -X POST "https://api.vcita.biz/oauth/token" \
     -H "Content-Type: application/json" \
     -d '{"grant_type":"authorization_code","client_id":"{client_id}","client_secret":"{client_secret}","code":"{code}","redirect_uri":"{redirect_uri}"}'
   ```
```