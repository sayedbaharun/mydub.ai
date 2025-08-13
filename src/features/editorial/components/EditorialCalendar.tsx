/**
 * Editorial Calendar - Content planning and scheduling
 * Visual calendar interface for editorial planning
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Calendar, Clock, FileText, Users, ChevronLeft, ChevronRight } from 'lucide-react';

export function EditorialCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Mock calendar data - would come from API in real implementation
  const calendarEvents = [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      title: 'Dubai Metro Blue Line Story',
      type: 'story_deadline',
      priority: 'high',
      assignee: 'Sarah Johnson'
    },
    {
      id: '2',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      title: 'Weekly Business Roundup',
      type: 'publication_date',
      priority: 'medium',
      assignee: 'Ahmed Al-Rashid'
    }
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-600" />
            Editorial Calendar
          </h2>
          <p className="text-gray-600 mt-1">Plan and schedule content publication</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium px-4">{monthYear}</span>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Content Schedule</CardTitle>
              <CardDescription>Deadlines, publications, and editorial events</CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarGrid currentDate={currentDate} events={calendarEvents} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calendarEvents
                  .filter(event => event.date === new Date().toISOString().split('T')[0])
                  .map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                {calendarEvents.filter(event => event.date === new Date().toISOString().split('T')[0]).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No events today</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calendarEvents
                  .filter(event => event.type === 'story_deadline')
                  .slice(0, 5)
                  .map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Workload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Team Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sarah Johnson</span>
                  <Badge className="text-xs">3 assignments</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ahmed Al-Rashid</span>
                  <Badge className="text-xs">2 assignments</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lisa Chen</span>
                  <Badge className="text-xs">1 assignment</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CalendarGrid({ currentDate, events }: { currentDate: Date; events: any[] }) {
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const currentDay = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().toDateString();

  return (
    <div className="calendar-grid">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayStr = day.toISOString().split('T')[0];
          const dayEvents = events.filter(event => event.date === dayStr);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === today;
          
          return (
            <div
              key={index}
              className={`
                min-h-[80px] p-2 border border-gray-100 rounded-lg
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                hover:bg-gray-50 transition-colors cursor-pointer
              `}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate ${
                      event.type === 'story_deadline' 
                        ? 'bg-red-100 text-red-800'
                        : event.type === 'publication_date'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 p-1">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const typeConfig = {
    story_deadline: { label: 'Deadline', color: 'bg-red-100 text-red-800', icon: Clock },
    publication_date: { label: 'Publish', color: 'bg-green-100 text-green-800', icon: Calendar },
    meeting: { label: 'Meeting', color: 'bg-blue-100 text-blue-800', icon: Users },
    event_coverage: { label: 'Coverage', color: 'bg-purple-100 text-purple-800', icon: FileText }
  };

  const config = typeConfig[event.type as keyof typeof typeConfig] || typeConfig.story_deadline;
  const Icon = config.icon;

  return (
    <div className="p-3 border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{event.title}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge className={`text-xs ${config.color}`}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            <span className="text-xs text-gray-500">{event.assignee}</span>
          </div>
        </div>
      </div>
    </div>
  );
}