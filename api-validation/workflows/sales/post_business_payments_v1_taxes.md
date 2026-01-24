---
endpoint: POST /business/payments/v1/taxes
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T14:30:03.188Z
verifiedAt: 2026-01-23T14:30:03.188Z
timesReused: 0
---
# Create Taxes

## Summary
Test passes with 201 status when using correct array format for default_for_categories. The documentation incorrectly shows this field as a string when it should be an array.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/business/payments/v1/taxes",
  "body": {
    "tax": {
      "name": "Sales Tax 2",
      "rate": 8.5,
      "default_for_categories": [
        "products"
      ]
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| default_for_categories | Documentation implies default_for_categories accepts a string value ('services'), but the API expects an array of strings (['services']). The original request failed with 500 error 'undefined method `each' for "services":String' | Update swagger schema to show default_for_categories as an array of strings with enum values ['services', 'products', 'packages']. Example should be ['services'] not 'services' | critical |
| default_for_categories | Valid category values are not documented. Source code shows only 'services', 'products', 'packages' are allowed | Add enum constraint in swagger with values ['services', 'products', 'packages'] | major |
| default_for_categories | Business constraint not documented: maximum 3 default taxes allowed per category | Document the constraint that each business can have at most 3 taxes with default_for_categories set per category | minor |