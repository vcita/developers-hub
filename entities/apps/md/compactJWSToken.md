## CompactJWSToken

A compact JWS token object that is used to authenticate a staff member to an inTandem app using a JWKS process. The token is signed by the app's private key and can be verified by the inTandem platform's public key

### Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | Unique identifier of the compactJWSToken object | string |  |
| token | The JWS token that is used to authenticate the staff member to the app. The token is signed by the app's private key and can be verified by the app's public key it contains information about the staff member, the actor generating the token and the app | string |  |
| expiry_date | The date and time the token will expire | string |  |
| app_code_name | The code name of the app that the token is generated for | string |  |

### Example

JSON

```json
{
  "uid": "eyJ0eXAiOiJKV1QiLA0KIC",
  "token": "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
  "expiry_date": "2021-07-20T14:00:00.000Z",
  "app_code_name": "quickbooks"
}
```