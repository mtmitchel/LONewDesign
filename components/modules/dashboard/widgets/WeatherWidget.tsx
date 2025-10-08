"use client";

import React from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react';
import type { WidgetProps } from '../types';

const mockWeatherData = {
  current: {
    temperature: 72,
    condition: 'partly-cloudy',
    humidity: 65,
    windSpeed: 8,
    feelsLike: 75
  },
  forecast: [
    { day: 'Today', high: 75, low: 62, condition: 'partly-cloudy' },
    { day: 'Tomorrow', high: 78, low: 64, condition: 'sunny' },
    { day: 'Thursday', high: 70, low: 58, condition: 'rainy' }
  ]
};

const weatherIcons = {
  'sunny': Sun,
  'partly-cloudy': Cloud,
  'rainy': CloudRain,
  'cloudy': Cloud
};

export function WeatherWidget({ widget }: WidgetProps) {
  const location = widget.config.location || 'San Francisco, CA';
  const showForecast = widget.config.showForecast ?? true;
  const units = widget.config.units || 'fahrenheit';
  
  const CurrentIcon = weatherIcons[mockWeatherData.current.condition as keyof typeof weatherIcons] || Cloud;

  return (
    <div className="h-full flex flex-col">
      {/* Location */}
  <div className="text-sm text-[color:var(--text-secondary)] mb-3 truncate">
        {location}
      </div>
      
      {/* Current Weather */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-shrink-0">
          <CurrentIcon size={48} className="text-[color:var(--primary)]" />
        </div>
        <div>
          <div className="text-3xl font-semibold text-[color:var(--text-primary)]">
            {mockWeatherData.current.temperature}°{units === 'celsius' ? 'C' : 'F'}
          </div>
          <div className="text-sm text-[color:var(--text-secondary)] capitalize">
            {mockWeatherData.current.condition.replace('-', ' ')}
          </div>
        </div>
      </div>
      
      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Thermometer size={14} className="text-[color:var(--text-secondary)]" />
          <span className="text-xs text-[color:var(--text-secondary)]">
            Feels like {mockWeatherData.current.feelsLike}°
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Droplets size={14} className="text-[color:var(--text-secondary)]" />
          <span className="text-xs text-[color:var(--text-secondary)]">
            {mockWeatherData.current.humidity}%
          </span>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <Wind size={14} className="text-[color:var(--text-secondary)]" />
          <span className="text-xs text-[color:var(--text-secondary)]">
            {mockWeatherData.current.windSpeed} mph
          </span>
        </div>
      </div>
      
      {/* Forecast */}
      {showForecast && (
        <div className="flex-1 border-t border-[var(--border-subtle)] pt-3">
          <div className="text-xs font-medium text-[color:var(--text-secondary)] mb-2">
            3-Day Forecast
          </div>
          <div className="space-y-2">
            {mockWeatherData.forecast.map((day, index) => {
              const DayIcon = weatherIcons[day.condition as keyof typeof weatherIcons] || Cloud;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DayIcon size={16} className="text-[color:var(--text-secondary)]" />
                    <span className="text-xs text-[color:var(--text-primary)]">
                      {day.day}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-medium text-[color:var(--text-primary)]">
                      {day.high}°
                    </span>
                    <span className="text-[color:var(--text-secondary)]">
                      {day.low}°
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}