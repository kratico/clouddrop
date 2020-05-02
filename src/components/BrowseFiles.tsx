import React, { useCallback, useRef } from 'react'

import UploadIcon from '../icons/upload.svg'

type Props = {
    onFileChange: (file: File) => void
}

export const BrowseFile = ({ onFileChange }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleInputOnChange = useCallback(() => {
        const file = fileInputRef.current?.files?.[0]

        if (!file) {
            return
        }

        onFileChange(file)
    }, [onFileChange])

    const handleBrowseFileOnClick = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const handleFormOnClick = useCallback((e: React.SyntheticEvent) => {
        e.stopPropagation()
    }, [])

    return (
        <div
            className="flex flex-col justify-center items-center h-full w-full border border-dashed border-gray-800 hover:bg-gray-300 rounded cursor-pointer"
            onClick={handleBrowseFileOnClick}
        >
            <UploadIcon className="fill-current h-40 mb-4" />
            <div onClick={handleFormOnClick}>
                <label htmlFor="file-upload" className="btn-primary">
                    Browse files
                </label>
                <input
                    id="file-upload"
                    className="hidden"
                    ref={fileInputRef}
                    type="file"
                    onChange={handleInputOnChange}
                    multiple={false}
                />
            </div>
        </div>
    )
}
