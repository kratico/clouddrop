import React from 'react'
import useClipboard from 'react-use-clipboard'

type Props = {
    id: string
}

export const BlobShareLink = ({ id }: Props) => {
    const uploadLink = `${location.origin}/pickup/${id}`

    const [isCopied, setCopied] = useClipboard(uploadLink)

    return (
        <div className="w-full" onClick={setCopied}>
            <div className="mb-4 break-words text-center text-gray-800 font-bold hover:text-gray-700 cursor-pointer">
                {uploadLink}
            </div>

            <div className="text-center">
                <span className="btn-primary">
                    {isCopied ? 'Copied!' : 'Copy'}
                </span>
            </div>
        </div>
    )
}
