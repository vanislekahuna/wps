import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { AppThunk } from 'app/store'
import { logError } from 'utils/error'
import {
  loadDefaultHFIResult,
  setNewFireStarts,
  setFuelType,
  getPrepDateRange,
  setStationSelected,
  getPDF,
  RawDaily,
  StationDaily,
  getFuelTypes,
  FuelType,
  FireCentre,
  FuelTypesResponse
} from 'api/hfiCalculatorAPI'
import { DateTime } from 'luxon'

export interface FireStartRange {
  label: string
  id: number
}

export interface PrepDateRange {
  start_date: string
  end_date: string
}

export interface DailyResult {
  date: DateTime
  dailies: ValidatedStationDaily[]
  mean_intensity_group: number | undefined
  prep_level: number | undefined
  fire_starts: FireStartRange
}

export interface RawDailyResult {
  date: string
  dailies: RawValidatedStationDaily[]
  mean_intensity_group: number | undefined
  prep_level: number | undefined
  fire_starts: FireStartRange
}

export interface PlanningAreaResult {
  planning_area_id: number
  all_dailies_valid: boolean
  highest_daily_intensity_group: number
  mean_prep_level: number | undefined
  daily_results: DailyResult[]
}

export interface RawPlanningAreaResult {
  planning_area_id: number
  all_dailies_valid: boolean
  highest_daily_intensity_group: number
  mean_prep_level: number | undefined
  daily_results: RawDailyResult[]
}

export interface HFICalculatorState {
  pdfLoading: boolean
  fireCentresLoading: boolean
  fuelTypesLoading: boolean
  error: string | null
  dateRange: PrepDateRange | undefined
  selectedPrepDate: string
  planningAreaFireStarts: { [key: string]: FireStartRange[] }
  planningAreaHFIResults: { [key: string]: PlanningAreaResult }
  selectedFireCentre: FireCentre | undefined
  result: HFIResultResponse | undefined
  fuelTypes: FuelType[]
  changeSaved: boolean
}

export interface StationInfo {
  station_code: number
  selected: boolean
  fuel_type_id: number
}

export interface HFIResultResponse {
  date_range: PrepDateRange
  selected_fire_center_id: number
  planning_area_station_info: { [key: number]: StationInfo[] }
  planning_area_hfi_results: PlanningAreaResult[]
  fire_start_ranges: FireStartRange[]
}

export interface RawHFIResultResponse {
  date_range: PrepDateRange
  selected_fire_center_id: number
  planning_area_station_info: { [key: number]: StationInfo[] }
  planning_area_hfi_results: RawPlanningAreaResult[]
  fire_start_ranges: FireStartRange[]
}

export interface HFILoadResultRequest {
  start_date?: string
  end_date?: string
  selected_fire_center_id: number
}

export interface ValidatedStationDaily {
  daily: StationDaily
  valid: boolean
}

export interface RawValidatedStationDaily {
  daily: RawDaily
  valid: boolean
}

export const initialState: HFICalculatorState = {
  pdfLoading: false,
  fireCentresLoading: false,
  fuelTypesLoading: false,
  error: null,
  dateRange: undefined,
  selectedPrepDate: '',
  planningAreaFireStarts: {},
  planningAreaHFIResults: {},
  selectedFireCentre: undefined,
  result: undefined,
  fuelTypes: [],
  changeSaved: false
}

const dailiesSlice = createSlice({
  name: 'dailies',
  initialState,
  reducers: {
    loadHFIResultStart(state: HFICalculatorState) {
      state.fireCentresLoading = true
      state.changeSaved = false
    },
    fetchFuelTypesStart(state: HFICalculatorState) {
      state.fuelTypesLoading = true
    },
    pdfDownloadStart(state: HFICalculatorState) {
      state.pdfLoading = true
    },
    pdfDownloadEnd(state: HFICalculatorState) {
      state.pdfLoading = false
    },
    getHFIResultFailed(state: HFICalculatorState, action: PayloadAction<string>) {
      state.error = action.payload
      state.fireCentresLoading = false
      state.changeSaved = false
    },
    fetchFuelTypesFailed(state: HFICalculatorState, action: PayloadAction<string>) {
      state.error = action.payload
      state.fuelTypesLoading = false
    },
    setSelectedPrepDate: (state: HFICalculatorState, action: PayloadAction<string>) => {
      state.selectedPrepDate = action.payload
    },
    setSelectedFireCentre: (
      state: HFICalculatorState,
      action: PayloadAction<FireCentre | undefined>
    ) => {
      state.selectedFireCentre = action.payload
    },
    setChangeSaved: (state: HFICalculatorState, action: PayloadAction<boolean>) => {
      state.changeSaved = action.payload
    },
    setResult: (
      state: HFICalculatorState,
      action: PayloadAction<HFIResultResponse | undefined>
    ) => {
      state.result = action.payload
      state.dateRange = action.payload?.date_range
      state.fireCentresLoading = false
    },
    setFuelTypes: (
      state: HFICalculatorState,
      action: PayloadAction<FuelTypesResponse>
    ) => {
      state.fuelTypes = action.payload.fuel_types
      state.fuelTypesLoading = false
    }
  }
})

export const {
  loadHFIResultStart,
  fetchFuelTypesStart,
  pdfDownloadStart,
  pdfDownloadEnd,
  getHFIResultFailed,
  fetchFuelTypesFailed,
  setSelectedPrepDate,
  setSelectedFireCentre,
  setFuelTypes,
  setResult,
  setChangeSaved
} = dailiesSlice.actions

export default dailiesSlice.reducer

export const fetchLoadDefaultHFIResult =
  (fire_center_id: number): AppThunk =>
  async dispatch => {
    try {
      dispatch(loadHFIResultStart())
      const result = await loadDefaultHFIResult(fire_center_id)
      dispatch(setResult(result))
    } catch (err) {
      dispatch(getHFIResultFailed((err as Error).toString()))
      logError(err)
    }
  }

export const fetchSetStationSelected =
  (
    fire_center_id: number,
    start_date: string,
    end_date: string,
    planning_area_id: number,
    station_code: number,
    selected: boolean
  ): AppThunk =>
  async dispatch => {
    try {
      dispatch(loadHFIResultStart())
      const result = await setStationSelected(
        fire_center_id,
        start_date,
        end_date,
        planning_area_id,
        station_code,
        selected
      )
      dispatch(setResult(result))
      dispatch(setChangeSaved(true))
    } catch (err) {
      dispatch(getHFIResultFailed((err as Error).toString()))
      logError(err)
    }
  }

export const fetchSetFuelType =
  (
    fire_center_id: number,
    start_date: string,
    end_date: string,
    planning_area_id: number,
    station_code: number,
    fuel_type_id: number
  ): AppThunk =>
  async dispatch => {
    try {
      dispatch(loadHFIResultStart())
      const result = await setFuelType(
        fire_center_id,
        start_date,
        end_date,
        planning_area_id,
        station_code,
        fuel_type_id
      )
      dispatch(setResult(result))
      dispatch(setChangeSaved(true))
    } catch (err) {
      dispatch(getHFIResultFailed((err as Error).toString()))
      logError(err)
    }
  }

export const fetchGetPrepDateRange =
  (fire_center_id: number, start_date: Date, end_date: Date): AppThunk =>
  async dispatch => {
    try {
      dispatch(loadHFIResultStart())
      const result = await getPrepDateRange(fire_center_id, start_date, end_date)
      dispatch(setResult(result))
    } catch (err) {
      dispatch(getHFIResultFailed((err as Error).toString()))
      logError(err)
    }
  }

export const fetchFuelTypes = (): AppThunk => async dispatch => {
  try {
    dispatch(fetchFuelTypesStart())
    const fuelTypes = await getFuelTypes()
    dispatch(setFuelTypes(fuelTypes))
  } catch (err) {
    dispatch(fetchFuelTypesFailed((err as Error).toString()))
    logError(err)
  }
}

export const fetchSetNewFireStarts =
  (
    fire_center_id: number,
    start_date: string,
    end_date: string,
    planning_area_id: number,
    prep_day_date: string,
    fire_start_range_id: number
  ): AppThunk =>
  async dispatch => {
    try {
      dispatch(loadHFIResultStart())
      const result = await setNewFireStarts(
        fire_center_id,
        start_date,
        end_date,
        planning_area_id,
        prep_day_date,
        fire_start_range_id
      )
      dispatch(setResult(result))
      dispatch(setChangeSaved(true))
    } catch (err) {
      dispatch(getHFIResultFailed((err as Error).toString()))
      logError(err)
    }
  }

export const fetchPDFDownload =
  (fire_center_id: number, start_date: string, end_date: string): AppThunk =>
  async dispatch => {
    try {
      dispatch(pdfDownloadStart())
      await getPDF(fire_center_id, start_date, end_date)
      dispatch(pdfDownloadEnd())
    } catch (err) {
      dispatch(getHFIResultFailed((err as Error).toString()))
      logError(err)
    }
  }
