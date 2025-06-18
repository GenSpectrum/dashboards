# Introduction and Goals

> Files in this folder document the architecture of the project using the [arc42](https://arc42.org/) template.

The GenSpectrum dashboards visualize pathogen genomic data obtained from [LAPIS](https://github.com/GenSpectrum/LAPIS) instances.

Important requirements are:
* **interactive**: 
  Users can set filters on the data (such as restricting the data to a certain date range, region, or mutation).
  This allows users to explore the data in a flexible way.
* **realtime**:
  The visualizations update in realtime when the user changes the filters.
  This allows users to be ahead of time since they don't depend on us providing them with precomputed data.
  
One important use case is that users should be able to search for new emerging variants of pathogens.
Interactivity and realtime updates are crucial for this use case,
since users can browse the data.

