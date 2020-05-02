import React, { PropsWithChildren, useState, useEffect } from 'react'

type Props = PropsWithChildren<{
    blob: Blob
    name: string
}>

export const BlobDownloadLink = ({ blob, name, children }: Props) => {
    const [href, setHref] = useState<string>()

    useEffect(() => {
        const objectUrl = URL.createObjectURL(blob)
        setHref(objectUrl)
    }, [blob])

    return (
        <a href={href} download={name} className="btn-primary">
            {children}
        </a>
    )
}
