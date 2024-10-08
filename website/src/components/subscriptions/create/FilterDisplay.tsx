import { type DateWindow, getStartDate } from '../../../types/DateWindow.ts';
import type { LapisFilter, SubscriptionRequest } from '../../../types/Subscription.ts';
import { GsNumberSequencesOverTime } from '../../genspectrum/GsNumberSequencesOverTime.tsx';
import { GsPrevalenceOverTime } from '../../genspectrum/GsPrevalenceOverTime.tsx';

// TODO: Add latest version filter for WestNile #194
export function FilterDisplay({
    subscription,
    lapisDateField,
}: {
    subscription: SubscriptionRequest;
    lapisDateField: string;
}) {
    const getGranularity = (dateWindow: DateWindow) => {
        switch (dateWindow) {
            case 'last6Months':
                return 'week';
            case 'last2Weeks':
                return 'day';
            default:
                return 'day';
        }
    };

    const addDateWindowToFilter = (filter: LapisFilter, dateWindow: DateWindow) => {
        const dateColumn = 'date';

        return { ...filter, [`${dateColumn}From`]: getStartDate(dateWindow).format('YYYY-MM-DD') };
    };

    const display = () => {
        switch (subscription.trigger.type) {
            case 'count':
                return (
                    <>
                        <h2 className='component-title'>Count over time</h2>
                        <div className='h-[400px]'>
                            <GsNumberSequencesOverTime
                                lapisFilter={{
                                    displayName: 'Your variant',
                                    lapisFilter: addDateWindowToFilter(
                                        subscription.trigger.filter,
                                        subscription.dateWindow,
                                    ),
                                }}
                                granularity={getGranularity(subscription.dateWindow)}
                                views={['line', 'table']}
                                height='100%'
                                lapisDateField={lapisDateField}
                            />
                        </div>
                    </>
                );
            case 'proportion':
                return (
                    <>
                        <h2 className='component-title'>Prevalence over time</h2>
                        <div className='h-[400px]'>
                            <GsPrevalenceOverTime
                                numeratorFilter={{
                                    displayName: 'Your variant',
                                    lapisFilter: addDateWindowToFilter(
                                        subscription.trigger.numeratorFilter,
                                        subscription.dateWindow,
                                    ),
                                }}
                                denominatorFilter={addDateWindowToFilter(
                                    subscription.trigger.denominatorFilter,
                                    subscription.dateWindow,
                                )}
                                granularity={getGranularity(subscription.dateWindow)}
                                views={['line', 'table']}
                                height='100%'
                                lapisDateField={lapisDateField}
                            />
                        </div>
                    </>
                );
        }
    };

    return <div className='min-w-72 flex-1'>{display()}</div>;
}
