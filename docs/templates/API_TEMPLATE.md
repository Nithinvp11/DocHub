# API Documentation Template

## API Name

[api-name]

## Purpose

[what-this-api-does-and-when-to-use-it]

## Endpoint

- Method: `GET | POST | PUT | PATCH | DELETE`
- Path: `<path>`
- Auth required: yes/no

## Request

### Headers

- `Authorization`: [format]
- `Content-Type`: `application/json` (if applicable)

### Path Params

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
|      |      |          |             |

### Query Params

| Name | Type | Required | Default | Description |
| ---- | ---- | -------- | ------- | ----------- |
|      |      |          |         |             |

### Body

```json
{}
```

## Response

### Success Response

- Status: `<200/201/...>`

```json
{}
```

### Error Responses

| Status | Error Code | Meaning | Resolution |
| ------ | ---------- | ------- | ---------- |
|        |            |         |            |

## Authorization Rules

- [permission-rule]

## Validation Rules

- [rule]

## Side Effects

- Database writes: <yes/no>
- Background jobs triggered: <yes/no>
- External API calls: <yes/no>

## Idempotency and Retries

- Idempotent: yes/no
- Retry guidance: [details]

## Observability

- Logs emitted: [events]
- Metrics tracked: [metrics]

## Examples

### cURL

```bash
curl -X <METHOD> <URL>
```

### JavaScript

```ts
// example request
```

## References

- Implementation: [file-links]
- Related APIs: [links]
