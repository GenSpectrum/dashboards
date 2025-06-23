# Architecture Constraints

* The dashboards are an app that run in a standard web browser.
  We host an instance that is accessible via the internet.
* The genomic data is obtained from LAPIS instances.
* We want to use the [Dashboard Components](https://github.com/GenSpectrum/dashboard-components/tree/main/components)
  as much as possible.

Non-constraints:
* In contrast to other GenSpectrum applications, the dashboards do not need to be reusable.
  It is not intended to be hosted by anyone else (although of course it is possible to do so).
  It is not intended to be configurable by the user.
