import { PlanningArea } from 'api/hfiCalcAPI'
import { StationDaily } from 'api/hfiCalculatorAPI'
import {
  HFIResultResponse,
  PrepDateRange
} from 'features/hfiCalculator/slices/hfiCalculatorSlice'
import { groupBy, isUndefined, sortBy, take } from 'lodash'
import { DateTime } from 'luxon'

export const getDailiesForArea = (
  area: PlanningArea,
  dailies: StationDaily[],
  selected: number[]
): StationDaily[] => {
  const areaStationCodes = new Set(
    Object.entries(area.stations).map(([, station]) => station.code)
  )
  return dailies.filter(
    daily => selected.includes(daily.code) && areaStationCodes.has(daily.code)
  )
}

export const getZoneFromAreaName = (areaName: string): string => {
  return areaName.slice(-3)
}

export const calculateNumPrepDays = (dateRange: PrepDateRange | undefined): number => {
  if (
    !isUndefined(dateRange) &&
    !isUndefined(dateRange.start_date) &&
    !isUndefined(dateRange.end_date)
  ) {
    const start = DateTime.fromISO(dateRange.start_date)
    const end = DateTime.fromISO(dateRange.end_date)
    return end.diff(start, 'days').days + 1
  }
  return 0
}

export const getDailiesByStationCode = (
  result: HFIResultResponse | undefined,
  stationCode: number
): StationDaily[] => {
  if (isUndefined(result)) {
    return []
  }
  const dailies = result.planning_area_hfi_results.flatMap(areaResult =>
    areaResult.daily_results.flatMap(dr =>
      dr.dailies.flatMap(validatedDaily => validatedDaily.daily)
    )
  )
  const stationCodeDict = groupBy(dailies, 'code')
  const dailiesByCode = new Map<number, StationDaily[]>()

  Object.keys(stationCodeDict).forEach(key => {
    dailiesByCode.set(Number(key), stationCodeDict[key])
  })

  const dailiesForCode = take(
    sortBy(dailiesByCode.get(stationCode), daily => daily.date.toMillis()),
    calculateNumPrepDays(result.date_range)
  )

  return dailiesForCode ? dailiesForCode : []
}

export const stationCodeSelected = (
  result: HFIResultResponse | undefined,
  planningAreaId: number,
  code: number
): boolean => {
  if (
    !isUndefined(result) &&
    !isUndefined(result.planning_area_station_info[planningAreaId])
  ) {
    const station_info = result.planning_area_station_info[planningAreaId].find(
      info => info.station_code === code
    )
    return station_info?.selected ?? false
  }
  return false
}
