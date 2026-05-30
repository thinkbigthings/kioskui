export type DoorState = 'OPEN' | 'CLOSED'

export type ChargingPortStatus =
  | 'PORT_STATUS_DETACHED'
  | 'PORT_STATUS_ATTACHED'

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

export interface LockerNumbered {
  lockerNumber: number
  locker: Locker
}
