"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addWeeks, subWeeks, addDays, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns"
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Trash2, Eye, Edit, MessageSquare, X, Copy } from "lucide-react"
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
  const [selectedTweet, setSelectedTweet] = useState<ScheduledTweet | null>(null)
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

  const handleTweetClick = (tweet: ScheduledTweet) => {
    setSelectedTweet(tweet)
  }

  const handleClosePanel = () => {
    setSelectedTweet(null)
  }

  const handleCopyTweet = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success("Tweet copied to clipboard!")
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error("Failed to copy tweet")
    }
  }

  const handleMarkAsPosted = async (tweetId: string) => {
    try {
      const response = await fetch(`/api/scheduled-tweets/${tweetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'posted',
          postedAt: new Date().toISOString()
        })
      })

      if (!response.ok) throw new Error("Failed to mark as posted")

      await fetchScheduledTweets()
      toast.success("🎉 Tweet marked as posted!")
    } catch (error) {
      console.error("Error marking as posted:", error)
      toast.error("Failed to mark tweet as posted")
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
                       "text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity",
                       statusColors[tweet.status]
                     )}
                     onClick={(e) => {
                       e.stopPropagation()
                       handleTweetClick(tweet)
                     }}
                   >
                     {tweet.isThread ? '🧵 ' : ''}{tweet.content.substring(0, 20)}...
                   </div>
                 ))}                {dayTweets.length > 3 && (
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
                   <Card 
                     key={tweet.id} 
                     className="p-2 cursor-pointer hover:shadow-md transition-shadow"
                     onClick={() => handleTweetClick(tweet)}
                   >
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
               </div>            </div>
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
               <Card 
                 key={tweet.id} 
                 className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                 onClick={() => handleTweetClick(tweet)}
               >
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
                     onClick={(e) => {
                       e.stopPropagation()
                       handleDeleteTweet(tweet.id)
                     }}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </Card>
             ))          )}
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
               <Card 
                 key={tweet.id} 
                 className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                 onClick={() => handleTweetClick(tweet)}
               >
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
                     onClick={(e) => {
                       e.stopPropagation()
                       handleDeleteTweet(tweet.id)
                     }}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </Card>
             ))          )}
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
    <div className="flex h-screen bg-gray-50">
      {/* Main Calendar Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tweet Calendar</h1>
              <p className="text-sm text-muted-foreground">
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
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Select value={view} onValueChange={(value: CalendarView) => setView(value)}>
                    <SelectTrigger className="w-28 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="agenda">Agenda</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    {view === 'month' && format(currentDate, 'MMMM yyyy')}
                    {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d')}`}
                    {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
                    {view === 'agenda' && 'Upcoming'}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-3">
              {view === 'month' && renderMonthView()}
              {view === 'week' && renderWeekView()}
              {view === 'day' && renderDayView()}
              {view === 'agenda' && renderAgendaView()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel for Tweet Details */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {selectedTweet ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-base font-semibold">Tweet Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePanel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Content - Compact layout */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedTweet.status]}>
                  {selectedTweet.status}
                </Badge>
                {selectedTweet.isThread && (
                  <Badge variant="outline" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Thread
                  </Badge>
                )}
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
                <p className="text-sm font-medium">
                  {format(new Date(selectedTweet.scheduledAt), 'MMM d, h:mm a')}
                </p>
              </div>
              
              {selectedTweet.toolUsed && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tool</p>
                  <p className="text-sm">{selectedTweet.toolUsed}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Content</p>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedTweet.content}</p>
                </div>
              </div>
              
              {selectedTweet.isThread && selectedTweet.threadParts && selectedTweet.threadParts.length > 1 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Thread ({selectedTweet.threadParts.length} parts)</p>
                  <div className="space-y-1">
                    {selectedTweet.threadParts.slice(0, 3).map((part, index) => (
                      <div key={index} className="bg-gray-50 rounded p-2">
                        <p className="text-xs whitespace-pre-wrap leading-relaxed">{part}</p>
                      </div>
                    ))}
                    {selectedTweet.threadParts.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{selectedTweet.threadParts.length - 3} more parts</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Fixed Actions at bottom */}
            <div className="border-t p-3 space-y-2">
              {selectedTweet.status === 'scheduled' && (
                <Button 
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleMarkAsPosted(selectedTweet.id)}
                >
                  ✓ Mark as Posted
                </Button>
              )}
              {selectedTweet.status === 'posted' && (
                <div className="text-center">
                  <Badge className="bg-green-100 text-green-800">
                    ✓ Already Posted
                  </Badge>
                </div>
              )}
              <Button 
                size="sm"
                className="w-full"
                onClick={() => handleCopyTweet(selectedTweet.content)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy Tweet
              </Button>
              {selectedTweet.isThread && selectedTweet.threadParts && (
                <Button 
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCopyTweet(selectedTweet.threadParts!.join('\n\n---\n\n'))}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Thread
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="text-gray-400 mb-2">
              <MessageSquare className="h-8 w-8 mx-auto" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Tweet Details</h3>
            <p className="text-sm text-gray-600">
              Click any tweet to view details
            </p>
          </div>
        )}
      </div>
    </div>   )
 }