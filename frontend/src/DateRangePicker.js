import React, { useState, useEffect } from 'react';
import './DateRangePicker.css';

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onDateChange, 
  startDateLabel, 
  endDateLabel, 
  startDatePlaceholder, 
  endDatePlaceholder, 
  clearText, 
  closeText, 
  prevMonthText, 
  nextMonthText,
  isRTL = false 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);

  useEffect(() => {
    if (startDate && !endDate) {
      setSelectingEnd(true);
    }
  }, [startDate, endDate]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false;
    const dateStr = formatDate(date);
    return dateStr >= startDate && dateStr <= endDate;
  };

  const isStartDate = (date) => {
    return formatDate(date) === startDate;
  };

  const isEndDate = (date) => {
    return formatDate(date) === endDate;
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    
    const dateStr = formatDate(date);
    
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onDateChange(dateStr, '');
      setSelectingEnd(true);
    } else if (selectingEnd) {
      // Complete the selection
      if (dateStr >= startDate) {
        onDateChange(startDate, dateStr);
        setSelectingEnd(false);
        setIsOpen(false);
      } else {
        // If end date is before start date, swap them
        onDateChange(dateStr, startDate);
        setSelectingEnd(false);
        setIsOpen(false);
      }
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  const getDayName = (dayIndex) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className={`date-range-picker ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="date-inputs">
        <div className="date-input">
          <label>{startDateLabel}</label>
          <input
            type="text"
            value={startDate || ''}
            placeholder={startDatePlaceholder}
            readOnly
            onClick={() => setIsOpen(true)}
            dir="auto"
          />
        </div>
        <div className="date-input">
          <label>{endDateLabel}</label>
          <input
            type="text"
            value={endDate || ''}
            placeholder={endDatePlaceholder}
            readOnly
            onClick={() => setIsOpen(true)}
            dir="auto"
          />
        </div>
      </div>
      
      {isOpen && (
        <div className="calendar-popup">
          <div className="calendar-header">
            <button 
              onClick={isRTL ? nextMonth : prevMonth} 
              title={isRTL ? nextMonthText : prevMonthText}
              className="calendar-nav-button"
            >
              {isRTL ? '>' : '<'}
            </button>
            <h3>{getMonthName(currentMonth)}</h3>
            <button 
              onClick={isRTL ? prevMonth : nextMonth} 
              title={isRTL ? prevMonthText : nextMonthText}
              className="calendar-nav-button"
            >
              {isRTL ? '<' : '>'}
            </button>
          </div>
          
          <div className="calendar-grid">
            <div className="calendar-days-header">
              {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                <div key={dayIndex} className="day-header">
                  {getDayName(dayIndex)}
                </div>
              ))}
            </div>
            
            <div className="calendar-days">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`calendar-day ${
                    !day ? 'empty' :
                    isDateDisabled(day) ? 'disabled' :
                    isStartDate(day) ? 'start-date' :
                    isEndDate(day) ? 'end-date' :
                    isDateInRange(day) ? 'in-range' : ''
                  }`}
                  onClick={() => day && handleDateClick(day)}
                >
                  {day ? day.getDate() : ''}
                </div>
              ))}
            </div>
          </div>
          
          <div className="calendar-footer">
            <button 
              className="clear-button"
              onClick={() => {
                onDateChange('', '');
                setSelectingEnd(false);
              }}
            >
              {clearText}
            </button>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              {closeText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker; 