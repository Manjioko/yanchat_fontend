import { Pinia, getActivePinia, Store } from "pinia"

interface ExtendedPinia extends Pinia {
    _s: Map<string, Store>
}
export const ResetPinia = (): Record<string | "all", () => void> => {
    const pinia = getActivePinia() as ExtendedPinia

    if (!pinia) {
        throw new Error("There is no stores")
    }

    const resetStores: Record<string, () => void> = {}

    pinia._s.forEach((store, name) => {
        resetStores[name] = () => store.$reset()
    })

    resetStores.all = () => pinia._s.forEach((store) => store.$reset())
    return resetStores
}