# Contributing to Dashboards

Contributions are very welcome! Just fork the repository, develop in a branch and submit a pull request.

## Commit Messages

We follow [conventional commits](https://www.conventionalcommits.org) when writing commit messages.
The messages themselves should help future developers understand **why** changes were made.

## Code Style

We value clean code, here are some guidelines on what we consider clean code:

-   Use expressive names (variables, classes, function), avoid abbreviations unless they are really common sense
-   Small functions and classes
-   Reasonable test coverage: We don't require 100% test coverage, but we do require tests for all non-trivial code.
    Every piece of the code should at least be tested in the happy path.
-   Develop code with testability in mind.

### Frontend

We make use of two frameworks: Astro, React, and Tailwindcss.

-   use Astro when possible (for performance reasons)
    -   however avoid script tags, since they are harder to maintain
-   when possible use css over js for interactivity
-   use React for interactive components
-   Use typed enums instead of strings for constants

### Styling

We use [Tailwind CSS](https://tailwindcss.com/) for styling.

-   if possible use tailwind instead of custom css and inline styles
-   consider using components for styling that is used in multiple places (or to improve readability)

### Testing

We use vitest for unit tests and playwright for end-to-end tests.

-   each major function should have a unit test
-   each page should have an end-to-end test

### Logging

We use winston for logging.

To get a logger instance, use the following code:

```javascript
const logger = getInstanceLogger('your-module-name');
logger.info('your log message');
```
