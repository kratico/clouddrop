export const download = (blob: Blob, name: string): void => {
    const a = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)

    a.href = objectUrl
    a.download = name
    a.click()

    // Set a 1s timeout because when the resources are released too soon then
    // iOS Safari and Chrome error with "WebKitBlobResource error 1"
    setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
        a.remove()
    }, 1000)
}
