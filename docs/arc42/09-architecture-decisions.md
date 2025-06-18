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

We refrained from using Keycloak since setting it up is more effort, and it can easily be misconfigured to be insecure.
