import { useEffect, useState } from 'react'
import {
  BatteryCharging,
  History,
  Plug,
  RectangleHorizontal,
  Smartphone,
  SquarePen,
  UserRound,
} from 'lucide-react'
import './App.css'
import type { LockerNumbered, ScannerState } from './types'

interface KioskState {
  scannerState: ScannerState
  lockers: LockerNumbered[]
}

const LOCKERS_TO_SHOW = 8
const POLL_INTERVAL_MS = 1000

function App() {
  const [lockers, setLockers] = useState<LockerNumbered[]>([])
  const [scannerActive, setScannerActive] = useState(false)

  useEffect(() => {
    const fetchState = () => {
      fetch('http://localhost:8080/api/sim/kiosk')
        .then((res) => res.json())
        .then((data: KioskState) => {
          setLockers(data.lockers)
          setScannerActive(data.scannerState.active)
        })
        .catch((err) => console.error('Failed to load kiosk state', err))
    }

    fetchState()
    const intervalId = setInterval(fetchState, POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [])

  const closeDoor = (lockerNumber: number) => {
    fetch(`http://localhost:8080/api/sim/locker/${lockerNumber}/door/close`, {
      method: 'POST',
    }).catch((err) => console.error('Failed to close door', err))
  }

  const attachPort = (lockerNumber: number) => {
    fetch(`http://localhost:8080/api/sim/locker/${lockerNumber}/port/attach`, {
      method: 'POST',
    }).catch((err) => console.error('Failed to plug in', err))
  }

  const detachPort = (lockerNumber: number) => {
    fetch(`http://localhost:8080/api/sim/locker/${lockerNumber}/port/detach`, {
      method: 'POST',
    }).catch((err) => console.error('Failed to unplug', err))
  }

  return (
    <div className="kiosk">
      <div className="scanner">
        <div className="scanner-top">
          <div className="scanner-label">Scanner</div>
          <div className={`scanner-window ${scannerActive ? 'active' : ''}`} />
        </div>
        <div className="scanner-bottom">
          <button
            type="button"
            className="scanner-button"
            aria-label="recent"
            disabled={!scannerActive}
          >
            <History />
          </button>
          <button
            type="button"
            className="scanner-button"
            aria-label="manual"
            disabled={!scannerActive}
          >
            <SquarePen />
          </button>
          <button
            type="button"
            className="scanner-button"
            aria-label="badge"
            disabled={!scannerActive}
          >
            <UserRound />
          </button>
          <button
            type="button"
            className="scanner-button"
            aria-label="device"
            disabled={!scannerActive}
          >
            <Smartphone />
          </button>
        </div>
      </div>
      {lockers
        .filter(({ lockerNumber }) => lockerNumber <= LOCKERS_TO_SHOW)
        .map(({ lockerNumber, locker: { led, door, chargingPortStatus } }) => (
          <div className="locker" key={lockerNumber}>
            <div
              className="led"
              style={{
                backgroundColor: `rgb(${led.red}, ${led.green}, ${led.blue})`,
                color: `rgb(${led.red}, ${led.green}, ${led.blue})`,
              }}
            />
            {door === 'OPEN' &&
              (chargingPortStatus === 'PORT_STATUS_DETACHED' ? (
                <Plug
                  className="port-icon plug"
                  size={64}
                  onClick={() => attachPort(lockerNumber)}
                />
              ) : (
                <BatteryCharging
                  className="port-icon"
                  size={64}
                  onClick={() => detachPort(lockerNumber)}
                />
              ))}
            <div
              className={`door ${door === 'OPEN' ? 'open' : ''}`}
              onClick={
                door === 'OPEN' ? () => closeDoor(lockerNumber) : undefined
              }
            >
              {chargingPortStatus !== 'PORT_STATUS_DETACHED' &&
                door !== 'OPEN' && (
                  <RectangleHorizontal className="device-present" size={56} />
                )}
            </div>
          </div>
        ))}
    </div>
  )
}

export default App
