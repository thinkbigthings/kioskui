import { useEffect, useState } from 'react'
import './App.css'
import type { LockerNumbered } from './types'

interface KioskState {
  lockers: LockerNumbered[]
}

const LOCKERS_TO_SHOW = 8

function App() {
  const [lockers, setLockers] = useState<LockerNumbered[]>([])

  useEffect(() => {
    fetch('http://localhost:8080/api/sim/kiosk')
      .then((res) => res.json())
      .then((data: KioskState) => setLockers(data.lockers))
      .catch((err) => console.error('Failed to load kiosk state', err))
  }, [])

  return (
    <div className="kiosk">
      {lockers
        .filter(({ lockerNumber }) => lockerNumber <= LOCKERS_TO_SHOW)
        .map(({ lockerNumber, locker: { led } }) => (
          <div className="locker" key={lockerNumber}>
            <div
              className="led"
              style={{
                background: `rgb(${led.red}, ${led.green}, ${led.blue})`,
              }}
            />
          </div>
        ))}
    </div>
  )
}

export default App
