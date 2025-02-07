# Contributing to Dashboards

Contributions are very welcome! Just fork the repository, develop in a branch and submit a pull request.

## Commit Messages

We follow [conventional commits](https://www.conventionalcommits.org) when writing commit messages.
The messages themselves should help future developers understand **why** changes were made.

## Code Style

We value clean code, here are some guidelines on what we consider clean code:

- Use expressive names (variables, classes, function), avoid abbreviations unless they are really common sense
- Small functions and classes
- Reasonable test coverage: We don't require 100% test coverage, but we do require tests for all non-trivial code.
  Every piece of the code should at least be tested in the happy path.
- Develop code with testability in mind.

## Frontend

### Basic concepts

The website shows dashboards for several organisms.
The data sources are publicly available instances of [LAPIS](https://github.com/GenSpectrum/LAPIS) (one for each organism).
Every organism has several views on the data.
The different views of an organism highlight different aspects of the data,
but they use the same LAPIS instance.

The views make use of the [Dashboard Components](https://github.com/GenSpectrum/dashboard-components) library.
Every view has a section that lets the user set filters on the sequence data that should be considered, such as:

- setting a date range (sequences from 2020, the last 2 months or 2010 - 2019),
- selecting a region (sequences from Germany, the US or Asia),
- considering only sequences with a certain mutation.

Every view also has a section that shows a number of diagrams that visualize the data that match the filters that the user set.

The currently set filters are considered the "state" of the view.

- The state is stored as query parameters in the URL,
  so that the user can bookmark the current view or send it to someone else.
- Obviously, we must be able to reconstruct the state from a given URL.
    - Upon a page reload, the values of the input fields in the filters section must be set according to the state in the URL.
- The state can also be translated into `lapisFilter` objects that can be passed to the visualization components.
  The components in turn will use the `lapisFilter` objects to query LAPIS for the data that they show.

The filters are divided into two categories:

- The "variant filters" that refer to a certain "variant" of the organism.
  This could e.g. be a set of mutations or a certain lineage.
- The "dataset filters" that form a "baseline" for the variant (e.g. date range, region, etc.)

Usually, the `lapisFilter` will be computed by combining the variant filters with the dataset filters.
By having the dataset filters separate,
we can compute measures on how prevalent that variant is in the dataset
(i.e. in a certain country or in a certain time frame).
Think: `prevalence = count(variant in Germany) / count(all sequences in Germany)`.

### Basic guidelines

We make use of some major libraries: Astro, React, Daisyui, and Tailwindcss.

- Render pages using Astro when possible
    - Astro render HTML on the server, which is faster than rendering on the client.
    - Avoid client side Javascript code in Astro components.
      If you need interactivity in the browser, then you should use React.
- when possible use CSS over Javascript for interactivity (e.g. for modals, dropdowns, etc.)
    - it often yields less and simpler code
    - we can profit from browser parallelization and optimizations (modern browsers are highly optimized for parsing HTML and CSS - when using JS that's not immediately possible)
- use React for interactive components
- Use constant collections for "magic values" are used across the code base, e.g.:

    ```typescript
    export const constantCollection = {
        constant1: 'constant1' as const,
        constant2: 'constant2' as const,
    };

    // usage
    <Component value={constantCollection.constant1} />
    ```

    instead of using strings directly:

    ```typescript
    <Component value='constant1' />
    ```

    - This makes it easier to find all usages of a constant
    - It makes it easier to refactor the code
    - It gives context to the "magic value"

### Styling

We use [Tailwind CSS](https://tailwindcss.com/) for styling.

- if possible use tailwind instead of custom CSS and inline styles
- consider using [components for styling](https://tailwindcss.com/docs/reusing-styles) that is used in multiple places (or to improve readability)
    ```typescript
    const MyHeadline = ({ children }) => (
      <h1 className='text-lg font-bold'>
        {children}
      </h1>
    );
    ```

### Testing

We use vitest for unit tests and playwright for end-to-end tests.

- each major function should have a unit test
- each page should have an end-to-end test

### Logging

We use winston for logging.

To get a logger instance, use the following code:

```javascript
const logger = getInstanceLogger('your-module-name');
logger.info('your log message');
```
