import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { BackendError, getBackendServiceForClientside } from '../../backendApi/backendService.ts';
import { withQueryProvider } from '../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../clientLogger.ts';
import { PageHeadline } from '../../styles/containers/PageHeadline.tsx';
import { getErrorLogMessage } from '../../util/getErrorLogMessage.ts';

const logger = getClientLogger('ApiKeyManager');

export const ApiKeyManager = withQueryProvider(ApiKeyManagerInner);

function ApiKeyManagerInner() {
    const queryClient = useQueryClient();
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    const {
        data: metadata,
        isLoading,
        isError: fetchError,
    } = useQuery({
        queryKey: ['api-key'],
        queryFn: async () => {
            try {
                return await getBackendServiceForClientside().getApiKey();
            } catch (error) {
                // 404 means no key exists — treat as null rather than an error
                if (error instanceof BackendError && error.status === 404) {
                    return null;
                }
                throw error;
            }
        },
    });

    const generateMutation = useMutation({
        mutationFn: () => getBackendServiceForClientside().generateApiKey(),
        onSuccess: (data) => {
            setGeneratedKey(data.key);
            void queryClient.invalidateQueries({ queryKey: ['api-key'] });
        },
        onError: (error) => {
            logger.error(`Failed to generate API key: ${getErrorLogMessage(error)}`);
        },
    });

    const revokeMutation = useMutation({
        mutationFn: () => getBackendServiceForClientside().revokeApiKey(),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['api-key'] });
        },
        onError: (error) => {
            logger.error(`Failed to revoke API key: ${getErrorLogMessage(error)}`);
        },
    });

    return (
        <div>
            <PageHeadline>API Key</PageHeadline>
            <p className='mb-4 text-sm text-gray-600'>
                Use an API key to authenticate programmatic access to the collections API without a browser session.
                Include it as an <code>Authorization: Bearer &lt;key&gt;</code> header in your requests.
            </p>

            {isLoading && <p>Loading...</p>}

            {fetchError && <p className='text-red-600'>Failed to load API key status.</p>}

            {generatedKey !== null ? (
                <div>
                    <p className='mb-2 text-sm font-medium text-amber-600'>
                        Copy this key now — it will not be shown again.
                    </p>
                    <div className='mb-4 flex w-fit items-center gap-3 rounded bg-gray-100 p-3 text-sm'>
                        <code data-testid='generated-api-key'>{generatedKey}</code>
                        <button
                            className='btn btn-xs shrink-0'
                            onClick={() => void navigator.clipboard.writeText(generatedKey)}
                        >
                            Copy
                        </button>
                    </div>
                    <button className='btn btn-primary btn-sm' onClick={() => setGeneratedKey(null)}>
                        Done
                    </button>
                </div>
            ) : (
                !isLoading &&
                !fetchError &&
                metadata !== undefined && (
                    <>
                        {metadata === null ? (
                            <div>
                                <p className='mb-3 text-sm'>You don&apos;t have an API key yet.</p>
                                <button
                                    className='btn btn-primary'
                                    onClick={() => generateMutation.mutate()}
                                    disabled={generateMutation.isPending}
                                >
                                    {generateMutation.isPending ? 'Generating…' : 'Generate API key'}
                                </button>
                                {generateMutation.isError && (
                                    <p className='mt-2 text-sm text-red-600'>
                                        Failed to generate key. Please try again.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <table className='mb-4 text-sm'>
                                    <tbody>
                                        <tr>
                                            <td className='pr-4 font-medium'>Created</td>
                                            <td>{new Date(metadata.createdAt).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td className='pr-4 font-medium'>Last used</td>
                                            <td>
                                                {metadata.lastUsedAt
                                                    ? new Date(metadata.lastUsedAt).toLocaleString()
                                                    : 'Never'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <button
                                    className='btn btn-error btn-sm'
                                    onClick={() => {
                                        if (confirm('Revoke your API key? This cannot be undone.')) {
                                            revokeMutation.mutate();
                                        }
                                    }}
                                    disabled={revokeMutation.isPending}
                                >
                                    {revokeMutation.isPending ? 'Revoking…' : 'Revoke key'}
                                </button>
                                {revokeMutation.isError && (
                                    <p className='mt-2 text-sm text-red-600'>Failed to revoke key. Please try again.</p>
                                )}
                            </div>
                        )}
                    </>
                )
            )}
        </div>
    );
}
