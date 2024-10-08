import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getCHainesGeoJSON } from 'api/cHainesAPI'
import { AppThunk } from 'app/store'
import { logError } from 'utils/error'
import { FeatureCollection } from 'geojson'

export interface CHainesPredictionState {
  loading: boolean
  error: string | null
  model_runs: Record<string, Record<string, FeatureCollection>>
}

interface GeoJSONContext {
  model_run_timestamp: string
  prediction_timestamp: string
  result: FeatureCollection
}

const initialState: CHainesPredictionState = {
  loading: false,
  error: null,
  model_runs: {}
}

const cHainesPredictionsSlice = createSlice({
  name: 'c-haines-predictions',
  initialState: initialState,
  reducers: {
    getPredictionStart(state: CHainesPredictionState) {
      state.loading = true
    },
    getPredictionSuccess(state: CHainesPredictionState, action: PayloadAction<GeoJSONContext>) {
      state.model_runs[action.payload.model_run_timestamp][action.payload.prediction_timestamp] = action.payload.result
    },
    getPredictionFailed(state: CHainesPredictionState, action: PayloadAction<string>) {
      state.loading = false
      state.error = action.payload
    }
  }
})

const { getPredictionStart, getPredictionSuccess, getPredictionFailed } = cHainesPredictionsSlice.actions

export default cHainesPredictionsSlice.reducer

export const fetchCHainesGeoJSON =
  (model_abbreviation: string, model_run_timestamp: string, prediction_timestamp: string): AppThunk =>
  async dispatch => {
    try {
      dispatch(getPredictionStart())
      const geoJSON = await getCHainesGeoJSON(model_abbreviation, model_run_timestamp, prediction_timestamp)
      const result = {
        model: model_abbreviation,
        model_run_timestamp: model_run_timestamp,
        prediction_timestamp: prediction_timestamp,
        result: geoJSON
      }
      dispatch(getPredictionSuccess(result))
    } catch (err) {
      dispatch(getPredictionFailed((err as Error).toString()))
      logError(err)
    }
  }
