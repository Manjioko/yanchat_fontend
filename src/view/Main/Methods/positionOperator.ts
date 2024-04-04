import { MainStore } from "../store"
import { Position } from "@/interface/global"
const mainStore = MainStore()

export function deleteActionFriendPositionData() {
    let beforedata: { [position_id: string]: Position } = JSON.parse(
        localStorage.getItem('Position') || '{}'
    )
    if (typeof beforedata === 'string') {
        beforedata = JSON.parse(beforedata)
    }
    delete beforedata[mainStore.positionId]

    localStorage.setItem('Position', JSON.stringify(beforedata))
}

export function setActionFriendPositionData(data: Position) {
    let beforedata: { [position_id: string]: Position } = JSON.parse(
        localStorage.getItem('Position') || '{}'
    )
    if (typeof beforedata === 'string') {
        beforedata = JSON.parse(beforedata)
    }
    beforedata[mainStore.positionId] = data
    localStorage.setItem('Position', JSON.stringify(beforedata))
}

export function getActionFriendPositionData() {
    let beforedata: { [position_id: string]: Position } = JSON.parse(
        localStorage.getItem('Position') || '{}'
    )
    if (typeof beforedata === 'string') {
        beforedata = JSON.parse(beforedata)
    }
    return beforedata[mainStore.positionId]
}

export function clearActionFriendPositionData() {
    localStorage.setItem('Position', '{}')
}