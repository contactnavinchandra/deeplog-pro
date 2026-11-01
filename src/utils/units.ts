import { UnitSystem } from '../types/dive';

export function formatDepth(meters: number, unit: UnitSystem, includeUnit = true): string {
  if (unit === 'imperial') {
    const feet = Math.round(meters * 3.28084);
    return includeUnit ? `${feet} ft` : `${feet}`;
  }
  const rounded = Number.isInteger(meters) ? meters.toString() : meters.toFixed(1);
  return includeUnit ? `${rounded} m` : rounded;
}

export function formatPressure(bar: number, unit: UnitSystem, includeUnit = true): string {
  if (unit === 'imperial') {
    const psi = Math.round(bar * 14.5038);
    return includeUnit ? `${psi} psi` : `${psi}`;
  }
  return includeUnit ? `${bar} bar` : `${bar}`;
}

export function formatTemp(celsius: number, unit: UnitSystem, includeUnit = true): string {
  if (unit === 'imperial') {
    const fahrenheit = Math.round((celsius * 9) / 5 + 32);
    return includeUnit ? `${fahrenheit}°F` : `${fahrenheit}°`;
  }
  return includeUnit ? `${celsius}°C` : `${celsius}°`;
}

export function getDepthUnitLabel(unit: UnitSystem): string {
  return unit === 'metric' ? 'm' : 'ft';
}

export function getPressureUnitLabel(unit: UnitSystem): string {
  return unit === 'metric' ? 'bar' : 'psi';
}

export function getTempUnitLabel(unit: UnitSystem): string {
  return unit === 'metric' ? '°C' : '°F';
}
