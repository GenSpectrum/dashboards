import '@genspectrum/dashboard-components';
import '@genspectrum/dashboard-components/style.css';
import { useState } from 'react';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import { PageContainer } from '../../../styles/containers/PageContainer.tsx';
import { BorderedCard } from '../../../styles/containers/BorderedCard.tsx';
import { CardHeader } from '../../../styles/containers/CardHeader.tsx';
import { CardContent } from '../../../styles/containers/CardContent.tsx';
import { CardDescription } from '../../../styles/containers/CardDescription.tsx';
import { type Organism, Organisms } from '../../../routes/View.ts';
import { GsApp } from '../../genspectrum/GsApp.tsx';
import type { NotificationChannels } from '../../../types/NotificationChannels.ts';
import type { EvaluationInterval, SubscriptionRequest, Trigger } from '../../../types/Subscription.ts';
import { NameInput } from './NameInput.tsx';
import { IntervalInput } from './IntervalInput.tsx';
import { OrganismInput } from './OrganismInput.tsx';
import { ChannelsInput } from './ChannelsInput.tsx';
import { FilterDisplay } from './FilterDisplay.tsx';
import { TriggerInput } from './TriggerInput.tsx';
import { type DateWindow, DateWindows } from '../../../types/DateWindow.ts';
import type { DashboardsConfig } from '../../../config.ts';

const notificationChannels: NotificationChannels = {
    email: [
        {
            id: '1',
            address: 'test@test.test',
            name: 'A test email',
        },
        {
            id: '2',
            address: 'other@other.other',
            name: 'Another test email',
        },
    ],
    slack: [
        {
            id: '3',
            name: 'My slack channel',
            hook: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        },
        {
            id: '4',
            name: 'My other slack channel',
            hook: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        },
    ],
};

export function SubscriptionsCreate({ config }: { config: DashboardsConfig }) {
    const [trigger, setTrigger] = useState<Trigger>({
        type: 'count',
        count: 0,
        filter: {},
    });
    const [dateWindow, setDateWindow] = useState<DateWindow>(DateWindows.last6Months);
    const [name, setName] = useState<string>('');
    const [organism, setOrganism] = useState<Organism>(Organisms.covid);
    const [interval, setInterval] = useState<EvaluationInterval>('daily');
    const [notificationChannelIds, setNotificationChannelIds] = useState<{ slack: string[]; email: string[] }>({
        slack: [],
        email: [],
    });

    function getSubscription(): SubscriptionRequest {
        return {
            name,
            active: true,
            organism,
            trigger,
            dateWindow,
            interval,
            notificationChannelIds,
        };
    }

    return (
        <PageContainer>
            <PageHeadline>Create new subscription</PageHeadline>

            <div className='flex flex-col gap-4'>
                <BorderedCard>
                    <CardHeader>
                        <CardDescription title={'General'} />
                    </CardHeader>

                    <CardContent>
                        <div className='flex flex-col gap-4'>
                            <NameInput onNameChange={setName} />
                            <IntervalInput onIntervalChange={setInterval} />
                            <OrganismInput onOrganismChange={setOrganism} />
                        </div>
                    </CardContent>
                </BorderedCard>

                <BorderedCard>
                    <CardHeader>
                        <CardDescription title={'Notification channels'} />
                        <a className='btn btn-primary btn-sm' href='/subscriptions/channels'>
                            Manage
                        </a>
                    </CardHeader>
                    <CardContent>
                        <div className='flex flex-col gap-8'>
                            <ChannelsInput
                                label='Slack'
                                channels={notificationChannels.slack}
                                onChannelsSelect={(slackChannelIds) => {
                                    setNotificationChannelIds((prevState) => {
                                        return { ...prevState, slack: slackChannelIds };
                                    });
                                }}
                            />

                            <ChannelsInput
                                label={'Email'}
                                channels={notificationChannels.email}
                                onChannelsSelect={(emailChannelIds) => {
                                    setNotificationChannelIds((prevState) => {
                                        return { ...prevState, email: emailChannelIds };
                                    });
                                }}
                            />
                        </div>
                    </CardContent>
                </BorderedCard>

                <BorderedCard>
                    <CardHeader>
                        <CardDescription title={'Filter'} />
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
                <button
                    className='btn btn-primary'
                    onClick={() => {
                        console.log(getSubscription());
                    }}
                >
                    Create subscription
                </button>
            </div>
        </PageContainer>
    );
}
