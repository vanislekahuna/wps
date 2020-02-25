import axios from 'api/axios'

interface SeasonResponse {
  start_month: number
  start_day: number
  end_month: number
  end_day: number
}

interface YearRange {
  start: number
  end: number
}

interface StationSummaryResponse {
  FFMC: number
  ISI: number
  BUI: number
  season: SeasonResponse
  year_range: YearRange
  station_name: string
}

interface MeanValues {
  FFMC: number
  ISI: number
  BUI: number
}

interface PercentilesResponse {
  stations: {
    [code: number]: StationSummaryResponse
  }
  mean_values: MeanValues
  year_range: YearRange
  percentile: number
}

export async function getPercentiles(
  stations: number[],
  percentile: number,
  year_range: YearRange
): Promise<PercentilesResponse> {
  const url = '/percentiles'

  try {
    const { data } = await axios.post(url, {
      stations,
      percentile,
      year_range
    })
    return data
  } catch (err) {
    throw err
  }
}
