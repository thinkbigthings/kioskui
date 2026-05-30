import { useEffect, useState } from 'react'
import './App.css'
import type { LockerNumbered } from './types'

interface KioskState {
  lockers: LockerNumbered[]
}

function App() {
  const [lockers, setLockers] = useState<LockerNumbered[]>([])

  useEffect(() => {
    fetch('http://localhost:8080/api/sim/kiosk')
      .then((res) => res.json())
      .then((data: KioskState) => setLockers(data.lockers))
      .catch((err) => console.error('Failed to load kiosk state', err))
  }, [])

  const led = lockers[0]?.locker.led

  return (
    <div className="kiosk">
      <div className="locker">
        <div
          className="led"
          style={
            led
              ? { background: `rgb(${led.red}, ${led.green}, ${led.blue})` }
              : undefined
          }
        />
      </div>
    </div>
  )
}

export default App
