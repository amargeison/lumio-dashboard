'use client'

import React, { useState, useMemo } from 'react'
import type { CRMContact } from '@/lib/crm/types'
import ContactCard from './ContactCard'

interface ContactGridProps {
  contacts: CRMContact[]
  onContactClick: (contact: CRMContact) => void
  onAddClick: () => void
}

type SortKey = 'aria_score' | 'name' | 'company_name' | 'last_contacted_at' | 'deal_value'

const sortOptions: { label: string; value: SortKey }[] = [
  { label: 'ARIA Score', value: 'aria_score' },
  { label: 'Name', value: 'name' },
  { label: 'Company', value: 'company_name' },
  { label: 'Last Contacted', value: 'last_contacted_at' },
  { label: 'Deal Value', value: 'deal_value' },
]

const allTags = [
  'Hot Lead',
  'Warm',
  'Cold',
  'Enterprise',
  'New',
  'Decision Maker',
  'Growth',
  'Technical',
  'SMB',
]

export default function ContactGrid({
  contacts,
  onContactClick,
  onAddClick,
}: ContactGridProps) {
  const [sortKey, setSortKey] = useState<SortKey>('aria_score')
  const [filterTag, setFilterTag] = useState<string>('')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const filteredAndSorted = useMemo(() => {
    let list = [...contacts]

    // Filter
    if (filterTag) {
      list = list.filter((c) => c.tags.includes(filterTag))
    }

    // Sort
    list.sort((a, b) => {
      switch (sortKey) {
        case 'aria_score':
          return b.aria_score - a.aria_score
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'company_name':
          return (a.company_name || '').localeCompare(b.company_name || '')
        case 'last_contacted_at': {
          const aDate = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : 0
          const bDate = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : 0
          return bDate - aDate
        }
        case 'deal_value':
          return b.deal_value - a.deal_value
        default:
          return 0
      }
    })

    return list
  }, [contacts, sortKey, filterTag])

  return (
    <div>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        {/* Sort dropdown */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          style={{
            backgroundColor: '#0D0E1A',
            border: '1px solid #1E2035',
            borderRadius: 8,
            color: '#F1F3FA',
            padding: '8px 12px',
            fontSize: 13,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>

        {/* Filter button + dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              backgroundColor: filterTag ? '#6C3FC5' : '#0D0E1A',
              border: '1px solid #1E2035',
              borderRadius: 8,
              color: '#F1F3FA',
              padding: '8px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {filterTag ? `Tag: ${filterTag}` : 'Filter'}
          </button>

          {showFilterDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                backgroundColor: '#0D0E1A',
                border: '1px solid #1E2035',
                borderRadius: 8,
                padding: 8,
                zIndex: 20,
                minWidth: 160,
              }}
            >
              <div
                onClick={() => {
                  setFilterTag('')
                  setShowFilterDropdown(false)
                }}
                style={{
                  padding: '6px 10px',
                  color: '#F1F3FA',
                  fontSize: 13,
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                All
              </div>
              {allTags.map((tag) => (
                <div
                  key={tag}
                  onClick={() => {
                    setFilterTag(tag)
                    setShowFilterDropdown(false)
                  }}
                  style={{
                    padding: '6px 10px',
                    color: filterTag === tag ? '#8B5CF6' : '#F1F3FA',
                    fontSize: 13,
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Add Contact button */}
        <button
          onClick={onAddClick}
          style={{
            backgroundColor: '#6C3FC5',
            border: 'none',
            borderRadius: 8,
            color: '#F1F3FA',
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Contact
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
        className="contact-grid"
      >
        {filteredAndSorted.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onClick={() => onContactClick(contact)}
          />
        ))}
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .contact-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
