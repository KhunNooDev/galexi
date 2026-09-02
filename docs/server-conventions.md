# Server Conventions

## JSON API contract

Normal JSON endpoints return success data inside a `data` envelope:

```ts
{
  data: T;
}
```

Expected errors use a stable code and a human-readable message. The HTTP status remains the source
of truth:

```ts
{
  error: {
    code: string;
    message: string;
  }
}
```

Routes use the shared response helpers (`ok`, `created`, `badRequest`, `notFound`, and similar)
instead of constructing envelopes directly.

## Route style

Keep route declarations vertically consistent and handlers explicit:

```ts
.method(
  path,
  async (context) => {
    const result = await runUseCase(context.body);

    return ok({ result });
  },
  {
    body: validationSchema,
  },
)
```

Use short section comments in long route files when they improve navigation.

## Layer responsibilities

- Route: HTTP concerns, authentication, validation, and status mapping.
- Service: business and use-case orchestration.
- Repository or persistence module: low-level database implementation when complexity warrants
  extraction.

Do not create a repository merely for consistency. Introduce one when persistence complexity
obscures the service's business flow.

Expected conditions such as missing resources and known conflicts are mapped near the route or use
case. Unexpected failures propagate to the global Elysia error handler, which logs them server-side
and returns a generic `INTERNAL_SERVER_ERROR` response.

## Server-rendered code

Server Components call feature services directly. They do not fetch the application's internal HTTP
API solely for architectural symmetry.

## Native response exceptions

Redirect, image, file, and intentional information-hiding not-found endpoints may use native
`Response` objects. They are not forced into the JSON envelope when that would change HTTP behavior.
