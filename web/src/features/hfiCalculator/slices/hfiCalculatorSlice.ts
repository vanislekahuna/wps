import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { AppThunk } from 'app/store'
import { logError } from 'utils/error'
import { getDailies, StationDaily } from 'api/hfiCalculatorAPI'
import { groupBy, isNull, isUndefined, range } from 'lodash'
import { NUM_WEEK_DAYS } from 'features/hfiCalculator/constants'
import { FireCentre } from 'api/hfiCalcAPI'
import { DateTime } from 'luxon'

export interface HFIResult {
  dailies: StationDaily[]
  dailyMeanIntensity: number | undefined
  dailyMeanIntensityGroups: (number | undefined)[]
  maxMeanIntensityGroup: number | undefined
  dailyPrepLevel: number | undefined
  dailyPrepLevels: (number | undefined)[]
  meanPrepLevel: number | undefined
}

export interface HFICalculatorState {
  loading: boolean
  error: string | null
  dailies: StationDaily[]
  numPrepDays: number
  selectedStationCodes: number[]
  selectedPrepDate: string
  formattedDateStringHeaders: string[]
  planningAreaHFIResults: { [key: string]: HFIResult }
  selectedFireCentre: FireCentre | undefined
}

const initialState: HFICalculatorState = {
  loading: false,
  error: null,
  dailies: [],
  numPrepDays: NUM_WEEK_DAYS,
  selectedStationCodes: [],
  selectedPrepDate: '',
  formattedDateStringHeaders: [],
  planningAreaHFIResults: {},
  selectedFireCentre: undefined
}

export const calculateMeanIntensity = (dailies: StationDaily[]): number | undefined =>
  dailies.length === 0
    ? undefined
    : Math.round(
        (10 * dailies.map(daily => daily.intensity_group).reduce((a, b) => a + b, 0)) /
          dailies.length
      ) / 10

export const calculateDailyMeanIntensities = (
  dailies: StationDaily[],
  numPrepDays: number
): (number | undefined)[] => {
  const utcDict = groupBy(dailies, (daily: StationDaily) => daily.date.toUTC().toMillis())

  const dailiesByDayUTC = new Map(
    Object.entries(utcDict).map(entry => [Number(entry[0]), entry[1]])
  )

  return range(numPrepDays).map(i => {
    const orderedDayTimestamps = Array.from(dailiesByDayUTC.keys()).sort((a, b) => a - b)

    const dailiesForDay: StationDaily[] | undefined = dailiesByDayUTC.get(
      orderedDayTimestamps[i]
    )
    return dailiesForDay ? calculateMeanIntensity(dailiesForDay) : undefined
  })
}

export const calculateMaxMeanIntensityGroup = (
  dailyMeanIntensityGroups: (number | undefined)[]
): number => Math.max(...dailyMeanIntensityGroups.filter(isDefined))

const isDefined = (item: number | undefined): item is number => {
  return !!item
}

export const calculateDailyPrepLevels = (
  dailyMeanIntensityGroups: (number | undefined)[]
): (number | undefined)[] => {
  const prepLevels: (number | undefined)[] = []
  range(NUM_WEEK_DAYS).map(day => {
    const meanIntensityGroup = dailyMeanIntensityGroups[day]
    prepLevels.push(calculatePrepLevel(meanIntensityGroup))
  })
  return prepLevels
}

export const calculatePrepLevel = (
  meanIntensityGroup: number | undefined
): number | undefined => {
  // for now, prep level calculation assumed a fixed Fire Starts value of 0-1

  if (isUndefined(meanIntensityGroup)) {
    return undefined
  }

  const roundedMeanIntensityGroup = Math.round(meanIntensityGroup)

  if (roundedMeanIntensityGroup < 3) {
    return 1
  }
  if (roundedMeanIntensityGroup < 4) {
    return 2
  }
  if (roundedMeanIntensityGroup < 5) {
    return 3
  }
  return 4
}

export const calculateMeanPrepLevel = (
  rawMeanIntensityGroups: (number | undefined)[]
): number | undefined => {
  // for now, prep level calculation assumed a fixed Fire Starts value of 0-1
  if (isUndefined(rawMeanIntensityGroups)) {
    return undefined
  }
  const existingDailies: number[] = []
  rawMeanIntensityGroups.forEach(daily => {
    if (!isUndefined(daily)) {
      existingDailies.push(Math.round(daily))
    }
  })
  return Math.round(existingDailies?.reduce((a, b) => a + b, 0) / existingDailies.length)
}

// TODO: Inefficient, improve if it becomes a problem
const calculateHFIResults = (
  fireCentre: FireCentre | undefined,
  dailies: StationDaily[],
  numPrepDays: number,
  selected: number[],
  selectedPrepDayIso: string
): { [key: string]: HFIResult } => {
  const selectedPrepDay =
    selectedPrepDayIso == '' ? null : DateTime.fromISO(selectedPrepDayIso)
  const planningAreaToDailies: { [key: string]: HFIResult } = {}

  if (isUndefined(fireCentre)) {
    return planningAreaToDailies
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(fireCentre.planning_areas).forEach(([__, area]) => {
    const areaStationCodes = new Set(
      Object.entries(area.stations).map(([, station]) => station.code)
    )
    const areaDailies = dailies.filter(
      daily => selected.includes(daily.code) && areaStationCodes.has(daily.code)
    )

    const dailyMeanIntensity = calculateMeanIntensity(
      isNull(selectedPrepDayIso)
        ? areaDailies
        : areaDailies.filter(
            day =>
              day.date.year === selectedPrepDay?.year &&
              day.date.month === selectedPrepDay?.month &&
              day.date.day === selectedPrepDay?.day
          )
    )
    const dailyMeanIntensityGroups = calculateDailyMeanIntensities(
      areaDailies,
      numPrepDays
    )
    const maxMeanIntensityGroup = calculateMaxMeanIntensityGroup(dailyMeanIntensityGroups)
    const dailyPrepLevel = calculatePrepLevel(dailyMeanIntensity)
    const dailyPrepLevels = calculateDailyPrepLevels(dailyMeanIntensityGroups)
    const meanPrepLevel = calculateMeanPrepLevel(dailyPrepLevels)
    planningAreaToDailies[area.name] = {
      dailies: areaDailies,
      dailyMeanIntensity,
      dailyMeanIntensityGroups,
      maxMeanIntensityGroup,
      dailyPrepLevel,
      dailyPrepLevels,
      meanPrepLevel
    }
  })
  return planningAreaToDailies
}

const dailiesSlice = createSlice({
  name: 'dailies',
  initialState,
  reducers: {
    getDailiesStart(state: HFICalculatorState) {
      state.loading = true
    },
    getDailiesFailed(state: HFICalculatorState, action: PayloadAction<string>) {
      state.error = action.payload
      state.loading = false
    },
    getDailiesSuccess(
      state: HFICalculatorState,
      action: PayloadAction<{
        dailies: StationDaily[]
        fireCentre: FireCentre | undefined
        selectedStationCodes: number[]
      }>
    ) {
      state.error = null
      state.dailies = action.payload.dailies
      state.selectedFireCentre = action.payload.fireCentre
      state.selectedStationCodes = action.payload.selectedStationCodes
      state.planningAreaHFIResults = calculateHFIResults(
        action.payload.fireCentre,
        action.payload.dailies,
        state.numPrepDays,
        action.payload.selectedStationCodes,
        state.selectedPrepDate
      )
      state.loading = false
    },
    setPrepDays: (state, action: PayloadAction<number>) => {
      state.numPrepDays = action.payload
      state.planningAreaHFIResults = calculateHFIResults(
        state.selectedFireCentre,
        state.dailies,
        action.payload,
        state.selectedStationCodes,
        state.selectedPrepDate
      )
    },
    setSelectedSelectedStationCodes: (state, action: PayloadAction<number[]>) => {
      state.selectedStationCodes = action.payload
      state.planningAreaHFIResults = calculateHFIResults(
        state.selectedFireCentre,
        state.dailies,
        state.numPrepDays,
        action.payload,
        state.selectedPrepDate
      )
    },
    setSelectedPrepDate: (state, action: PayloadAction<string>) => {
      state.selectedPrepDate = action.payload
      state.planningAreaHFIResults = calculateHFIResults(
        state.selectedFireCentre,
        state.dailies,
        state.numPrepDays,
        state.selectedStationCodes,
        action.payload
      )
    },
    setSelectedFireCentre: (state, action: PayloadAction<FireCentre | undefined>) => {
      state.selectedFireCentre = action.payload
      state.planningAreaHFIResults = calculateHFIResults(
        state.selectedFireCentre,
        state.dailies,
        state.numPrepDays,
        state.selectedStationCodes,
        state.selectedPrepDate
      )
    }
  }
})

export const {
  getDailiesStart,
  getDailiesFailed,
  getDailiesSuccess,
  setPrepDays,
  setSelectedSelectedStationCodes,
  setSelectedPrepDate,
  setSelectedFireCentre
} = dailiesSlice.actions

export default dailiesSlice.reducer

export const fetchHFIDailies =
  (
    fireCentre: FireCentre | undefined,
    stationCodesToFetch: number[],
    selectedStationCodes: number[],
    startTime: number,
    endTime: number
  ): AppThunk =>
  async dispatch => {
    try {
      dispatch(getDailiesStart())
      const dailies = await getDailies(startTime, endTime, stationCodesToFetch)
      dispatch(getDailiesSuccess({ dailies, fireCentre, selectedStationCodes }))
    } catch (err) {
      dispatch(getDailiesFailed((err as Error).toString()))
      logError(err)
    }
  }
