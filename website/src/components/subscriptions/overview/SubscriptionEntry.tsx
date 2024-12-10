import { useMutation } from '@tanstack/react-query';
import { type JSX, type RefObject, useRef } from 'react';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

import { SubscriptionDisplay } from './SubscriptionDisplay.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { BorderedCard } from '../../../styles/containers/BorderedCard.tsx';
import { CardDescription } from '../../../styles/containers/CardDescription.tsx';
import { ModalBox } from '../../../styles/containers/ModalBox.tsx';
import { ModalContent } from '../../../styles/containers/ModalContent.tsx';
import { ModalHeader } from '../../../styles/containers/ModalHeader.tsx';
import { organismConfig } from '../../../types/Organism.ts';
import type { Subscription } from '../../../types/Subscription.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';
import { ErrorReportToastModal } from '../../ErrorReportInstruction.tsx';
import { getBackendServiceForClientside } from '../backendApi/backendService.ts';

const logger = getClientLogger('SubscriptionEntry');

export function SubscriptionEntry({
    subscription,
    userId,
    refetchSubscriptions,
}: {
    subscription: Subscription;
    userId: string;
    refetchSubscriptions: () => void;
}) {
    const getConditionIcon = () => {
        if (subscription.triggerEvaluationResult.type === 'ConditionMet') {
            return 'mdi--circle-slice-8 text-red-500';
        }

        return `mdi--circle-outline text-gray-500`;
    };

    const getIcon = () => {
        return (
            <div
                className='tooltip tooltip-right'
                data-tip={
                    subscription.triggerEvaluationResult.type === 'ConditionMet'
                        ? 'Trigger conditions were met'
                        : 'Trigger conditions were not met'
                }
            >
                <div className={`iconify size-8 ${getConditionIcon()}`} />
            </div>
        );
    };

    return (
        <BorderedCard>
            <div className='flex flex-row'>
                <details className='collapse collapse-arrow mr-4 overflow-visible'>
                    <summary className='collapse-title'>
                        <div className='flex items-center justify-between'>
                            <CardDescription
                                title={subscription.name}
                                subtitle={organismConfig[subscription.organism].label}
                                icon={getIcon()}
                            />
                            {/* TODO: Enable notificationChannels in #82, #128*/}
                            {/* <NotificationStatus active={subscription.active} />*/}
                        </div>
                    </summary>
                    <div className='collapse-content'>
                        <SubscriptionDisplay subscription={subscription} />
                    </div>
                </details>
                <MoreDropdown subscription={subscription} userId={userId} refetchSubscriptions={refetchSubscriptions} />
            </div>
        </BorderedCard>
    );
}

// TODO: Enable notificationChannels in #82, #128
// export const getIsActiveIcon = (active: boolean) => {
//     if (active) {
//         return 'mdi--bell-outline text-gray-500';
//     }
//
//     return 'mdi--bell-off-outline text-gray-500';
// };
//
// function NotificationStatus({ active }: { active: boolean }) {
//     return (
//         <div className={'flex items-center gap-2'}>
//             <div className={`iconify size-4 ${getIsActiveIcon(active)}`}></div>
//             <div className={'text-sm text-gray-500'}>Notifications {active ? 'enabled' : 'disabled'}</div>
//         </div>
//     );
// }

function MoreDropdown({
    subscription,
    userId,
    refetchSubscriptions,
}: {
    subscription: Subscription;
    userId: string;
    refetchSubscriptions: () => void;
}) {
    const deleteSubscription = useMutation({
        mutationFn: () =>
            getBackendServiceForClientside().deleteSubscription({
                subscriptionId: subscription.id,
                userId,
            }),
        onSuccess: () => {
            refetchSubscriptions();
            toast.success(`Subscription ${subscription.name} deleted`, {
                position: 'bottom-left',
                autoClose: 4000,
            });
        },
        onError: (error) => {
            const errorId = uuidv4();
            logger.error(`Failed to delete subscription with id '${subscription.id}': ${getErrorLogMessage(error)}`, {
                errorId,
            });
            toast.error(
                <>
                    <p className='mb-2'>
                        We could not delete your subscription "{subscription.name}". Please try again later.
                    </p>
                    <ErrorReportToastModal errorId={errorId} error={error} />
                </>,
                {
                    position: 'bottom-left',
                    autoClose: false,
                },
            );
        },
    });

    const deleteSubscriptionDialog = useRef<HTMLDialogElement>(null);

    const toggleConfirmDeletionDialog = () => {
        deleteSubscriptionDialog.current?.showModal();
        deleteSubscriptionDialog.current?.focus();
    };

    const handleDelete = () => {
        deleteSubscription.mutate();
    };

    // TODO: #171 Activate/Deactivate subscription
    // const activateSubscription = useMutation({
    //     mutationFn: () =>
    //         getBackendServiceForClientside().putSubscription({ active: !subscription.active }, userId, subscription.id),
    //     onSuccess: () => {
    //         refetchSubscriptions();
    //     },
    //     onError: (error) => {
    //         logger.error(`Failed to activate subscription "${subscription.name}": ${getErrorLogMessage(error)}`);
    //         // TODO: #205 Show error as banner
    //         window.location.href = '/500';
    //     },
    // });

    // TODO: #171 Activate/Deactivate subscription
    // const handleActivate = async () => {
    //     activateSubscription.mutate();
    // };
    return (
        <>
            <div className='dropdown dropdown-end'>
                <div tabIndex={0} role='button' className='btn btn-xs'>
                    ...
                </div>
                <ul tabIndex={0} className='menu dropdown-content z-[10] w-52 rounded-box bg-base-100 p-2 shadow'>
                    {/* TODO: #170 Page to edit subscription*/}
                    {/* <li>*/}
                    {/*    <EditButton />*/}
                    {/* </li>*/}
                    {/* TODO: #171 Activate/Deactivate subscription*/}
                    {/* <li>*/}
                    {/*    <ActivateButton isActive={subscription.active} onClick={handleActivate} />*/}
                    {/* </li>*/}
                    <li>
                        <DeleteButton onClick={toggleConfirmDeletionDialog} />
                    </li>
                </ul>
            </div>
            <ConfirmDeletionModal modalRef={deleteSubscriptionDialog} onDelete={handleDelete} />
        </>
    );
}

// TODO: #170 Page to edit subscription
// function EditButton() {
//     return (
//         <button
//             className='flex items-center gap-2'
//             onClick={() => console.error('Not implemented. Will be done by #170')}
//         >
//             <div className='iconify mdi--pencil'></div>
//             Edit
//         </button>
//     );
// }

// TODO: #171 Activate/Deactivate subscription
// function ActivateButton({
//     isActive,
//     onClick,
// }: {
//     isActive: boolean;
//     onClick: JSX.IntrinsicElements['button']['onClick'];
// }) {
//     return (
//         <button className='flex items-center gap-2' onClick={onClick}>
//             <div className={`iconify ${isActive ? 'mdi--pause' : 'mdi--play'}`}></div>
//             {isActive ? 'Disable notifications' : 'Enable notifications'}
//         </button>
//     );
// }

function DeleteButton({ onClick }: { onClick: JSX.IntrinsicElements['button']['onClick'] }) {
    return (
        <button className='flex items-center gap-2' onClick={onClick}>
            <div className='iconify mdi--delete'></div>
            Delete
        </button>
    );
}

function ConfirmDeletionModal({
    onDelete,
    modalRef,
}: {
    onDelete: JSX.IntrinsicElements['button']['onClick'];
    modalRef: RefObject<HTMLDialogElement>;
}) {
    return (
        <dialog className='modal' ref={modalRef}>
            <ModalBox>
                <ModalHeader title='Delete subscription' icon='mdi--delete' />
                <ModalContent>
                    <p>Are you sure you want to delete this subscription?</p>
                    <div className='divider' />
                    <div className='modal-action'>
                        <form method='dialog'>
                            <button
                                type='submit'
                                className='btn btn-outline float-right w-24'
                                onClick={() => modalRef.current?.close()}
                            >
                                Cancel
                            </button>
                        </form>
                        <form method='dialog'>
                            <button type='submit' className='btn btn-error float-right w-24' onClick={onDelete}>
                                Delete
                            </button>
                        </form>
                    </div>
                </ModalContent>
            </ModalBox>
            <form method='dialog' className='modal-backdrop'>
                <button>close on clicking outside of modal</button>
            </form>
        </dialog>
    );
}
