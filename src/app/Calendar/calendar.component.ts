import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

interface CalendarDay {
  readonly date: Date;
  readonly dayNumber: number;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
}

@Component({
  selector: 'app-calendar',
  imports: [DatePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent {
  private readonly today = new Date();
  readonly selectedDate = signal(new Date(this.today));
  readonly displayedMonth = signal(
    new Date(this.today.getFullYear(), this.today.getMonth(), 1),
  );

  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('it-IT', {
      month: 'long',
      year: 'numeric',
    }).format(this.displayedMonth()),
  );

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const month = this.displayedMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const daysInPreviousMonth = new Date(month.getFullYear(), month.getMonth(), 0).getDate();
    const days: CalendarDay[] = [];

    for (let index = firstWeekday - 1; index >= 0; index -= 1) {
      const dayNumber = daysInPreviousMonth - index;
      days.push({
        date: new Date(month.getFullYear(), month.getMonth() - 1, dayNumber),
        dayNumber,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), dayNumber);
      days.push({
        date,
        dayNumber,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, this.today),
      });
    }

    const trailingDays = (7 - (days.length % 7)) % 7;
    for (let dayNumber = 1; dayNumber <= trailingDays; dayNumber += 1) {
      days.push({
        date: new Date(month.getFullYear(), month.getMonth() + 1, dayNumber),
        dayNumber,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    return days;
  });

  previousMonth(): void {
    const month = this.displayedMonth();
    this.displayedMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const month = this.displayedMonth();
    this.displayedMonth.set(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.displayedMonth.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    this.selectedDate.set(new Date(this.today));
  }

  selectDate(day: CalendarDay): void {
    this.selectedDate.set(new Date(day.date));
    if (!day.isCurrentMonth) {
      this.displayedMonth.set(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
    }
  }

  isSelected(day: CalendarDay): boolean {
    return this.isSameDay(day.date, this.selectedDate());
  }

  formatSelectedDate(): string {
    return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(this.selectedDate());
  }

  trackDay(_: number, day: CalendarDay): string {
    return day.date.toISOString();
  }

  private isSameDay(first: Date, second: Date): boolean {
    return first.getFullYear() === second.getFullYear()
      && first.getMonth() === second.getMonth()
      && first.getDate() === second.getDate();
  }
}
