---
endpoint: "POST /platform/v1/leadgen"
domain: sales
tags: []
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-26T21:42:53.839Z"
verifiedAt: "2026-01-26T21:42:53.839Z"
timesReused: 0
---

# Create Leadgen

## Summary
Test passes with staff or directory token and realistic field values. The original 500 error was caused by using a token where current_user is nil, leading to business.user being nil in the staff assignment logic.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_leadgen
    method: POST
    path: "/platform/v1/leadgen"
    body:
      address: 123 Test Street, Test City, TC 12345
      business_id: "{{business_id}}"
      email: leadtest2@example.com
      first_name: Jane
      last_name: Smith
      identifier_type: email
      message_data:
        source: website
        priority: normal
      notifications: email,sms
      opt_in: yes
      opt_in_transactional_sms: true
      phone: "+1234567891"
      request_data:
        company: Test Company 2
        budget: "10000"
      request_title: Another Lead Inquiry
      source: directory
      source_url: https://example.com/contact
      status: lead
      system_message: New lead has been created from directory integration
      tags: directory,lead,medium-priority
    expect:
      status: [200, 201]
```
