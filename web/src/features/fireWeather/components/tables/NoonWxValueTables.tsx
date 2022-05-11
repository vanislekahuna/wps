import React from 'react'

import { ModelValue } from 'api/modelAPI'
import { NoonForecastValue } from 'api/forecastAPI'
import {
  formatTemperature,
  formatWindSpeed,
  formatWindDirection,
  formatRelativeHumidity,
  formatPrecipitation
} from 'utils/format'
import { formatDatetimeInPST } from 'utils/date'
import SortableTableByDatetime, { Column } from 'features/fireWeather/components/tables/SortableTableByDatetime'

/**
 * Reusable component used to display noon forecasts (issued by forecasters)
 * and/or model forecasts (generated by computer-run models) in table format
 */

const sharedColumns: Column[] = [
  {
    id: 'datetime',
    label: 'Date (PST)',
    minWidth: 120,
    align: 'left',
    formatDt: (value: string): string => formatDatetimeInPST(value)
  },
  {
    id: 'temperature',
    label: 'Temp (°C)',
    align: 'right',
    format: formatTemperature,
    maxWidth: 70
  },
  {
    id: 'relative_humidity',
    label: 'RH (%)',
    align: 'right',
    format: formatRelativeHumidity,
    maxWidth: 70
  },
  {
    id: 'wind_direction',
    label: 'Wind Dir (10m) (°)',
    align: 'right',
    format: formatWindDirection,
    maxWidth: 70
  },
  {
    id: 'wind_speed',
    label: 'Wind Spd (10m) (km/h)',
    maxWidth: 70,
    align: 'right',
    format: formatWindSpeed
  }
]

export const noonModelTableColumns: Column[] = [
  ...sharedColumns,
  {
    id: 'delta_precipitation',
    label: 'Precip (mm)',
    maxWidth: 70,
    align: 'right',
    format: formatPrecipitation
  },
  {
    id: 'model_run_datetime',
    label: 'Model Run (UTC)',
    minWidth: 120,
    align: 'right',
    formatDt: (value: string): string => value.slice(0, 13)
  }
]

interface NoonModelTableProps {
  testId: string
  title: string
  rows: ModelValue[] | undefined
}

export const NoonModelTable = React.memo(function _(props: NoonModelTableProps) {
  return <SortableTableByDatetime {...props} columns={noonModelTableColumns} />
})

interface NoonForecastTableProps {
  testId: string
  title: string
  rows: NoonForecastValue[] | undefined
}

export const noonForecastTableColumns: Column[] = [
  ...sharedColumns,
  {
    id: 'total_precipitation',
    label: 'Precip (mm)',
    maxWidth: 70,
    align: 'right',
    format: formatPrecipitation
  }
]

export const NoonForecastTable = React.memo(function _(props: NoonForecastTableProps) {
  return <SortableTableByDatetime {...props} columns={noonForecastTableColumns} />
})
