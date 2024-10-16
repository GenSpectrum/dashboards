import '@genspectrum/dashboard-components';
import '@genspectrum/dashboard-components/style.css';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { FilterDisplay } from './FilterDisplay.tsx';
import { IntervalInput } from './IntervalInput.tsx';
import { NameInput } from './NameInput.tsx';
import { OrganismInput } from './OrganismInput.tsx';
import { TriggerInput } from './TriggerInput.tsx';
import type { DashboardsConfig } from '../../../config.ts';
import { BorderedCard } from '../../../styles/containers/BorderedCard.tsx';
import { CardContent } from '../../../styles/containers/CardContent.tsx';
import { CardDescription } from '../../../styles/containers/CardDescription.tsx';
import { CardHeader } from '../../../styles/containers/CardHeader.tsx';
import { PageContainer } from '../../../styles/containers/PageContainer.tsx';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import { type DateWindow, DateWindows } from '../../../types/DateWindow.ts';
import { type EvaluationInterval, EvaluationIntervals } from '../../../types/EvaluationInterval.ts';
import { type Organism, Organisms } from '../../../types/Organism.ts';
import type { SubscriptionRequest, Trigger } from '../../../types/Subscription.ts';
import { GsApp } from '../../genspectrum/GsApp.tsx';
import { getBackendServiceForClientside } from '../backendApi/backendService.ts';
import { withQueryProvider } from '../backendApi/withQueryProvider.tsx';

export const SubscriptionsCreate = withQueryProvider(SubscriptionsCreateInner);

export function SubscriptionsCreateInner({
    config,
    userId,
    // TODO: Enable notificationChannels in #82, #128
    // notificationChannels,
}: {
    config: DashboardsConfig;
    userId: string;
    // TODO: Enable notificationChannels in #82, #128
    // notificationChannels: NotificationChannels;
}) {
    const createSubscription = useMutation({
        mutationFn: () =>
            getBackendServiceForClientside().postSubscription({
                subscription: getSubscription(),
                userId,
            }),
        onSuccess: () => {
            window.location.href = '/subscriptions';
        },
        onError: (error) => {
            // eslint-disable-next-line no-console -- TODO #203 properly log this
            console.error(error);
            // TODO: #205 Show error as banner
            window.location.href = '/500';
        },
    });

    const [trigger, setTrigger] = useState<Trigger>({
        type: 'count',
        count: 0,
        filter: {},
    });
    const [dateWindow, setDateWindow] = useState<DateWindow>(DateWindows.last6Months);
    const [name, setName] = useState<string>('');
    const [organism, setOrganism] = useState<Organism>(Organisms.covid);
    const [interval, setInterval] = useState<EvaluationInterval>(EvaluationIntervals.daily);
    // TODO: Enable notificationChannels in #82, #128
    // const [notificationChannelIds, setNotificationChannelIds] = useState<{ slack: string[]; email: string[] }>({
    //     slack: [],
    //     email: [],
    // });

    function getSubscription(): SubscriptionRequest {
        return {
            name,
            active: true,
            organism,
            trigger,
            dateWindow,
            interval,
            // TODO: Enable notificationChannels in #82, #128
            // notificationChannelIds,
        };
    }

    return (
        <PageContainer>
            <PageHeadline>Create new subscription</PageHeadline>

            <div className='flex flex-col gap-4'>
                <BorderedCard>
                    <CardHeader>
                        <CardDescription title='General' />
                    </CardHeader>

                    <CardContent>
                        <div className='flex flex-col gap-4'>
                            <NameInput onNameChange={setName} />
                            <IntervalInput onIntervalChange={setInterval} />
                            <OrganismInput onOrganismChange={setOrganism} />
                        </div>
                    </CardContent>
                </BorderedCard>

                {/* TODO: Enable notificationChannels in #82, #128 */}
                {/* <BorderedCard>*/}
                {/*    <CardHeader>*/}
                {/*        <CardDescription title={'Notification channels'} />*/}
                {/*        <a className='btn btn-primary btn-sm' href='/subscriptions/channels'>*/}
                {/*            Manage*/}
                {/*        </a>*/}
                {/*    </CardHeader>*/}
                {/*    <CardContent>*/}
                {/*        <div className='flex flex-col gap-8'>*/}
                {/*            <ChannelsInput*/}
                {/*                label='Slack'*/}
                {/*                channels={notificationChannels.slack}*/}
                {/*                onChannelsSelect={(slackChannelIds) => {*/}
                {/*                    setNotificationChannelIds((prevState) => {*/}
                {/*                        return { ...prevState, slack: slackChannelIds };*/}
                {/*                    });*/}
                {/*                }}*/}
                {/*            />*/}

                {/*            <ChannelsInput*/}
                {/*                label={'Email'}*/}
                {/*                channels={notificationChannels.email}*/}
                {/*                onChannelsSelect={(emailChannelIds) => {*/}
                {/*                    setNotificationChannelIds((prevState) => {*/}
                {/*                        return { ...prevState, email: emailChannelIds };*/}
                {/*                    });*/}
                {/*                }}*/}
                {/*            />*/}
                {/*        </div>*/}
                {/*    </CardContent>*/}
                {/* </BorderedCard>*/}

                <BorderedCard>
                    <CardHeader>
                        <CardDescription title='Filter' />
                    </CardHeader>
                    <CardContent>
                        <GsApp lapis={config.dashboards.organisms[organism].lapis.url}>
                            <div className='flex flex-col gap-8 md:flex-row'>
                                <TriggerInput onTriggerChange={setTrigger} onDateWindowChange={setDateWindow} />

                                <FilterDisplay
                                    subscription={getSubscription()}
                                    lapisDateField={config.dashboards.organisms[organism].lapis.mainDateField}
                                />
                            </div>
                        </GsApp>
                    </CardContent>
                </BorderedCard>
                <button className='btn btn-primary' onClick={() => createSubscription.mutate()}>
                    Create subscription
                </button>
            </div>
        </PageContainer>
    );
}
