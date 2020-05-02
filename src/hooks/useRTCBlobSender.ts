import { useEffect, useState } from 'react'

import { createSignaling } from '../services/firestore'
import { createBlobSender, createPeerConnection } from '../services/webrtc'

type Status = 'ready' | 'creating' | 'waiting' | 'uploading' | 'uploaded'
type Progress = {
    loaded: number
    total: number
}

export const useRTCBlobSender = (
    file?: File,
): { status: Status; progress?: Progress; id?: string } => {
    const [status, setStatus] = useState<Status>('ready')
    const [id, setId] = useState<string>()
    const [progress, setProgress] = useState<Progress>()

    useEffect(() => {
        if (!file) {
            return
        }

        const send = async (file: File): Promise<void> => {
            setStatus('creating')

            const metadata = {
                name: file.name,
                type: file.type,
                size: file.size,
            }

            const signaling = await createSignaling({
                metadata,
            })

            setStatus('waiting')

            setId(signaling.id)

            const peerConnection = createPeerConnection(signaling, true)

            const blobSender = createBlobSender(peerConnection, metadata, file)

            blobSender.on('start', () => setStatus('uploading'))

            blobSender.on('progress', setProgress)

            blobSender.once('end', () => setStatus('uploaded'))
        }

        send(file)

        return (): void => {
            // FIXME: release signaling resources and cleanup listeners
        }
    }, [file])

    return { status, progress, id }
}
