import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { StationSource, DetailedGeoJsonStation, GeoJsonStation } from 'api/stationAPI'
import { AppThunk } from 'app/store'
import { logError } from 'utils/error'
export interface StationsState {
  loading: boolean
  error: string | null
  stations: GeoJsonStation[] | DetailedGeoJsonStation[]
  stationsByCode: Record<number, GeoJsonStation | DetailedGeoJsonStation | undefined>
  selectedStationsByCode: number[]
  codesOfRetrievedStationData: number[]
}

const initialState: StationsState = {
  loading: false,
  error: null,
  stations: [],
  stationsByCode: {},
  selectedStationsByCode: [],
  codesOfRetrievedStationData: []
}

const stationsSlice = createSlice({
  name: 'stations',
  initialState,
  reducers: {
    getStationsStart(state: StationsState) {
      state.loading = true
    },
    getStationsFailed(state: StationsState, action: PayloadAction<string>) {
      state.loading = false
      state.error = action.payload
    },
    getStationsSuccess(state: StationsState, action: PayloadAction<GeoJsonStation[] | DetailedGeoJsonStation[]>) {
      state.error = null
      state.stations = action.payload
      const stationsByCode: StationsState['stationsByCode'] = {}
      action.payload.forEach(station => {
        stationsByCode[station.properties.code] = station
      })
      state.stationsByCode = stationsByCode
      state.loading = false
    },
    selectStation(state: StationsState, action: PayloadAction<number>) {
      const selectedStationsList = state.selectedStationsByCode
      selectedStationsList.push(action.payload)
      const selectedStationsSet = new Set(selectedStationsList)
      state.selectedStationsByCode = Array.from(selectedStationsSet.values())
    },
    selectStations(state: StationsState, action: PayloadAction<number[]>) {
      state.selectedStationsByCode = []
      state.selectedStationsByCode = action.payload
    }
  }
})

export const fetchWxStations =
  (
    stationGetter:
      | ((source: StationSource, toi?: string) => Promise<GeoJsonStation[]>)
      | ((source: StationSource, toi?: string) => Promise<DetailedGeoJsonStation[]>),
    source: StationSource = StationSource.unspecified,
    toi?: string
  ): AppThunk =>
  async dispatch => {
    try {
      dispatch(getStationsStart())
      const stations = await stationGetter(source, toi)
      dispatch(getStationsSuccess(stations))
    } catch (err) {
      dispatch(getStationsFailed((err as Error).toString()))
      logError(err)
    }
  }

export const { getStationsStart, getStationsFailed, getStationsSuccess, selectStation, selectStations } =
  stationsSlice.actions

export default stationsSlice.reducer
