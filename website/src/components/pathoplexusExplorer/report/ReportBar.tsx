import { type FC, useEffect, useMemo } from 'react';

import { MutationBox } from './MutationBox.tsx';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import { parsePlace, placeKey, placeLabel, WORLD } from '../../../pathoplexusExplorer/domain/geography.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { ALL, isPathogenNode, parseSubject } from '../../../pathoplexusExplorer/domain/subject.ts';
import { capitalized } from '../../../pathoplexusExplorer/domain/text.ts';
import { isChosenSubject, type ReportParams } from '../../../pathoplexusExplorer/reports/address.ts';
import type { ReportKind } from '../../../pathoplexusExplorer/reports/kinds.ts';
import { useReferenceSequences } from '../../../pathoplexusExplorer/reports/useGenome.ts';
import { impliedAbove, useCountryMenu, useLevelMenus } from '../../../pathoplexusExplorer/reports/useMenus.ts';
import { PeriodControl } from '../ui/PeriodControl.tsx';
import { Picker } from '../ui/Picker.tsx';
import { placeOptions, subjectOptions, subjectValue, withAbove, withLevel } from '../ui/subjectOptions.ts';

type ReportBarProps = {
    kind: ReportKind;
    params: ReportParams;
    onChange: (change: Partial<ReportParams>, options?: { replace?: boolean }) => void;
};

export const ReportBar: FC<ReportBarProps> = ({ kind, params, onChange }) => {
    const countries = useCountryMenu(CATALOG, kind === 'location' ? ALL : params.what, params.period);
    const levels = useLevelMenus(kind === 'virus' ? undefined : params.what, params.period, CATALOG, params.where);
    const what = params.what;
    const single = isPathogenNode(what) ? what : undefined;
    const sequences = useReferenceSequences(single);
    const pathogen = single?.pathogen;
    const subjectScope = useMemo(() => ({ wholeGroups: kind === 'virus', subtypes: kind === 'virus' }), [kind]);
    const subjects = useMemo(() => subjectOptions(subjectScope), [subjectScope]);
    /** Mutation reports only need the subtype level that selects a reference genome. */
    const levelsShown = (levels.data ?? []).filter(
        (level) => kind !== 'mutations' || level.column === pathogen?.referenceColumn || level.chosen !== undefined,
    );

    /** Fill in a uniquely determined parent serotype when opening a lineage directly. */
    const implied = impliedAbove(levels.data ?? []);
    useEffect(() => {
        if (implied !== undefined && single !== undefined) {
            onChange({ what: withAbove(single, implied) }, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the step itself, not by the handler
    }, [implied?.column, implied?.value]);

    return (
        <div className='no-print sticky top-0 z-20 border-b border-stone-300 bg-stone-50'>
            <div className='sheet mx-auto flex flex-wrap items-center gap-x-2 gap-y-1.5 px-4 py-1.5'>
                {kind !== 'location' && (
                    <Picker
                        label='Pathogen'
                        value={what === undefined ? undefined : subjectValue(what, subjectScope)}
                        placeholder='choose one'
                        options={subjects}
                        onSelect={(value) => {
                            const chosen = value === undefined ? undefined : parseSubject(value, CATALOG);
                            // Clear the mutation query when the pathogen changes.
                            const same =
                                value !== undefined && what !== undefined && value === subjectValue(what, subjectScope);
                            onChange({
                                what: isChosenSubject(chosen) ? chosen : undefined,
                                query: same ? params.query : '',
                            });
                        }}
                    />
                )}

                {kind !== 'location' &&
                    single !== undefined &&
                    levelsShown.map((level, index) => (
                        <Picker
                            key={level.column}
                            label={capitalized(level.label)}
                            value={level.chosen}
                            valueLabel={level.chosen}
                            placeholder={kind === 'lineage' && index === 0 ? 'choose one' : 'any'}
                            isLoading={levels.isLoading}
                            options={level.values.map((entry) => ({
                                value: entry.value,
                                label: entry.label,
                                note: formatCount(entry.n),
                            }))}
                            onSelect={(value) =>
                                onChange({
                                    what: withLevel(
                                        single,
                                        level.column,
                                        value,
                                        level.values.find((entry) => entry.value === value)?.above,
                                    ),
                                    // Changing the dengue serotype changes the reference, so clear the mutation query.
                                    ...(kind === 'mutations' &&
                                    level.column === pathogen?.referenceColumn &&
                                    value !== level.chosen
                                        ? { query: '' }
                                        : {}),
                                })
                            }
                        />
                    ))}

                {kind === 'mutations' && (
                    <MutationBox
                        query={params.query}
                        what={single}
                        where={params.where}
                        period={params.period}
                        sequences={sequences.data}
                        onChange={(query) => onChange({ query })}
                    />
                )}

                <Picker
                    label='Place'
                    value={params.where.level === 'world' ? undefined : placeKey(params.where)}
                    valueLabel={placeLabel(params.where)}
                    placeholder='Worldwide'
                    isLoading={countries.isLoading}
                    options={placeOptions(countries.data ?? [], params.where)}
                    onSelect={(value) => onChange({ where: parsePlace(value) ?? WORLD })}
                />

                <PeriodControl period={params.period} onChange={(period) => onChange({ period })} />
            </div>
        </div>
    );
};
