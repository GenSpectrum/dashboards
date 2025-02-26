# H5N1 Mutation annotations

Antiviral susceptibility mutations have been compiled here: https://www.who.int/teams/global-influenza-programme/laboratory-network/quality-assurance/antiviral-susceptibility-influenza/neuraminidase-inhibitor.

Here mutations are in regard to this reference:
https://www.ncbi.nlm.nih.gov/nuccore/EF619973.1

Mutations from our reference to this reference are:

- NA:V17I NA:I20V NA:I29M NA:H44C NA:N73K NA:H100Y NA:G105S NA:K111R NA:N248S NA:N270D NA:S339F NA:P340S NA:G454S NA:D460G
- deletions: NA:49-68

This means that to convert the mutations to our reference we should just add `20` to the following mutations:

```
V96A
I97T
I97V
I117T
E99A
E99D
E99G
Q116L
V129A
D179G
I203M
I203V
S227N
S247N
H255Y
N275S
N295D
N295S
K412T
T438I
T438N
I97V+I294V
E99A+H255Y
E99D+H255Y
E99G+H255Y
I203L+S227N
I203M+H255Y
I203V+H255Y
N295S+T438N
K130N+I203L+S227N
```
