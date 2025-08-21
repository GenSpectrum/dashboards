# URL parameters

The application state can be fully (XX?) represented via URL
parameters. The state is, besides the base URL (XX which chooses the
[astro template XX](XX)), mainly (only?XX) filter settings.

The parameters are changed when a XX button in one of the filter
components is pressed (XX how does a component have the power to
trigger a page reload?). Currently, this implies a page reload, and
this is how the change ends up in the components. But there is work
under way to change this to reinitialize the components using the
filters without a page reload.
