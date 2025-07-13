"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onSchedule: (scheduledAt: Date) => void
}

export const ScheduleModal = ({ isOpen, onClose, content, onSchedule }: ScheduleModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("09:00")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleSchedule = () => {
    if (!selectedDate) {
      toast.error("Please select a date")
      return
    }

    // Parse the time and combine with date
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const scheduledDateTime = new Date(selectedDate)
    scheduledDateTime.setHours(hours, minutes, 0, 0)

    // Check if the date is in the future
    if (scheduledDateTime <= new Date()) {
      toast.error("Please select a future date and time")
      return
    }

    onSchedule(scheduledDateTime)
    onClose()
    
    // Reset form
    setSelectedDate(undefined)
    setSelectedTime("09:00")
  }

  const handleClose = () => {
    onClose()
    // Reset form
    setSelectedDate(undefined)
    setSelectedTime("09:00")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule Tweet
          </DialogTitle>
          <DialogDescription>
            Choose when you want this tweet to be posted
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Tweet Preview */}
          <div className="space-y-2">
            <Label>Tweet Content</Label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-900 whitespace-pre-wrap line-clamp-3">
                {content}
              </p>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    setIsCalendarOpen(false)
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label>Select Time</Label>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Timezone Notice */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule}>
            Schedule Tweet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 