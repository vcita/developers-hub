## BusinessAiSettings

Business-level AI settings, controlling which AI features a business allows. Evaluated independently of the packaging flags that make a feature available in the first place. Most keys are the business's own choice; the client_agent_optin key is the partner's or vcita's choice and cannot be changed with a Staff token

## Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| uid | The unique identifier of the settings record. Null while the business is still on the defaults and no record has been written for it yet (e.g., "bas_9f31c2", null) | string | Yes |
| business_uid | The unique identifier of the business these settings belong to (e.g., "biz_abc123") | string | Yes |
| settings | Every known AI setting key, with its default filled in for keys the business has never changed. Defaults differ per key | object | Yes |

### Settings Properties

| Name | Description | Type | Required |
| --- | --- | --- | --- |
| note_summary | AI note summaries. While not allowed, no new note gets a summary and existing summaries are withheld from note responses. Speech-to-text on notes is unaffected | object | Yes |
| opted_in | Whether the business has opted in to AI. A business with no stored record is treated as not opted in until it explicitly opts in | object | Yes |
| client_agent | The Client Communication switch in Settings > BizAI. While not allowed, the AI Client Agent does not run for the business, its existing recommendations are not listed in the business's AI recommendations or on the client card, and no new reply suggestions are written to the composer. Recommendations are hidden, not deleted, and appear again once allowed | object | Yes |
| client_agent_optin | Whether the business's partner opted it in to the AI Client Agent. Applies only to a business whose package requires the partner opt-in: until the partner opts the business in, the AI Client Agent does not run, its recommendations are not shown, and the Client Communication setting is not shown. Set by the business's partner or by vcita, never by the business itself: a Staff token that sends this key is rejected with HTTP 403 | object | Yes |

## Example

JSON

```json
{
  "uid": "bas_9f31c2",
  "business_uid": "biz_abc123",
  "settings": {
    "note_summary": {
      "allow": true
    },
    "opted_in": {
      "allow": false
    },
    "client_agent": {
      "allow": true
    },
    "client_agent_optin": {
      "allow": true
    }
  }
}
```