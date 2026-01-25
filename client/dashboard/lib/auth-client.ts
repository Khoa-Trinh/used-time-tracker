import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    // baseURL is retrieved from window.location.origin
})
