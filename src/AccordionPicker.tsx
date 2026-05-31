import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface AccordionPickerProps<T> {
  title: string
  items: T[]
  /** the accordion section an item belongs to (e.g. role or device type) */
  groupOf: (item: T) => string
  /** the text shown for an item (also used to sort items within a section) */
  labelOf: (item: T) => string
  /** a stable React key for an item */
  keyOf: (item: T) => string
  onSelect: (item: T) => void
  onClose: () => void
}

function AccordionPicker<T>({
  title,
  items,
  groupOf,
  labelOf,
  keyOf,
  onSelect,
  onClose,
}: AccordionPickerProps<T>) {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const grouped = items.reduce<Record<string, T[]>>((acc, item) => {
    ;(acc[groupOf(item)] ??= []).push(item)
    return acc
  }, {})
  const sections = Object.keys(grouped).sort()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <span className="modal-label">{title}</span>
        <div className="accordion">
          {sections.map((section) => (
            <div className="accordion-section" key={section}>
              <button
                type="button"
                className="accordion-header"
                onClick={() =>
                  setOpenSection((current) =>
                    current === section ? null : section,
                  )
                }
              >
                {openSection === section ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                {section}
              </button>
              {openSection === section && (
                <ul className="user-list">
                  {grouped[section]
                    .slice()
                    .sort((a, b) => labelOf(a).localeCompare(labelOf(b)))
                    .map((item) => (
                      <li
                        key={keyOf(item)}
                        className="user-list-item"
                        onClick={() => onSelect(item)}
                      >
                        {labelOf(item)}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccordionPicker
