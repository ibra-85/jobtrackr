"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimeWithIconProps {
  label?: React.ReactNode
  value?: string // format "HH:MM"
  onChange?: (time: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function TimeWithIcon({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  id,
}: TimeWithIconProps) {
  const [time, setTime] = useState(value || "")

  // Sync with external value
  useEffect(() => {
    if (value !== undefined) {
      setTime(value || "")
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    onChange?.(newTime)
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <Label className="text-foreground text-sm font-medium mb-1 block">
          {label}
        </Label>
      )}
      <div className="relative">
        {/* Icon */}
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground/80">
          <Clock size={16} aria-hidden="true" />
        </div>

        {/* Time input */}
        <Input
          id={id}
          type="time"
          value={time}
          onChange={handleChange}
          disabled={disabled}
          className="ps-9 h-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden [&::-moz-calendar-picker-indicator]:hidden"
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

