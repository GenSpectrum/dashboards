# Components

## React components

* `src/components/ErrorReportInstruction.tsx`

    - ErrorReportToastModal
    - ErrorReportInstruction
    - CopyToClipboardButton

* `src/components/auth/LoginButton.tsx`

    - LoginButton: `<button>`
    
* `src/components/genspectrum/AdvancedQueryFilter.tsx`

    - AdvancedQueryFilter({value?: string, onInput?: ChangeEventHandler<HTMLInputElement>}): `<input  placeholder={'Advanced query: A123T & ins_123:TA'}` -- how is this hooked up? via the onInput, but not type restricted.

* `src/components/genspectrum/GsApp.tsx`

    - GsApp: just `<gs-app>`

* `src/components/genspectrum/GsDateRangeSelector.tsx`

    - GsDateRangeSelector: `<gs-date-range-selector>` with useEffect

* `src/components/genspectrum/GsLineageFilter.tsx`

    - GsLineageFilter: `<gs-lineage-filter` with useEffect

* `src/components/genspectrum/GsLocationFilter.tsx`

    - GsLocationFilter: `<gs-location-filter` with useEffect

* `src/components/genspectrum/GsMutationFilter.tsx`

    - GsMutationFilter: `<gs-mutation-filter` with useEffect

* `src/components/genspectrum/GsNumberSequencesOverTime.tsx`

    - `GsNumberSequencesOverTime: `<gs-number-sequences-over-time`

* `src/components/genspectrum/GsPrevalenceOverTime.tsx`

    - `GsPrevalenceOverTime`: `<gs-prevalence-over-time`

* `src/components/genspectrum/GsTextInput.tsx`

    - `GsTextInput`: `<gs-text-input` with useEffect

* `src/components/pageStateSelectors/ApplyFilterButton.tsx`

    - `ApplyFilterButton`: `<a role='button'`

* `src/components/pageStateSelectors/BaselineSelector.tsx`

    - `BaselineSelector`: `<div className='flex flex-col gap-2'> <GsLocationFilter .. <GsDateRangeSelector`

* `src/components/pageStateSelectors/CompareSideBySidePageStateSelector.tsx`
* `src/components/pageStateSelectors/CompareVariantsPageStateSelector.tsx`
* `src/components/pageStateSelectors/CompareVariantsToBaselineStateSelector.tsx`
* `src/components/pageStateSelectors/FallbackElement.tsx`
* `src/components/pageStateSelectors/LineageFilterInput.tsx`
* `src/components/pageStateSelectors/SelectorHeadline.tsx`
* `src/components/pageStateSelectors/SequencingEffortsPageStateSelector.tsx`
* `src/components/pageStateSelectors/SingleVariantPageStateSelector.tsx`
* `src/components/pageStateSelectors/VariantSelector.tsx`
* `src/components/pageStateSelectors/VariantsSelector.tsx`
* `src/components/subscriptions/backendApi/withQueryProvider.tsx`
* `src/components/subscriptions/create/BaselineInput.tsx`
* `src/components/subscriptions/create/ChannelsInput.tsx`
* `src/components/subscriptions/create/CountFilterInput.tsx`
* `src/components/subscriptions/create/DateWindowInput.tsx`
* `src/components/subscriptions/create/FilterDisplay.tsx`
* `src/components/subscriptions/create/IntervalInput.tsx`
* `src/components/subscriptions/create/NameInput.tsx`
* `src/components/subscriptions/create/OrganismInput.tsx`
* `src/components/subscriptions/create/SubscriptionsCreate.tsx`
* `src/components/subscriptions/create/TriggerInput.tsx`
* `src/components/subscriptions/create/TriggerTypeInput.tsx`
* `src/components/subscriptions/create/VariantInput.tsx`
* `src/components/subscriptions/notificationChannels/NotificationChannelDisplay.tsx`
* `src/components/subscriptions/overview/SubscriptionDisplay.tsx`
* `src/components/subscriptions/overview/SubscriptionEntry.tsx`
* `src/components/subscriptions/overview/SubscriptionFilter.tsx`
* `src/components/subscriptions/overview/Subscriptions.tsx`
* `src/components/views/analyzeSingleVariant/CollectionsList.tsx`
* `src/layouts/Breadcrumbs.tsx`
* `src/layouts/base/header/Brand.tsx`
* `src/layouts/base/header/MegaMenu.tsx`
* `src/layouts/base/header/Navigation.tsx`
* `src/styles/containers/BorderedCard.tsx`
* `src/styles/containers/CardContent.tsx`
* `src/styles/containers/CardDescription.tsx`
* `src/styles/containers/CardHeader.tsx`
* `src/styles/containers/DividerList.tsx`
* `src/styles/containers/Modal.tsx`
* `src/styles/containers/ModalBox.tsx`
* `src/styles/containers/ModalContent.tsx`
* `src/styles/containers/ModalHeader.tsx`
* `src/styles/containers/PageContainer.tsx`
* `src/styles/containers/PageHeadline.tsx`
* `src/styles/input/InputLabel.tsx`

## Astro components

* `src/components/ComponentHeadline.astro`
* `src/components/ComponentWrapper.astro`
* `src/components/ComponentsGrid.astro`
* `src/components/InfluenzaWastewaterInfo.astro`
* `src/components/Link.astro`
* `src/components/MainMenuItem.astro`
* `src/components/RsvWastewaterInfo.astro`
* `src/components/auth/LoginState.astro`
* `src/components/auth/NotLoggedIn.astro`
* `src/components/auth/UserDropdown.astro`
* `src/components/genspectrum/GsAggregate.astro`
* `src/components/genspectrum/GsMutationComparison.astro`
* `src/components/genspectrum/GsMutations.astro`
* `src/components/genspectrum/GsMutationsOverTime.astro`
* `src/components/genspectrum/GsNumberSequencesOverTime.astro`
* `src/components/genspectrum/GsPrevalenceOverTime.astro`
* `src/components/genspectrum/GsRelativeGrowthAdvantage.astro`
* `src/components/genspectrum/GsSequencesByLocation.astro`
* `src/components/genspectrum/GsStatistics.astro`
* `src/components/genspectrum/GsWastewaterMutationsOverTime.astro`
* `src/components/views/analyzeSingleVariant/GenericAnalyzeSingleVariantPage.astro`
* `src/components/views/analyzeSingleVariant/SelectVariant.astro`
* `src/components/views/compareSideBySide/GenericCompareSideBySidePage.astro`
* `src/components/views/compareToBaseline/GenericCompareToBaselinePage.astro`
* `src/components/views/compareToBaseline/SelectBaseline.astro`
* `src/components/views/compareVariants/GenericCompareVariantsPage.astro`
* `src/components/views/compareVariants/SelectVariants.astro`
* `src/components/views/sequencingEfforts/GenericSequencingEffortsPage.astro`
* `src/layouts/ContaineredPage/ContaineredPageLayout.astro`
* `src/layouts/OrganismPage/AccessionsDownloadButton.astro`
* `src/layouts/OrganismPage/DataPageLayout.astro`
* `src/layouts/OrganismPage/LastUpdatedInfo.astro`
* `src/layouts/OrganismPage/OrganismViewPageLayout.astro`
* `src/layouts/OrganismPage/SingleVariantOrganismPageLayout.astro`
* `src/layouts/base/BaseLayout.astro`
* `src/layouts/base/footer/DataInfo.astro`
* `src/layouts/base/footer/DataOriginLink.astro`
* `src/layouts/base/footer/Footer.astro`
* `src/layouts/base/footer/FooterNavigation.astro`
* `src/layouts/base/footer/PrimaryFooter.astro`
* `src/layouts/base/footer/SecondaryFooter.astro`
* `src/layouts/base/header/CallToAction.astro`
* `src/layouts/base/header/HamburgerMenu.astro`
* `src/layouts/base/header/HamburgerMenuItem.astro`
* `src/layouts/base/header/HamburgerMenuSection.astro`
* `src/layouts/base/header/Header.astro`
* `src/pages/404.astro`
* `src/pages/500.astro`
* `src/pages/covid/compare-side-by-side.astro`
* `src/pages/covid/compare-to-baseline.astro`
* `src/pages/covid/compare-variants.astro`
* `src/pages/covid/index.astro`
* `src/pages/covid/sequencing-efforts.astro`
* `src/pages/covid/single-variant.astro`
* `src/pages/data.astro`
* `src/pages/flu/compare-side-by-side.astro`
* `src/pages/flu/h5n1/compare-side-by-side.astro`
* `src/pages/flu/h5n1/compare-to-baseline.astro`
* `src/pages/flu/h5n1/compare-variants.astro`
* `src/pages/flu/h5n1/index.astro`
* `src/pages/flu/h5n1/sequencing-efforts.astro`
* `src/pages/flu/h5n1/single-variant.astro`
* `src/pages/flu/index.astro`
* `src/pages/flu/sequencing-efforts.astro`
* `src/pages/index.astro`
* `src/pages/logout.astro`
* `src/pages/mpox/compare-side-by-side.astro`
* `src/pages/mpox/compare-to-baseline.astro`
* `src/pages/mpox/compare-variants.astro`
* `src/pages/mpox/index.astro`
* `src/pages/mpox/sequencing-efforts.astro`
* `src/pages/mpox/single-variant.astro`
* `src/pages/rsv-a/compare-side-by-side.astro`
* `src/pages/rsv-a/compare-to-baseline.astro`
* `src/pages/rsv-a/compare-variants.astro`
* `src/pages/rsv-a/index.astro`
* `src/pages/rsv-a/sequencing-efforts.astro`
* `src/pages/rsv-a/single-variant.astro`
* `src/pages/rsv-b/compare-side-by-side.astro`
* `src/pages/rsv-b/compare-to-baseline.astro`
* `src/pages/rsv-b/compare-variants.astro`
* `src/pages/rsv-b/index.astro`
* `src/pages/rsv-b/sequencing-efforts.astro`
* `src/pages/rsv-b/single-variant.astro`
* `src/pages/subscriptions/channels/index.astro`
* `src/pages/subscriptions/create.astro`
* `src/pages/subscriptions/index.astro`
* `src/pages/swiss-wastewater/flu.astro`
* `src/pages/swiss-wastewater/index.astro`
* `src/pages/swiss-wastewater/rsv.astro`
* `src/pages/west-nile/compare-side-by-side.astro`
* `src/pages/west-nile/compare-to-baseline.astro`
* `src/pages/west-nile/compare-variants.astro`
* `src/pages/west-nile/index.astro`
* `src/pages/west-nile/sequencing-efforts.astro`
* `src/pages/west-nile/single-variant.astro`

## Pages

The filename represents the component name, but is (probably only)
used via routing directly.

Thus just showing what it *contains* (outputs), not defines.

### errors

* `404.astro`
* `500.astro`

### covid

* `covid/index.astro`

redirect to 'covid.singleVariantView'

* `covid/compare-side-by-side.astro`

    OrganismViewPageLayout around gs-app but then calling various: CompareSideBySidePageStateSelector CompareSideBySideSelectorFallback GsPrevalenceOverTime GsRelativeGrowthAdvantage GsMutations x 2 GsAggregate x 2

* `covid/compare-to-baseline.astro`

    `<GenericCompareToBaselinePage organism={Organisms.covid} />`

* `covid/compare-variants.astro`

    `<GenericCompareVariantsPage organism={Organisms.covid} />`

* `covid/sequencing-efforts.astro`

    `<GenericSequencingEffortsPage organism={Organisms.covid} />`

* `covid/single-variant.astro`

    SingleVariantOrganismPageLayout, with SelectVariant, GsStatistics, ComponentsGrid { GsPrevalenceOverTime, GsRelativeGrowthAdvantage, GsMutations x 2, GsAggregate x 3 }, GsMutationsOverTime, GsMutationsOverTime

### data

* `data.astro`

    ContaineredPageLayout, PageHeadline, plain HTML with text, "Data sources and preprocessing"


### flu

* `flu/compare-side-by-side.astro`

    `<GenericCompareSideBySidePage organism={Organisms.flu} hideMutationComponents={true} />`
    
* `flu/h5n1/compare-side-by-side.astro`
* `flu/h5n1/compare-to-baseline.astro`
* `flu/h5n1/compare-variants.astro`
* `flu/h5n1/index.astro`
* `flu/h5n1/sequencing-efforts.astro`
* `flu/h5n1/single-variant.astro`
* `flu/index.astro`
* `flu/sequencing-efforts.astro`

### index, logout

* `index.astro`
* `logout.astro`

### mpox

* `mpox/compare-side-by-side.astro`
* `mpox/compare-to-baseline.astro`
* `mpox/compare-variants.astro`
* `mpox/index.astro`
* `mpox/sequencing-efforts.astro`
* `mpox/single-variant.astro`

### rsv-a

* `rsv-a/compare-side-by-side.astro`
* `rsv-a/compare-to-baseline.astro`
* `rsv-a/compare-variants.astro`
* `rsv-a/index.astro`
* `rsv-a/sequencing-efforts.astro`
* `rsv-a/single-variant.astro`

### rsv-b

* `rsv-b/compare-side-by-side.astro`
* `rsv-b/compare-to-baseline.astro`
* `rsv-b/compare-variants.astro`
* `rsv-b/index.astro`
* `rsv-b/sequencing-efforts.astro`
* `rsv-b/single-variant.astro`

### subscriptions

* `subscriptions/channels/index.astro`
* `subscriptions/create.astro`
* `subscriptions/index.astro`

### swiss-wastewater

* `swiss-wastewater/flu.astro`
* `swiss-wastewater/index.astro`
* `swiss-wastewater/rsv.astro`

### west-nile

* `west-nile/compare-side-by-side.astro`
* `west-nile/compare-to-baseline.astro`
* `west-nile/compare-variants.astro`
* `west-nile/index.astro`
* `west-nile/sequencing-efforts.astro`
* `west-nile/single-variant.astro`
