import { useRef } from 'react';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import { PageContainer } from '../../../styles/containers/PageContainer.tsx';
import { BorderedCard } from '../../../styles/containers/BorderedCard.tsx';
import { CardContent } from '../../../styles/containers/CardContent.tsx';
import { CardHeader } from '../../../styles/containers/CardHeader.tsx';
import { CardDescription } from '../../../styles/containers/CardDescription.tsx';
import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import { ModalBox } from '../../../styles/containers/ModalBox.tsx';
import { ModalHeader } from '../../../styles/containers/ModalHeader.tsx';
import { ModalContent } from '../../../styles/containers/ModalContent.tsx';
import { DividerList } from '../../../styles/containers/DividerList.tsx';
import type { EmailChannel, NotificationChannels, SlackChannel } from '../../../types/NotificationChannels.ts';

export function NotificationChannelDisplay({ notificationChannels }: { notificationChannels: NotificationChannels }) {
    return (
        <PageContainer>
            <PageHeadline>Notification channels</PageHeadline>

            <div className='flex flex-col gap-4'>
                <BorderedCard>
                    <CardHeader>
                        <CardDescription
                            title={'Email'}
                            subtitle={'Send messages to email addresses'}
                            icon={'mdi--email'}
                        />
                        <AddEmailButton />
                    </CardHeader>
                    <CardContent>
                        <EmailChannels channels={notificationChannels.email} />
                    </CardContent>
                </BorderedCard>

                <BorderedCard>
                    <CardHeader>
                        <CardDescription
                            title={'Slack'}
                            subtitle={'Send messages to slack channels'}
                            icon={'mdi--slack'}
                        />
                        <CardContent>
                            <AddSlackButton />
                        </CardContent>
                    </CardHeader>
                    <CardContent>
                        <SlackChannels channels={notificationChannels.slack} />
                    </CardContent>
                </BorderedCard>
            </div>
        </PageContainer>
    );
}

function EmailChannels({ channels }: { channels: EmailChannel[] | undefined }) {
    if (!channels) {
        return <></>;
    }

    return (
        <DividerList>
            {channels.map((channel) => (
                <EmailEntry key={channel.name} channel={channel} />
            ))}
        </DividerList>
    );
}

function EmailEntry({ channel }: { channel: EmailChannel }) {
    return (
        <div className='flex gap-2'>
            <div className='flex flex-1 flex-col sm:flex-row sm:items-center sm:gap-2'>
                <div className='flex-1'>{channel.name}</div>
                <div className='flex-1'>{channel.address}</div>
            </div>
            <div className='flex gap-2'>
                <EditEntry />
                <DeleteEntry />
            </div>
        </div>
    );
}

function AddEmailButton() {
    const addMailDialog = useRef<HTMLDialogElement>(null);

    const toggleDialog = () => {
        addMailDialog.current?.showModal();
    };

    return (
        <>
            <button className='btn btn-primary btn-sm' onClick={toggleDialog}>
                + Add
            </button>
            <dialog className='modal' ref={addMailDialog}>
                <ModalBox>
                    <ModalHeader title={'Add Email'} icon={'mdi--email'} />

                    <ModalContent>
                        <InputLabel
                            title={'Email address'}
                            description={'You can provide the email address where you want to send the messages.'}
                        >
                            <input className='input input-sm input-bordered w-full' placeholder='test@mailbox.org' />
                        </InputLabel>

                        <div className='divider'></div>

                        <InputLabel
                            title={'Name'}
                            description={'You can provide a custom name for your email to find it later on.'}
                        >
                            <input className='input input-sm input-bordered w-full' placeholder='Name' />
                        </InputLabel>

                        <div className='divider'></div>

                        <div className='modal-action'>
                            <form method='dialog'>
                                <button className={'btn btn-outline float-right w-24'}>Discard</button>
                            </form>
                            <form method='dialog'>
                                <button className={'btn btn-primary float-right w-24 underline'}>Add</button>
                            </form>
                        </div>
                    </ModalContent>
                </ModalBox>
            </dialog>
        </>
    );
}

function SlackChannels({ channels }: { channels: SlackChannel[] | undefined }) {
    if (!channels) {
        return <></>;
    }

    return (
        <DividerList>
            {channels.map((channel) => (
                <SlackEntry key={channel.name} channel={channel} />
            ))}
        </DividerList>
    );
}

function SlackEntry({ channel }: { channel: SlackChannel }) {
    return (
        <div className='flex items-center gap-2'>
            <div className='min-w-32 flex-1 truncate'>{channel.name}</div>
            <div>
                <EditEntry />
                <DeleteEntry />
            </div>
        </div>
    );
}

function AddSlackButton() {
    const addSlackDialog = useRef<HTMLDialogElement>(null);

    const toggleDialog = () => {
        addSlackDialog.current?.showModal();
    };

    return (
        <>
            <button className='btn btn-primary btn-sm' onClick={toggleDialog}>
                + Add
            </button>
            <dialog className='modal' ref={addSlackDialog}>
                <ModalBox>
                    <ModalHeader title={'Add Slack channel'} icon={'mdi--slack'} />

                    <ModalContent>
                        <InputLabel
                            title={'Slack webhook URL'}
                            description={
                                'You can get the Slack Incoming Webhook URL in the Slack settings:\nChannel Settings > Add an App > Incoming WebHooks.'
                            }
                        >
                            <input
                                className='input input-sm input-bordered w-full'
                                placeholder='https://hooks.slack.com/services/...'
                            />
                        </InputLabel>

                        <div className='divider'></div>

                        <InputLabel
                            title={'Name of channel'}
                            description={'You can provide a custom name for your channel to find it later on.'}
                        >
                            <input className='input input-sm input-bordered w-full' placeholder='Name' />
                        </InputLabel>

                        <div className='divider'></div>

                        <div className='modal-action'>
                            <form method='dialog'>
                                <button className={'btn btn-outline float-right w-24'}>Discard</button>
                            </form>
                            <form method='dialog'>
                                <button className={'btn btn-primary float-right w-24 underline'}>Add</button>
                            </form>
                        </div>
                    </ModalContent>
                </ModalBox>
            </dialog>
        </>
    );
}

function EditEntry() {
    return (
        <button className='btn btn-sm'>
            <div className='tooltip' data-tip={'Edit channel'}>
                <div className='iconify mdi--pencil' />
            </div>
        </button>
    );
}

function DeleteEntry() {
    return (
        <button className='btn btn-ghost btn-sm'>
            <div className={'tooltip'} data-tip={'Delete channel'}>
                <div className='iconify mdi--trash-can-outline' />
            </div>
        </button>
    );
}
