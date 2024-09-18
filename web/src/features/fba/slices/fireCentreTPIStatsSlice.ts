import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { AppThunk } from 'app/store'
import { logError } from 'utils/error'
import { FireZoneTPIStats, getFireCentreTPIStats, RunType } from 'api/fbaAPI'

export interface CentreTPIStatsState {
  error: string | null
  fireCentreTPIStats: Record<string, FireZoneTPIStats[]> | null
}

export const initialState: CentreTPIStatsState = {
  error: null,
  fireCentreTPIStats: null
}

const fireCentreTPIStatsSlice = createSlice({
  name: 'fireCentreTPIStats',
  initialState,
  reducers: {
    getFireCentreTPIStatsStart(state: CentreTPIStatsState) {
      state.error = null
      state.fireCentreTPIStats = null
    },
    getFireCentreTPIStatsFailed(state: CentreTPIStatsState, action: PayloadAction<string>) {
      state.error = action.payload
    },
    getFireCentreTPIStatsSuccess(
      state: CentreTPIStatsState,
      action: PayloadAction<Record<string, FireZoneTPIStats[]>>
    ) {
      state.error = null
      state.fireCentreTPIStats = action.payload
    }
  }
})

export const { getFireCentreTPIStatsStart, getFireCentreTPIStatsFailed, getFireCentreTPIStatsSuccess } =
  fireCentreTPIStatsSlice.actions

export default fireCentreTPIStatsSlice.reducer

export const fetchFireCentreTPIStats =
  (fireCentre: string, runType: RunType, forDate: string, runDatetime: string): AppThunk =>
  async dispatch => {
    try {
      dispatch(getFireCentreTPIStatsStart())
      const fireCentreTPIStats = await getFireCentreTPIStats(fireCentre, runType, forDate, runDatetime)
      dispatch(getFireCentreTPIStatsSuccess(fireCentreTPIStats))
    } catch (err) {
      dispatch(getFireCentreTPIStatsFailed((err as Error).toString()))
      logError(err)
    }
  }
