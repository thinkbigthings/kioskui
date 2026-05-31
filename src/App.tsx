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
import AccordionPicker from './AccordionPicker'
import type { Device, LockerNumbered, ScannerState, User } from './types'

const UNKNOWN_DEVICE_TYPE = 'Unknown'
const MAX_RECENT = 5

interface RecentItem {
  /** unique id used to de-duplicate within the recent list */
  key: string
  /** leftmost text: the user's role or the device type name */
  category: string
  /** the text shown for the item */
  label: string
  /** the value enqueued to the scanner when selected */
  data: string
}

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
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceOpen, setDeviceOpen] = useState(false)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [recentOpen, setRecentOpen] = useState(false)

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

  useEffect(() => {
    fetch('http://localhost:8080/api/sim/kiosk/cache/devices')
      .then((res) => res.json())
      .then((data: Device[]) => setDevices(data))
      .catch((err) => console.error('Failed to load devices', err))
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

  const addRecent = (item: RecentItem) => {
    setRecent((prev) =>
      [item, ...prev.filter((r) => r.key !== item.key)].slice(0, MAX_RECENT),
    )
  }

  const userDisplayName = (user: User) => {
    const fullName = `${user.firstName} ${user.lastName}`.trim()
    return fullName || user.userName
  }

  const selectUser = (user: User) => {
    enqueueScan(user.badgeNumber)
    addRecent({
      key: `user:${user.badgeNumber}`,
      category: user.role,
      label: userDisplayName(user),
      data: user.badgeNumber,
    })
    setBadgeOpen(false)
  }

  const selectDevice = (device: Device) => {
    enqueueScan(device.deviceNumber)
    addRecent({
      key: `device:${device.deviceNumber}`,
      category: device.deviceType?.deviceTypeName ?? UNKNOWN_DEVICE_TYPE,
      label: device.deviceNumber,
      data: device.deviceNumber,
    })
    setDeviceOpen(false)
  }

  const selectRecent = (item: RecentItem) => {
    enqueueScan(item.data)
    setRecentOpen(false)
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
            onClick={() => setRecentOpen(true)}
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
            onClick={() => setDeviceOpen(true)}
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
      {recentOpen && (
        <div className="modal-overlay" onClick={() => setRecentOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="modal-label">Recently scanned</span>
            {recent.length === 0 ? (
              <p className="recent-empty">Nothing scanned yet.</p>
            ) : (
              <ul className="user-list">
                {recent.map((item) => (
                  <li
                    key={item.key}
                    className="user-list-item recent-item"
                    onClick={() => selectRecent(item)}
                  >
                    <span className="recent-category">{item.category}</span>
                    {item.label}
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-actions">
              <button type="button" onClick={() => setRecentOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {badgeOpen && (
        <AccordionPicker
          title="Select a user"
          items={users}
          groupOf={(user) => user.role}
          labelOf={userDisplayName}
          keyOf={(user) => user.badgeNumber}
          onSelect={selectUser}
          onClose={() => setBadgeOpen(false)}
        />
      )}
      {deviceOpen && (
        <AccordionPicker
          title="Select a device"
          items={devices}
          groupOf={(device) =>
            device.deviceType?.deviceTypeName ?? UNKNOWN_DEVICE_TYPE
          }
          labelOf={(device) => device.deviceNumber}
          keyOf={(device) => device.deviceNumber}
          onSelect={selectDevice}
          onClose={() => setDeviceOpen(false)}
        />
      )}
    </div>
  )
}

export default App
