import { useEffect } from 'react'
import { download } from '../utils/download'

export const useDownload = (blob?: Blob, name?: string): void => {
    useEffect(() => {
        if (!blob || !name) {
            return
        }

        download(blob, name)
    }, [blob, name])
}
