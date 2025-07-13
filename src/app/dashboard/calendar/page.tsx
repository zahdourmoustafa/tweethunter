"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addWeeks, subWeeks, addDays, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns"
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Trash2, Eye, Edit, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ScheduledTweet = {
  id: string
  content: string
  originalContent: string
  toolUsed: string | null
  scheduledAt: string
  timezone: string
  isThread: boolean
  threadParts: string[]
  status: "scheduled" | "posted" | "failed" | "cancelled"
  postedAt: string | null
  postedTweetId: string | null
  failureReason: string | null
  metadata: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

type CalendarView = "month" | "week" | "day" | "agenda"

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  posted: "bg-green-100 text-green-800 border-green-200", 
  failed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-amber-100 text-amber-800 border-amber-200"
}

export default function CalendarPage() {
  const [scheduledTweets, setScheduledTweets] = useState<ScheduledTweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<CalendarView>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const fetchScheduledTweets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/scheduled-tweets")
      if (!response.ok) throw new Error("Failed to fetch scheduled tweets")
      
      const data = await response.json()
      
      // Handle the API response format { status: 'success', tweets: [...] }
      if (data.status === 'success' && Array.isArray(data.tweets)) {
        setScheduledTweets(data.tweets)
      } else {
        console.error("Unexpected API response format:", data)
        setScheduledTweets([])
      }
    } catch (error) {
      console.error("Error fetching scheduled tweets:", error)
      toast.error("Failed to load scheduled tweets")
      setScheduledTweets([]) // Ensure it's always an array
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduledTweets()
  }, [])

  const handleDeleteTweet = async (tweetId: string) => {
    try {
      const response = await fetch(`/api/scheduled-tweets/${tweetId}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete tweet")

      await fetchScheduledTweets()
      toast.success("Tweet deleted successfully")
    } catch (error) {
      console.error("Error deleting tweet:", error)
      toast.error("Failed to delete tweet")
    }
  }

  const getTweetsForDate = (date: Date) => {
    return scheduledTweets.filter(tweet => 
      isSameDay(new Date(tweet.scheduledAt), date)
    )
  }

  const navigateCalendar = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    } else if (view === 'day') {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1))
    }
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map(day => {
          const dayTweets = getTweetsForDate(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)
          const isCurrentMonth = day >= monthStart && day <= monthEnd

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-24 p-2 border border-border rounded cursor-pointer transition-colors",
                isSelected && "bg-primary/10 border-primary",
                isTodayDate && "bg-yellow-50 border-yellow-300",
                !isCurrentMonth && "text-muted-foreground bg-muted/30",
                "hover:bg-muted/50"
              )}
              onClick={() => setSelectedDate(day)}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              
              {/* Tweet indicators */}
              <div className="space-y-1">
                {dayTweets.slice(0, 3).map(tweet => (
                  <div
                    key={tweet.id}
                    className={cn(
                      "text-xs p-1 rounded truncate",
                      statusColors[tweet.status]
                    )}
                  >
                    {tweet.isThread ? '🧵 ' : ''}{tweet.content.substring(0, 20)}...
                  </div>
                ))}
                {dayTweets.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayTweets.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dayTweets = getTweetsForDate(day)
          const isTodayDate = isToday(day)

          return (
            <div key={day.toISOString()} className="space-y-2">
              <div className={cn(
                "text-center p-2 rounded",
                isTodayDate && "bg-primary text-primary-foreground"
              )}>
                <div className="text-xs">{format(day, 'EEE')}</div>
                <div className="text-lg font-bold">{format(day, 'd')}</div>
              </div>
              
              <div className="space-y-1 min-h-96">
                {dayTweets.map(tweet => (
                  <Card key={tweet.id} className="p-2">
                    <div className={cn("text-xs px-2 py-1 rounded mb-1", statusColors[tweet.status])}>
                      {tweet.status}
                    </div>
                    <div className="text-sm truncate">
                      {tweet.isThread ? '🧵 ' : ''}{tweet.content.substring(0, 30)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(tweet.scheduledAt), 'h:mm a')}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderDayView = () => {
    const dayTweets = getTweetsForDate(currentDate)
    
    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-muted rounded">
          <h3 className="text-lg font-semibold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
        </div>
        
        <div className="space-y-3">
          {dayTweets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No tweets scheduled for this day
            </div>
          ) : (
            dayTweets.map(tweet => (
              <Card key={tweet.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[tweet.status]}>
                        {tweet.status}
                      </Badge>
                      {tweet.isThread && (
                        <Badge variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Thread
                        </Badge>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(tweet.scheduledAt), 'h:mm a')}
                      </div>
                    </div>
                    
                    <p className="text-sm leading-relaxed">{tweet.content}</p>
                    
                    {tweet.toolUsed && (
                      <div className="text-xs text-muted-foreground">
                        Generated with: {tweet.toolUsed}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTweet(tweet.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  const renderAgendaView = () => {
    const upcomingTweets = scheduledTweets
      .filter(tweet => tweet.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 20)

    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-muted rounded">
          <h3 className="text-lg font-semibold">Upcoming Scheduled Tweets</h3>
        </div>
        
        <div className="space-y-3">
          {upcomingTweets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No upcoming scheduled tweets
            </div>
          ) : (
            upcomingTweets.map(tweet => (
              <Card key={tweet.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[tweet.status]}>
                        {tweet.status}
                      </Badge>
                      {tweet.isThread && (
                        <Badge variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Thread
                        </Badge>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(tweet.scheduledAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    
                    <p className="text-sm leading-relaxed">{tweet.content}</p>
                    
                    {tweet.toolUsed && (
                      <div className="text-xs text-muted-foreground">
                        Generated with: {tweet.toolUsed}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTweet(tweet.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tweet Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your scheduled tweets
          </p>
        </div>
        
        {/* Statistics */}
        <div className="flex gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {scheduledTweets.filter(t => t.status === "scheduled").length}
              </div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {scheduledTweets.filter(t => t.status === "posted").length}
              </div>
              <div className="text-sm text-muted-foreground">Posted</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {scheduledTweets.filter(t => t.status === "failed").length}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {scheduledTweets.length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={view} onValueChange={(value: CalendarView) => setView(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <span className="font-semibold">
                {view === 'month' && format(currentDate, 'MMMM yyyy')}
                {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d')}`}
                {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
                {view === 'agenda' && 'Upcoming Tweets'}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
          {view === 'agenda' && renderAgendaView()}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Quick actions:</strong> Use the view selector to switch between Month, Week, Day, and Agenda views. 
            Click on any date in month view to see detailed tweets for that day.
          </p>
        </CardContent>
      </Card>

      {/* Event Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
          <CardDescription>Understanding tweet status colors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">Scheduled</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Posted</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Failed</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-800">Cancelled</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">🧵 = Thread</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 