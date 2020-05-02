import { useEffect, useState } from 'react'

import { createSignaling } from '../services/firestore'
import {
    createBlobReceiver,
    createPeerConnection,
    Metadata,
} from '../services/webrtc'

type Status = 'ready' | 'checking' | 'downloading' | 'downloaded'
type Progress = {
    loaded: number
    total: number
}

export const useRTCBlobReceiver = (
    id: string,
): {
    status: Status
    progress?: Progress
    blob?: Blob
    metadata?: Metadata
} => {
    const [metadata, setMetadata] = useState<Metadata>()
    const [blob, setBlob] = useState<Blob>()
    const [status, setStatus] = useState<Status>('ready')
    const [progress, setProgress] = useState<Progress>()

    useEffect(() => {
        const receive = async (id: string): Promise<void> => {
            setStatus('checking')

            const signaling = await createSignaling({ id })

            const peerConnection = createPeerConnection(signaling, false)

            const blobReceiver = createBlobReceiver(peerConnection)

            blobReceiver.once('start', () => setStatus('downloading'))

            blobReceiver.once('metadata', setMetadata)

            blobReceiver.on('progress', setProgress)

            blobReceiver.on('blob', setBlob)

            blobReceiver.once('end', () => setStatus('downloaded'))
        }

        receive(id)

        return (): void => {
            // FIXME: release signaling resources and cleanup listeners
        }
    }, [id])

    return { status, progress, blob, metadata }
}
