import { useEffect, useState } from 'react'
import {
  BatteryCharging,
  ChevronDown,
  ChevronRight,
  History,
  Plug,
  RectangleHorizontal,
  Smartphone,
  SquarePen,
  UserRound,
} from 'lucide-react'
import './App.css'
import type { LockerNumbered, ScannerState, User } from './types'

interface KioskState {
  scannerState: ScannerState
  lockers: LockerNumbered[]
}

const LOCKERS_TO_SHOW = 8
const POLL_INTERVAL_MS = 1000

function App() {
  const [lockers, setLockers] = useState<LockerNumbered[]>([])
  const [scannerActive, setScannerActive] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualText, setManualText] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [badgeOpen, setBadgeOpen] = useState(false)
  const [openRole, setOpenRole] = useState<string | null>(null)

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

  useEffect(() => {
    fetch('http://localhost:8080/api/sim/kiosk/cache/users')
      .then((res) => res.json())
      .then((data: User[]) => setUsers(data))
      .catch((err) => console.error('Failed to load users', err))
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

  const enqueueScan = (data: string) => {
    fetch('http://localhost:8080/api/sim/scanner/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ response: data }).toString(),
    }).catch((err) => console.error('Failed to enqueue scan', err))
  }

  const openManual = () => {
    setManualText('')
    setManualOpen(true)
  }

  const submitManual = () => {
    if (manualText) {
      enqueueScan(manualText)
    }
    setManualOpen(false)
  }

  const selectUser = (user: User) => {
    enqueueScan(user.badgeNumber)
    setBadgeOpen(false)
  }

  const userDisplayName = (user: User) => {
    const fullName = `${user.firstName} ${user.lastName}`.trim()
    return fullName || user.userName
  }

  const usersByRole = users.reduce<Record<string, User[]>>((acc, user) => {
    ;(acc[user.role] ??= []).push(user)
    return acc
  }, {})
  const roles = Object.keys(usersByRole).sort()

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
            onClick={openManual}
          >
            <SquarePen />
          </button>
          <button
            type="button"
            className="scanner-button"
            aria-label="badge"
            disabled={!scannerActive}
            onClick={() => setBadgeOpen(true)}
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
      {manualOpen && (
        <div className="modal-overlay" onClick={() => setManualOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <label className="modal-label" htmlFor="manual-scan-input">
              Enter text to scan
            </label>
            <input
              id="manual-scan-input"
              className="modal-input"
              type="text"
              autoFocus
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitManual()}
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setManualOpen(false)}>
                Cancel
              </button>
              <button type="button" onClick={submitManual}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {badgeOpen && (
        <div className="modal-overlay" onClick={() => setBadgeOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="modal-label">Select a user</span>
            <div className="accordion">
              {roles.map((role) => (
                <div className="accordion-section" key={role}>
                  <button
                    type="button"
                    className="accordion-header"
                    onClick={() =>
                      setOpenRole((current) =>
                        current === role ? null : role,
                      )
                    }
                  >
                    {openRole === role ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    {role}
                  </button>
                  {openRole === role && (
                    <ul className="user-list">
                      {usersByRole[role]
                        .slice()
                        .sort((a, b) =>
                          userDisplayName(a).localeCompare(userDisplayName(b)),
                        )
                        .map((user) => (
                          <li
                            key={user.badgeNumber}
                            className="user-list-item"
                            onClick={() => selectUser(user)}
                          >
                            {userDisplayName(user)}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setBadgeOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
