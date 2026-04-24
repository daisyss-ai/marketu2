'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface InstitutionOption {
  value: string
  label: string
}

export interface InstitutionSelectProps {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
}

const InstitutionSelect = React.forwardRef<HTMLSelectElement, InstitutionSelectProps>(
  ({ id = 'institution', name, value, onChange, error, label = 'InstituiÃ§Ã£o' }, ref) => {
    const [options, setOptions] = useState<InstitutionOption[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const fetchInstitutions = async () => {
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from('institution').select('id, name').order('name')

          if (error) {
            console.error('Error fetching institutions:', error)
            return
          }

          const institutionOptions = data.map((inst: any) => ({
            value: inst.id,
            label: inst.name,
          }))

          setOptions(institutionOptions)
        } catch (err) {
          console.error('Failed to fetch institutions:', err)
        } finally {
          setLoading(false)
        }
      }

      fetchInstitutions()
    }, [])

    return (
      <div>
        <label htmlFor={id} className="block text-sm font-semibold text-foreground mb-1.5 ml-1">
          {label}
        </label>
        <select
          id={id}
          name={name ?? id}
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl border border-muted/20 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all bg-surface text-foreground placeholder:text-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-invalid={!!error}
        >
          <option value="">
            {loading ? 'Carregando instituiÃ§Ãµes...' : 'Seleciona a tua instituiÃ§Ã£o'}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-error text-xs mt-1 ml-1 font-medium">{error}</p>}
      </div>
    )
  },
)

InstitutionSelect.displayName = 'InstitutionSelect'
export default InstitutionSelect

