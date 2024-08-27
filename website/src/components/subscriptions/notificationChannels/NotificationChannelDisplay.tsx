import { useRef } from 'react';

export type SlackChannel = {
    name: string;
    hook: string;
};

export type EmailChannel = {
    address: string;
    name: string;
};

export interface NotificationChannels {
    email?: EmailChannel[];
    slack?: SlackChannel[];
}

export function NotificationChannelDisplay({ notificationChannels }: { notificationChannels: NotificationChannels }) {
    return (
        <div className='container mx-auto min-w-72'>
            <div className='mt-4 flex h-12 w-full place-content-between items-center rounded px-2'>
                <h2 className='text-xl font-bold'>Notification channels</h2>
            </div>

            <div className='min-w- mt-4 flex flex-col gap-4'>
                <div className='bordered flex flex-col gap-8 rounded-xl border-2 border-gray-200 p-4'>
                    <div className='flex place-content-between items-center'>
                        <div className='flex items-center gap-2'>
                            <div className='iconify size-12 mdi--email'></div>
                            <div className='flex flex-col'>
                                <span className='font-bold'>Email</span>
                                <span className='text-gray-400'>Send messages to email addresses</span>
                            </div>
                        </div>
                        <AddEmail />
                    </div>
                    <EmailChannels channels={notificationChannels.email} />
                </div>

                <div className='bordered flex flex-col gap-8 rounded-xl border-2 border-gray-200 p-4'>
                    <div className='flex place-content-between items-center'>
                        <div className='flex items-center gap-2'>
                            <div className='iconify size-12 mdi--slack'></div>
                            <div className='flex flex-col'>
                                <span className='font-bold'>Slack</span>
                                <span className='text-gray-400'>Send messages to slack channels</span>
                            </div>
                        </div>
                        <AddSlack />
                    </div>
                    <SlackChannels channels={notificationChannels.slack} />
                </div>
            </div>
        </div>
    );
}

function EmailChannels({ channels }: { channels: EmailChannel[] | undefined }) {
    if (!channels) {
        return <></>;
    }

    return (
        <div>
            {channels.map((channel, index) => (
                <>
                    <EmailEntry key={channel.name} channel={channel} />
                    {index < channels.length - 1 && <hr className='my-4 border-gray-200' />}
                </>
            ))}
        </div>
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

function AddEmail() {
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
                <div className='modal-box p-0'>
                    <div className='flex flex-col items-center gap-2 bg-gray-200 p-6'>
                        <div className='iconify size-12 mdi--email'></div>
                        <h2 className='text-lg font-bold'>Add Email</h2>
                    </div>

                    <div className='p-6'>
                        <div>
                            <h3 className='mb-2'>Email address</h3>
                            <p className='mb-2 text-sm text-gray-400'>
                                You can provide the email address where you want to send the messages.
                            </p>
                            <label className='w-full'>
                                <input
                                    className='input input-sm input-bordered w-full'
                                    placeholder='test@mailbox.org'
                                />
                            </label>
                        </div>

                        <div className='divider'></div>

                        <div>
                            <h3 className='mb-2'>Name</h3>
                            <p className='mb-2 text-sm text-gray-400'>
                                You can provide a custom name for your email to find it later on.
                            </p>
                            <label className='w-full'>
                                <input className='input input-sm input-bordered w-full' placeholder='Name' />
                            </label>
                        </div>

                        <div className='divider'></div>

                        <div className='modal-action'>
                            <form method='dialog'>
                                <button className={'btn btn-outline float-right w-24'}>Discard</button>
                            </form>
                            <form method='dialog'>
                                <button className={'btn btn-primary float-right w-24 underline'}>Add</button>
                            </form>
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    );
}

function SlackChannels({ channels }: { channels: SlackChannel[] | undefined }) {
    if (!channels) {
        return <></>;
    }

    return (
        <div>
            {channels.map((channel, index) => (
                <>
                    <SlackEntry key={channel.name} channel={channel} />
                    {index < channels.length - 1 && <hr className='my-4 border-gray-200' />}
                </>
            ))}
        </div>
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

function AddSlack() {
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
                <div className='modal-box p-0'>
                    <div className='flex flex-col items-center gap-2 bg-gray-200 p-6'>
                        <div className='iconify size-12 mdi--slack'></div>
                        <h2 className='text-lg font-bold'>Add Slack channel</h2>
                    </div>

                    <div className='p-6'>
                        <div>
                            <h3 className='mb-2'>Slack webhook URL</h3>
                            <p className='mb-2 text-sm text-gray-400'>
                                You can get the Slack Incoming Webhook URL in the Slack settings{' '}
                                <span>
                                    Channel Settings {'>'} Add an App {'>'} Incoming WebHooks.
                                </span>
                            </p>
                            <label className='w-full'>
                                <input
                                    className='input input-sm input-bordered w-full'
                                    placeholder='https://hooks.slack.com/services/...'
                                />
                            </label>
                        </div>

                        <div className='divider'></div>

                        <div>
                            <h3 className='mb-2'>Name of channel</h3>
                            <p className='mb-2 text-sm text-gray-400'>
                                You can provide a custom name for your channel to find it later on.
                            </p>
                            <label className='w-full'>
                                <input className='input input-sm input-bordered w-full' placeholder='Name' />
                            </label>
                        </div>

                        <div className='divider'></div>

                        <div className='modal-action'>
                            <form method='dialog'>
                                <button className={'btn btn-outline float-right w-24'}>Discard</button>
                                {/*TODO: Are you sure you want to discard message.*/}
                            </form>
                            <form method='dialog'>
                                <button className={'btn btn-primary float-right w-24 underline'}>Add</button>
                            </form>
                        </div>
                    </div>
                </div>
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
