import { EventEmitter } from 'events'

const MESSAGE_MAXIMUM_SIZE = 16 * 1024
const MESSAGE_END_OF_FILE = 'EOF'
const BUFFERED_AMOUNT_CHECK_INTERVAL = 100
const BUFFERED_AMOUNT_THRESHOLD = 1000 * MESSAGE_MAXIMUM_SIZE
const DEFAULT_RTC_CONFIGURATION = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302',
                'stun:global.stun.twilio.com:3478',
                'stun:stun.ekiga.net',
                'stun:stun.ideasip.com',
                'stun:stun.schlund.de',
                'stun:stun.stunprotocol.org:3478',
                'stun:stun.voiparound.com',
                'stun:stun.voipbuster.com',
                'stun:stun.voipstunt.com',
                'stun:stun.voxgratia.org',
            ],
        },
    ],
}

export interface Metadata {
    name: string
    type: string
    size: number
}

export interface Signaling {
    id: string
    on: (listener: (data: any) => void) => () => void
    send: (data: any) => void
}

export const createPeerConnection = (
    signaling: Signaling,
    polite: boolean,
    configuration?: RTCConfiguration,
): RTCPeerConnection => {
    const pc = new RTCPeerConnection(configuration || DEFAULT_RTC_CONFIGURATION)

    pc.onicecandidate = (e): void => {
        if (!e.candidate) {
            return
        }

        signaling.send({ candidate: e.candidate.toJSON() })
    }

    let makingOffer = false,
        ignoreOffer = false

    pc.onnegotiationneeded = async (): Promise<void> => {
        try {
            makingOffer = true
            const offer = await pc.createOffer()
            if (pc.signalingState !== 'stable') return
            await pc.setLocalDescription(offer)
            signaling.send({ description: pc.localDescription?.toJSON() })
        } catch (e) {
            console.error(e)
        } finally {
            makingOffer = false
        }
    }

    signaling.on(async ({ description, candidate }) => {
        try {
            if (description) {
                const offerCollision =
                    description.type === 'offer' &&
                    (makingOffer || pc.signalingState != 'stable')

                ignoreOffer = !polite && offerCollision

                if (ignoreOffer) {
                    return
                }

                if (offerCollision) {
                    await Promise.all([
                        pc.setLocalDescription({ type: 'rollback' }),
                        pc.setRemoteDescription(description),
                    ])
                } else {
                    await pc.setRemoteDescription(description)
                }

                if (description.type == 'offer') {
                    await pc.setLocalDescription(await pc.createAnswer())
                    signaling.send({
                        description: pc.localDescription?.toJSON(),
                    })
                }
            } else if (candidate) {
                try {
                    await pc.addIceCandidate(candidate)
                } catch (e) {
                    if (!ignoreOffer) {
                        console.error(e)
                    }
                }
            }
        } catch (e) {
            console.error(e)
        }
    })

    return pc
}

export const createBlobSender = (
    peerConnection: RTCPeerConnection,
    metadata: Metadata,
    blob: Blob,
): EventEmitter => {
    const ee = new EventEmitter()

    const channel = peerConnection.createDataChannel('data')

    channel.binaryType = 'arraybuffer'

    channel.onopen = (): void => {
        const reader = new FileReader()

        reader.onload = async (): Promise<void> => {
            ee.emit('start')

            try {
                channel.send(JSON.stringify(metadata))
            } catch (error) {
                ee.emit('error', error)
            }

            const arrayBuffer = reader.result as ArrayBuffer

            for (
                let i = 0;
                i < arrayBuffer.byteLength;
                i += MESSAGE_MAXIMUM_SIZE
            ) {
                const chunk = arrayBuffer.slice(i, i + MESSAGE_MAXIMUM_SIZE)

                while (channel.bufferedAmount > BUFFERED_AMOUNT_THRESHOLD) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, BUFFERED_AMOUNT_CHECK_INTERVAL),
                    )
                }

                try {
                    channel.send(chunk)
                } catch (error) {
                    ee.emit('error', error)
                }

                ee.emit('progress', {
                    loaded: i + chunk.byteLength,
                    total: arrayBuffer.byteLength,
                })
            }

            try {
                channel.send(MESSAGE_END_OF_FILE)
            } catch (error) {
                ee.emit('error', error)
            }

            ee.emit('end')
        }

        reader.readAsArrayBuffer(blob)
    }

    return ee
}

export const createBlobReceiver = (
    peerConnection: RTCPeerConnection,
): EventEmitter => {
    const ee = new EventEmitter()

    peerConnection.ondatachannel = (e): void => {
        ee.emit('start')

        const channel = e.channel

        channel.binaryType = 'arraybuffer'

        let metadata: Metadata

        const receivedBuffers: ArrayBuffer[] = []

        let loaded = 0

        channel.onmessage = (e): void => {
            // first message is metadata
            if (!metadata) {
                metadata = JSON.parse(e.data)

                ee.emit('metadata', metadata)

                return
            }

            if (e.data !== MESSAGE_END_OF_FILE) {
                const arrayBuffer = e.data as ArrayBuffer

                receivedBuffers.push(arrayBuffer)

                loaded += arrayBuffer.byteLength
                ee.emit('progress', { loaded, total: metadata.size })

                return
            }

            const blob = new Blob(receivedBuffers, { type: metadata.type })

            ee.emit('blob', blob)

            // Safari does not support .close()
            if (channel.close) {
                channel.close()
            }

            ee.emit('end')
        }
    }

    return ee
}

export const sendBlob = (
    peerConnection: RTCPeerConnection,
    metadata: Metadata,
    blob: Blob,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const blobSender = createBlobSender(peerConnection, metadata, blob)

        blobSender.on('error', reject)
        blobSender.once('end', resolve)
    })
}

export const receiveBlob = (
    peerConnection: RTCPeerConnection,
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const blobReceiver = createBlobReceiver(peerConnection)

        blobReceiver.on('error', reject)
        blobReceiver.once('blob', resolve)
    })
}
