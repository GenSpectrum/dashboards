# Architecture Decisions

## Login Solution

### Context

For the subscriptions feature, we need a way to authenticate users.
Every user should be able to manage their subscriptions and see their data.
We also need a way to notify users in case the subscription triggers (via e-mail or Slack hook).

We considered several options for authentication:

* Using Keycloak
* Using GitHub OAuth
* Using a managed service

### Decision

We decided to use a GitHub OAuth app for authentication.
It was an easy and straightforward way to authenticate users.
We don't need to host or maintain an authentication service ourselves.

We also decided to use [auth-astro](https://github.com/nowaythatworked/auth-astro)
to handle the authentication flow in the Astro application.
It supports GitHub OAuth out of the box.

We refrained from using Keycloak since setting it up is more effort.
We would have needed to host it on one of our servers and configure it properly.
Although is it relatively easy to get a Keycloak Docker image running,
it is still difficult to get the configuration right.
None of the team members was an expert in Keycloak and misconfigurations can lead to security issues.

## Auto-creation of collections

### Context

As GenSpectrum, we want to provide a few collections that we create based on other online resources.
Ideally, others would maintain their own collections, but for now we want to do it ourselves.
For example, we create collections for mutations that are relevant for vaccine resistance, based
on online lists. Or we create collections based on canonical lineage definitions.

Since we want others to also be able to easily generate collections, the code should also serve
as a kind of reference implementation on how one would generate collections. Therefore, we want the
code to be completely independent of the rest of the codebase, and also understandable to
bioinformatics researchers.

### Decision

We decided to write the code in Python.
The alternative would have been to use JavaScript, since we already have that. But since we want
researchers to reuse or copy the code, Python is better suited.
Kotlin was not considered — it is heavier than both Python and JavaScript and even less familiar
to the target audience.
