import 'firebase/firestore'

import firebase from 'firebase/app'

import { Metadata, Signaling } from './webrtc'

const firebaseConfig = {
    apiKey: 'AIzaSyAqEDJ7dgj_Dezbg-_xsVhXmsCksyP4pys',
    authDomain: 'cloud-drop-4aa6b.firebaseapp.com',
    databaseURL: 'https://cloud-drop-4aa6b.firebaseio.com',
    projectId: 'cloud-drop-4aa6b',
    storageBucket: 'cloud-drop-4aa6b.appspot.com',
    messagingSenderId: '1018344013976',
    appId: '1:1018344013976:web:9f88a1997b59634a0c10ed',
    measurementId: 'G-CZL2J8P0TD',
}

// FIXME: use hook based initialization
// https://github.com/twilio/twilio-video-app-react/blob/master/src/state/useFirebaseAuth/useFirebaseAuth.ts#L32
firebase.initializeApp(firebaseConfig)

const firestore = firebase.firestore()

export const createSignaling = async (options: {
    id?: string
    metadata?: Metadata
}): Promise<Signaling> => {
    let docRef: firebase.firestore.DocumentReference

    if (options.id) {
        docRef = firestore.doc(`drops/${options.id}`)
    } else if (options.metadata) {
        docRef = await firestore.collection('drops').add(options.metadata)
    } else {
        throw new Error('options should have id or metadata')
    }

    const initiator = !options.id

    const id = docRef.id
    const localRole = initiator ? 'caller' : 'callee'
    const remoteRole = initiator ? 'callee' : 'caller'
    const localEvents = docRef.collection(`${localRole}-events`)
    const remoteEvents = docRef.collection(`${remoteRole}-events`)

    let counter = 0

    const on = (listener: (data: any) => void): (() => void) =>
        remoteEvents.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((docChange) => {
                listener(docChange.doc.data())
            })
        })

    const send = (data: any): void => {
        localEvents.doc(`${counter++}`).set(data)
    }

    return {
        id,
        on,
        send,
    }
}
