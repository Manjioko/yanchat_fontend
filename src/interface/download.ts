interface UploadCallback {
    (error: Error | null, progress: number | null, response: string | null): void
}

export {
    UploadCallback
}