import React from 'react'

import { BlobShareLink } from '../components/BlobShareLink'
import { BrowseFile } from '../components/BrowseFiles'
import { useRTCBlobSender } from '../hooks/useRTCBlobSender'
import CheckIcon from '../icons/check.svg'
import CycleIcon from '../icons/cycle.svg'

export const DropPage = () => {
    const { useState } = React
    const [file, setFile] = useState<File>()

    const { id, status } = useRTCBlobSender(file)

    const fileName = file ? (
        <span className="font-bold">{file.name}</span>
    ) : null

    let content = null

    switch (status) {
        case 'ready':
            content = <BrowseFile onFileChange={setFile} />
            break

        case 'creating':
            content = (
                <div className="text-center">
                    Creating download link for {fileName}
                </div>
            )
            break

        case 'waiting':
            content = (
                <>
                    <div className="mb-4 text-center">
                        Waiting for connections to share {fileName}
                    </div>
                    {id && <BlobShareLink id={id} />}
                </>
            )
            break

        case 'uploading':
            content = (
                <>
                    <CycleIcon className="fill-current h-40 animation-spin" />
                    <div className="text-center">Sharing {fileName}</div>
                </>
            )
            break

        case 'uploaded':
            content = (
                <>
                    <CheckIcon className="fill-current h-40" />
                    <div className="text-center">Shared {fileName}</div>
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
