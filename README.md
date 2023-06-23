# Tools for implementing Data Seep Pattern

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![Code Quality][quality-img]][quality-link]
[![Coverage][coverage-img]][coverage-link]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api documentation]

[npm-image]: https://img.shields.io/npm/v/data-seep.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/data-seep
[build-status-img]: https://github.com/proc7ts/data-seep/workflows/Build/badge.svg
[build-status-link]: https://github.com/proc7ts/data-seep/actions?query=workflow:Build
[quality-img]: https://app.codacy.com/project/badge/Grade/7b713de99b284eb1960b7b3ad9abf730
[quality-link]: https://www.codacy.com/gh/proc7ts/data-seep/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_Grade
[coverage-img]: https://app.codacy.com/project/badge/Coverage/7b713de99b284eb1960b7b3ad9abf730
[coverage-link]: https://www.codacy.com/gh/proc7ts/data-seep/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_Coverage
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/proc7ts/data-seep
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api documentation]: https://proc7ts.github.io/data-seep/

## Data Seep Pattern

A code utilizing Data Seep Pattern may look like this:

```typescript
await withLogger({ level: LogLevel.DEBUG })(async logger => {
  logger.info('Connecting to database');

  await withDatabase({
    uri: 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb',
  })(async db => {
    logger.info('Starting HTTP server');

    await withHttpServer()(async server => {
      server.dispath({
        path: '/api/user',
        method: 'GET',
      })(async ({ request, response }) => {
        const id = parseInt(request.url.searchParams.get('id'));
        const user = await db.query('SELECT name, email FROM user WHERE id = :id', { id });

        response.setHeader('Content-Type', 'application/json');

        await response.send(JSON.stringify(user));
      });
      server.dispath({
        path: '/api/user',
        method: 'PUT',
      })(async ({ request, response }) => {
        const user = JSON.parse(await request.read());
        const { id } = await db.query('INSERT INTO user (name, email) VALUES (:name, :email) RETURNING id', user);

        response.setHeader('Content-Type', 'application/json');

        await response.send(JSON.stringify({ id }));
      });
      server.dispatchError({
        type: NotFoundError,
      })(async ({ response, error }) => {
        response.setHeader('Content-Type', 'application/json');
        response.setStatus(404);

        await response.send(JSON.stringify({ error: String(error.message) }));
      });
      server.dispatchError()(async ({ response, error }) => {
        response.setHeader('Content-Type', 'application/json');
        response.setStatus(500);

        await response.send(JSON.stringify({ error: String(error) }));
      });

      await Promise.any([
        withSignal({
          signal: 'SIGINT',
        })(signal => {
          logger.info('SIGINT received');

          return Promise.reject(signal);
        }),
        server.listen({ post: 8080 }),
      ]);
    });

    logger.info('HTTP server stopped');
  });

  logger.info('Disconnected from database');
});
```

The pattern relies on variable scoping rules. In particular, the data _inflow_ into outer scope _seep through_ other
data _faucets_ to inner scopes.

A data _faucet_ function implementing this pattern accepts an asynchronous _sink_ function as its argument.
The _sink_ accepts an _inflow_ value as its first argument. The _inflow_ value exists while the _sink_ processing it.
After that, the value is no longer valid.

**Implementing this pattern does not require the knowledge or use of any third-party libraries or APIs**. However,
in more complicated scenarios the tools provided by this package may be of help.
