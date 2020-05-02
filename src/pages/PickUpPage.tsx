import React from 'react'
import { useParams } from 'react-router-dom'

import { BlobDownloadLink } from '../components/BlobDownloadLink'
import { useDownload } from '../hooks/useDownload'
import { useRTCBlobReceiver } from '../hooks/useRTCBlobReceiver'
import CheckIcon from '../icons/check.svg'
import CycleIcon from '../icons/cycle.svg'

export const PickUpPage = () => {
    const { id } = useParams()

    const { status, blob, metadata } = useRTCBlobReceiver(id)

    useDownload(blob, metadata?.name)

    const fileName = metadata ? (
        <span className="font-bold">{metadata.name}</span>
    ) : null

    let content = null

    switch (status) {
        case 'ready':
        case 'checking':
            content = (
                <div>
                    Checking <span className="font-bold">{id}</span>
                </div>
            )
            break

        case 'downloading':
            content = (
                <>
                    <CycleIcon className="fill-current h-40 animation-spin" />
                    <div className="text-center">Downloading {fileName}</div>
                </>
            )
            break

        case 'downloaded':
            content = (
                <>
                    <CheckIcon className="fill-current h-40" />
                    <div className="mb-4 text-center">
                        Downloaded {fileName}
                    </div>
                    {blob && (
                        <BlobDownloadLink blob={blob} name={metadata!.name}>
                            Download
                        </BlobDownloadLink>
                    )}
                </>
            )
            break

        default:
            break
    }

    return (
        <div className="h-96 flex flex-col justify-center items-center">
            {content}
        </div>
    )
}
