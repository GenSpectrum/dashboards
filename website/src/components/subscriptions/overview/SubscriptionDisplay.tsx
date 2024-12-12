import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import type { PropsWithChildren } from 'react';

import { type DateWindow, dateWindowConfig } from '../../../types/DateWindow.ts';
import { type EvaluationInterval } from '../../../types/EvaluationInterval.ts';
import type { CountTrigger, ProportionTrigger, Subscription } from '../../../types/Subscription.ts';
import type { WithClassName } from '../../../types/WithClassName.ts';
import { proportionAsPercent } from '../../../util/proportionAsPercent.ts';

export function SubscriptionContent({ children, className = '' }: PropsWithChildren<WithClassName>) {
    return <div className={`rounded-xl border-2 border-gray-100 p-6 ${className}`}>{children}</div>;
}

export function SubscriptionDisplay({ subscription }: { subscription: Subscription }) {
    return (
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3'>
            <StatusDisplay
                triggerEvaluationResult={subscription.triggerEvaluationResult}
                triggerType={subscription.trigger.type}
            />
            <EvaluationIntervalDisplay interval={subscription.interval} />
            <DateWindowDisplay dateWindow={subscription.dateWindow} />
            <TriggerDisplay trigger={subscription.trigger} />
            {/* TODO: Enable notificationChannels in #82, #128 */}
            {/* <NotificationChannelDisplay
                notificationChannels={subscription.notificationChannels}
                active={subscription.active}
            /> */}
        </div>
    );
}

function StatusDisplay({
    triggerEvaluationResult,
    triggerType,
}: {
    triggerType: Subscription['trigger']['type'];
    triggerEvaluationResult: Subscription['triggerEvaluationResult'];
}) {
    return (
        <SubscriptionContent className='flex flex-col gap-2'>
            <div className='font-bold text-gray-500'>Status</div>
            <TriggerEvaluationResult result={triggerEvaluationResult} triggerType={triggerType} />
        </SubscriptionContent>
    );
}

function EvaluationIntervalDisplay({ interval }: { interval: EvaluationInterval }) {
    return (
        <SubscriptionContent className='flex flex-col gap-2'>
            <div className='font-bold text-gray-500'>Evaluation</div>
            <div className='text-gray-500'>{interval}</div>
        </SubscriptionContent>
    );
}

function DateWindowDisplay({ dateWindow }: { dateWindow: DateWindow }) {
    return (
        <SubscriptionContent className='flex flex-col gap-2'>
            <div className='font-bold text-gray-500'>Time window</div>
            <div className='text-gray-500'>{dateWindowConfig[dateWindow].label}</div>
        </SubscriptionContent>
    );
}

function TriggerEvaluationResult({
    result,
    triggerType,
}: {
    result: Subscription['triggerEvaluationResult'];
    triggerType: Subscription['trigger']['type'];
}) {
    if (result.type === 'EvaluationError') {
        return (
            <div className='text-red-500'>
                Error: {result.statusCode} - {result.message}
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-2'>
            <div className='text-gray-500'>
                Trigger conditions were{' '}
                <span className={`font-bold ${result.type === 'ConditionMet' ? 'text-red-500' : ''}`}>
                    {result.type === 'ConditionMet' ? 'met' : 'not met'}
                </span>
            </div>
            <div className='text-gray-500'>
                Evaluated value: {evaluatedValueDisplay(result.evaluatedValue, triggerType)}
            </div>
            <div className='text-gray-500'>Threshold: {thresholdDisplay(result.threshold, triggerType)}</div>
        </div>
    );
}

function thresholdDisplay(threshold: number, triggerType: Subscription['trigger']['type']) {
    if (triggerType === 'count') {
        return threshold;
    }

    return proportionAsPercent(threshold);
}

function evaluatedValueDisplay(evaluatedValue: number, triggerType: Subscription['trigger']['type']) {
    if (triggerType === 'count') {
        return evaluatedValue;
    }

    const lowerBound = 0.001;
    if (evaluatedValue < lowerBound) {
        return `<${proportionAsPercent(lowerBound)}`;
    }

    const precision = 3;
    return `${(evaluatedValue * 100).toFixed(precision)}%`;
}

function TriggerDisplay({ trigger }: { trigger: Subscription['trigger'] }) {
    const className = 'col-span-1 sm:col-span-2 md:col-span-3';

    if (trigger.type === 'count') {
        return (
            <SubscriptionContent className={className}>
                <CountTriggerDisplay trigger={trigger} />
            </SubscriptionContent>
        );
    }

    return (
        <SubscriptionContent className={className}>
            <ProportionTriggerDisplay trigger={trigger} />
        </SubscriptionContent>
    );
}

function ProportionTriggerDisplay({ trigger }: { trigger: ProportionTrigger }) {
    return (
        <div className='flex flex-col gap-2'>
            <div className='font-bold text-gray-500'>
                Proportion {'>'} {proportionAsPercent(trigger.proportion)}
            </div>
            <div className='flex flex-1 flex-wrap gap-4'>
                <div className='flex-1'>
                    <div className='text-gray-500'>Variant</div>
                    <FilterTable filter={trigger.numeratorFilter} />
                </div>
                <div className='flex-1'>
                    <div className='text-gray-500'>Baseline</div>
                    <FilterTable filter={trigger.denominatorFilter} />
                </div>
            </div>
        </div>
    );
}

function CountTriggerDisplay({ trigger }: { trigger: CountTrigger }) {
    return (
        <div className='flex flex-col gap-2'>
            <div className='font-bold text-gray-500'>
                Count {'>'} {trigger.count}
            </div>
            <div>
                <div className='text-gray-500'>Variant</div>
                <FilterTable filter={trigger.filter} />
            </div>
        </div>
    );
}

function FilterTable({ filter }: { filter: LapisFilter }) {
    return (
        <table className='table max-w-lg text-gray-500'>
            <tbody>
                {Object.entries(filter).map(([key, value]) => (
                    <tr key={key}>
                        <td>{key}</td>
                        <td>{value}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// TODO: Enable notificationChannels in #82, #128
// function NotificationChannelDisplay({
//     notificationChannels,
//     active,
// }: {
//     notificationChannels: NotificationChannels;
//     active: boolean;
// }) {
//     return (
//         <SubscriptionContent className='col-span-1 sm:col-span-2 md:col-span-3'>
//             <div className={'mb-6'}>
//                 <NotificationsDescription active={active} />
//             </div>
//             <div className='flex flex-wrap gap-2'>
//                 <div className='min-w-64 flex-1'>
//                     <SlackChannelsDisplay slackChannels={notificationChannels.slack} />
//                 </div>
//                 <div className='min-w-64 flex-1'>
//                     <EmailChannelsDisplay emailChannels={notificationChannels.email} />
//                 </div>
//             </div>
//         </SubscriptionContent>
//     );
// }
//
// function NotificationsDescription({ active }: { active: boolean }) {
//     return (
//         <>
//             <div className={'flex items-center gap-2'}>
//                 <div className={`iconify ${getIsActiveIcon(active)}`}></div>
//                 <div className={'font-bold text-gray-500'}>Notifications {active ? 'enabled' : 'disabled'}</div>
//             </div>
//             <div className={'text-gray-500'}>
//                 {active
//                     ? 'You receive notifications from this subscription. Disable it to stop receiving notifications.'
//                     : 'You do not receive any notifications from this subscription. Enable it to receive notifications.'}
//             </div>
//         </>
//     );
// }
//
// function SlackChannelsDisplay({ slackChannels }: { slackChannels: NotificationChannels['slack'] }) {
//     return (
//         <div className='flex flex-col gap-2'>
//             <div className='font-bold text-gray-500'>Slack</div>
//             <div className='flex flex-col gap-2'>
//                 {slackChannels.map((channel) => (
//                     <div className='flex items-center gap-2 text-gray-400' key={channel.id}>
//                         <div className='iconify mdi--slack'></div>
//                         <div>{channel.name}</div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }
//
// function EmailChannelsDisplay({ emailChannels }: { emailChannels: NotificationChannels['email'] }) {
//     return (
//         <div className='flex flex-col gap-2'>
//             <div className='font-bold text-gray-500'>Email</div>
//             <div className='flex flex-col gap-2'>
//                 {emailChannels.map((channel) => (
//                     <div className='flex items-center gap-2 text-gray-400' key={channel.id}>
//                         <div className='iconify mdi--email'></div>
//                         <div>{channel.name}</div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }
