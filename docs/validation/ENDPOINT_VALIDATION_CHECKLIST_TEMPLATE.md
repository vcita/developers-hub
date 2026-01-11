# Endpoint Validation Checklist Template

**Instructions:** Copy this template for each endpoint being documented. Complete ALL sections before submitting changes.

---

## Endpoint Information

| Field | Value |
|-------|-------|
| **Endpoint** | `[METHOD] [PATH]` |
| **Swagger File** | `swagger/[domain]/[filename].json` |
| **Domain** | [AI/Apps/Clients/Communication/etc.] |
| **Validator** | [Your Name] |
| **Validation Date** | [YYYY-MM-DD] |
| **Peer Reviewer** | [Reviewer Name] |
| **Review Date** | [YYYY-MM-DD] |

---

## Step 1: Source Code Location

### 1.1 Controller Identification

| Field | Value |
|-------|-------|
| **Codebase** | [core/aiplatform/other] |
| **Controller File** | `[full path to controller file]` |
| **Action Method** | `[method name]` |
| **Line Numbers** | `[start-end]` |

**If source code NOT found:**
- [ ] ⛔ STOP - Do not proceed with documentation changes
- [ ] Document in `NEEDS_CODEBASE_ACCESS.md`
- [ ] Request access to appropriate codebase

### 1.2 Related Code Files

| Type | File Path | Purpose |
|------|-----------|---------|
| Service/Component | | |
| Model/Entity | | |
| Decorator/DTO | | |
| Validation | | |

---

## Step 2: Parameter Verification

### 2.1 Path Parameters

| Parameter | In Code? | Type Match? | Required Match? | Notes |
|-----------|----------|-------------|-----------------|-------|
| | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No | |

### 2.2 Query Parameters

| Parameter | In Code? | Type Match? | Required Match? | Default Value | Notes |
|-----------|----------|-------------|-----------------|---------------|-------|
| | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No | | |

### 2.3 Request Body Fields

| Field | In Code? | Type Match? | Required Match? | Validation Rules | Notes |
|-------|----------|-------------|-----------------|------------------|-------|
| | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No | | |

---

## Step 3: Response Verification

### 3.1 Response Codes

| Code | In Code? | Condition | Notes |
|------|----------|-----------|-------|
| 200 | ☐ Yes ☐ No | | |
| 201 | ☐ Yes ☐ No | | |
| 400 | ☐ Yes ☐ No | | |
| 401 | ☐ Yes ☐ No | | |
| 403 | ☐ Yes ☐ No | | |
| 404 | ☐ Yes ☐ No | | |
| 422 | ☐ Yes ☐ No | | |
| 429 | ☐ Yes ☐ No | | |
| 500 | ☐ Yes ☐ No | | |

### 3.2 Error Codes

| Error Code | HTTP Status | Message Pattern | Source Location |
|------------|-------------|-----------------|-----------------|
| | | | |

### 3.3 Response Body Structure

| Field | In Code? | Type Match? | Notes |
|-------|----------|-------------|-------|
| | ☐ Yes ☐ No | ☐ Yes ☐ No | |

---

## Step 4: Business Logic & Constraints

### 4.1 Rate Limits

| Limit Type | Value | Source |
|------------|-------|--------|
| Requests per minute | | |
| Requests per second | | |
| Other | | |

**Rate limit code location:** `[file:line]`

### 4.2 Authentication/Authorization

| Requirement | Value | Verified? |
|-------------|-------|-----------|
| Token Type Required | | ☐ Yes |
| Permissions Needed | | ☐ Yes |
| Scope Restrictions | | ☐ Yes |

### 4.3 Business Rules

| Rule | Description | Code Location |
|------|-------------|---------------|
| | | |

---

## Step 5: Documentation Changes

### 5.1 Changes Made

| Section | Change Type | Description |
|---------|-------------|-------------|
| Summary | ☐ Added ☐ Modified ☐ None | |
| Description | ☐ Added ☐ Modified ☐ None | |
| Parameters | ☐ Added ☐ Modified ☐ None | |
| Request Body | ☐ Added ☐ Modified ☐ None | |
| Responses | ☐ Added ☐ Modified ☐ None | |
| Examples | ☐ Added ☐ Modified ☐ None | |
| Error Codes | ☐ Added ☐ Modified ☐ None | |

### 5.2 Items Marked as NEEDS_VERIFICATION

| Item | Reason | Question to Resolve |
|------|--------|---------------------|
| | | |

---

## Step 6: Validation Checklist

### 6.1 Accuracy Checks

- [ ] All parameters verified against source code
- [ ] All response codes verified against source code
- [ ] All error codes verified against source code
- [ ] All types match source code
- [ ] All required/optional status matches source code
- [ ] All default values match source code
- [ ] All enum values match source code
- [ ] No information was invented or assumed

### 6.2 Completeness Checks

- [ ] Summary is clear and action-oriented
- [ ] Description explains purpose and use cases
- [ ] All path parameters documented
- [ ] All query parameters documented
- [ ] All request body fields documented
- [ ] All response fields documented
- [ ] At least one realistic example provided
- [ ] Error scenarios documented

### 6.3 Quality Checks

- [ ] JSON syntax is valid
- [ ] All $ref links resolve correctly
- [ ] Examples are syntactically valid JSON
- [ ] No typos in field names
- [ ] Consistent naming conventions used

---

## Step 7: Sign-off

### Self-Review

- [ ] I have verified all information against source code
- [ ] I have NOT invented or assumed any information
- [ ] All uncertain items are marked as NEEDS_VERIFICATION
- [ ] Changes are ready for peer review

**Validator Signature:** _________________ **Date:** _________

### Peer Review

- [ ] I have verified the source code references
- [ ] I confirm the documentation matches the code
- [ ] I approve these changes for merge

**Reviewer Signature:** _________________ **Date:** _________

---

## Notes

_Add any additional notes, observations, or context here._

```
[Notes go here]
```
