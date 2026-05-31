export type DoorState = 'OPEN' | 'CLOSED'

export type ChargingPortStatus =
  | 'PORT_STATUS_DETACHED'
  | 'PORT_STATUS_ATTACHED'
  | 'PORT_STATUS_CHARGING'

export interface Led {
  red: number
  green: number
  blue: number
  blinkRateMs: number
}

export interface Locker {
  led: Led
  door: DoorState
  chargingPortStatus: ChargingPortStatus
}

export interface ScannerState {
  active: boolean
}

export interface User {
  badgeNumber: string
  firstName: string
  lastName: string
  userName: string
}

export interface LockerNumbered {
  lockerNumber: number
  locker: Locker
}
