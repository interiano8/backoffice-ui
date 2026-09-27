import React from 'react';
import { GALLON_TO_LITER, LITER_TO_GALLON } from '@/lib/constants';

interface VolumeDisplayProps {
  volumeLT?: number;
  volumeGL?: number;
  volume?: number;
  unit?: 'LT' | 'GL';
  decimals?: number;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  compact?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export const VolumeDisplay: React.FC<VolumeDisplayProps> = ({
  volumeLT,
  volumeGL,
  volume,
  unit = 'LT',
  decimals = 2,
  className = '',
  primaryClassName = '',
  secondaryClassName = '',
  compact = false,
  layout = 'vertical',
}) => {
  const GALLON_TO_LITER_FACTOR = GALLON_TO_LITER;

  // Calcular los valores si solo se proporcionó volume
  let finalVolumeLT = volumeLT;
  let finalVolumeGL = volumeGL;

  if (volume !== undefined && volumeLT === undefined && volumeGL === undefined) {
    if (unit === 'GL') {
      finalVolumeGL = volume;
      finalVolumeLT = volume * GALLON_TO_LITER_FACTOR;
    } else {
      finalVolumeLT = volume;
      finalVolumeGL = volume / GALLON_TO_LITER_FACTOR;
    }
  }

  // Asegurar que tengamos valores numéricos
  finalVolumeLT = finalVolumeLT ?? 0;
  finalVolumeGL = finalVolumeGL ?? 0;

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  if (compact) {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span className={`font-mono font-medium ${primaryClassName}`}>
          {formatNumber(finalVolumeLT)} <span className="text-[10px] opacity-70">LT</span>
        </span>
        <span className={`text-xs text-muted-foreground font-mono ${secondaryClassName}`}>
          {formatNumber(finalVolumeGL)} GL
        </span>
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className={`font-mono font-medium ${primaryClassName}`}>
          {formatNumber(finalVolumeLT)} <span className="text-[10px] opacity-70">LT</span>
        </span>
        <span className="text-muted-foreground">|</span>
        <span className={`font-mono text-muted-foreground ${secondaryClassName}`}>
          {formatNumber(finalVolumeGL)} <span className="text-[10px] opacity-70">GL</span>
        </span>
      </div>
    );
  }

  // Layout vertical (default)
  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span className={`font-mono font-medium ${primaryClassName}`}>
        {formatNumber(finalVolumeLT)} <span className="text-[10px] opacity-70">LT</span>
      </span>
      <span className={`text-xs text-muted-foreground font-mono ${secondaryClassName}`}>
        {formatNumber(finalVolumeGL)} GL
      </span>
    </div>
  );
};

export const useVolumeConversion = () => {
  const gallonsToLiters = (gallons: number): number => gallons * GALLON_TO_LITER;
  const litersToGallons = (liters: number): number => liters * LITER_TO_GALLON;

  const convertVolume = (volume: number, fromUnit: 'LT' | 'GL' = 'LT'): { volumeLT: number; volumeGL: number } => {
    if (fromUnit === 'GL') {
      return { volumeGL: volume, volumeLT: gallonsToLiters(volume) };
    }
    return { volumeLT: volume, volumeGL: litersToGallons(volume) };
  };

  const formatVolume = (value: number, decimals: number = 2): string =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value || 0);

  return { gallonsToLiters, litersToGallons, convertVolume, formatVolume, GALLON_TO_LITER_FACTOR: GALLON_TO_LITER, LITER_TO_GALLON_FACTOR: LITER_TO_GALLON };
};

export default VolumeDisplay;
