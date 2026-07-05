# Clients tags API – frontend source of truth

The **bulk** add/remove tags endpoints used by the product are defined by how **Frontage** calls them. Use this when writing or adjusting workflows and Swagger for tags.

## Frontend implementation

- **Repo:** frontage  
- **File:** `app/assets/frontage/app/crm/actions/client-tags/client-bulk-tags-controller.js.coffee`  
- **Service (opens dialog):** `app/assets/frontage/app/crm/actions/client-tags/client-bulk-tags-service.js.coffee`

## Bulk add tags

- **Method/URL:** `PUT /business/clients/v1/tags`
- **Body:** `{ new_api: true, matters: { uids: matter_uids }, tags: added_tags }`
  - `matter_uids`: array of matter UIDs (in the app, from each selected client’s `client.matter_uid`)
  - `added_tags`: array of tag strings to add
- **Frontend call:** `Restangular.all("business/clients/v1/tags").customPUT({ new_api: true, matters: { uids: matter_uids }, tags: added_tags })`

## Bulk remove tags

- **Method/URL:** `DELETE /business/clients/v1/tags`
- **Query (optional):** `new_api: true` (Frontage sends it)
- **Body:** `{ matters: { uids: matter_uids }, tags: removed_tags }`
  - Same shape as add; `removed_tags` is the list of tag strings to remove.
- **Frontend call:** `Restangular.all("business/clients").customDELETE("v1/tags", { new_api: true }, {'content-type': 'application/json'}, { matters: { uids: matter_uids }, tags: removed_tags })`

## Single-matter endpoints (legacy / alternate)

- **POST** `/business/clients/v1/matters/{matter_uid}/tags` – add one tag to one matter (body: `{ tag: "..." }`).
- **DELETE** `/business/clients/v1/matters/{matter_uid}/tags` – remove one tag from one matter (body: `{ tag: "..." }`).

The CRM bulk UI uses only PUT/DELETE `/v1/tags` when the selected clients have `matter_uid`; otherwise it falls back to legacy `tags/bulk_create` / `tags/bulk_remove` (different API).

## Workflows and Swagger

- **PUT workflow:** `api-validation/workflows/clients/put_business_clients_v1_tags.md` – aligned with Frontage add flow; prerequisites get one matter_uid via GET matters.
- **Swagger:** `swagger/clients/legacy/manage_clients.json` – path `/v1/tags` has `put` (bulk add) and `delete` (bulk remove). Single-matter operations remain under `/v1/matters/{matter_uid}/tags`.

When in doubt, match the request shape and URL to the Frontage controller above.
