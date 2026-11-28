export type MetadataField = {
    column: string;
    label: string;
};

export const METADATA_FIELDS: readonly MetadataField[] = [
    { column: 'hostNameScientific', label: 'Host' },
    { column: 'authorAffiliations', label: 'Author affiliations' },
    { column: 'cultureId', label: 'Culture ID' },
    { column: 'depthOfCoverage', label: 'Depth of coverage' },
    { column: 'geoLocAdmin1', label: 'Admin level 1' },
    { column: 'geoLocAdmin2', label: 'Admin level 2' },
    { column: 'sequencingAssayType', label: 'Sequencing assay type' },
    { column: 'sequencingInstrument', label: 'Sequencing instrument' },
    { column: 'sequencingLibrarySelection', label: 'Sequencing library selection' },
    { column: 'sequencingLibrarySource', label: 'Sequencing library source' },
    { column: 'sequencingProtocol', label: 'Sequencing protocol' },
    { column: 'specimenCollectorSampleId', label: 'Isolate name' },
];
