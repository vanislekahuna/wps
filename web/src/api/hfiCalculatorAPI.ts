import axios from 'api/axios'
import { AdminStation } from 'features/hfiCalculator/components/stationAdmin/AddStationModal'
import {
  HFIResultResponse,
  PlanningAreaResult,
  RawHFIResultResponse
} from 'features/hfiCalculator/slices/hfiCalculatorSlice'
import { DateTime } from 'luxon'
import { formatISODateInPST } from 'utils/date'

export interface FuelType {
  id: number
  abbrev: string
  description: string
  fuel_type_code: string
  percentage_conifer: number
  percentage_dead_fir: number
}

export interface FuelTypesResponse {
  fuel_types: FuelType[]
}

export interface WeatherStationProperties {
  name: string
  elevation: number | null
  uuid: string
}

export interface FireCentre {
  id: number
  name: string
  planning_areas: PlanningArea[]
}

export interface PlanningArea {
  id: number
  name: string
  order_of_appearance_in_list: number
  stations: WeatherStation[]
}

export interface WeatherStation {
  code: number
  station_props: WeatherStationProperties
  order_of_appearance_in_planning_area_list?: number
}

export interface AddStationRequest {
  planning_area_id: number
  station_code: number
  fuel_type_id: number
}

export interface HFIWeatherStationsResponse {
  fire_centres: FireCentre[]
}
export interface StationDaily {
  code: number
  status: string
  temperature: number
  relative_humidity: number
  wind_speed: number
  wind_direction: number
  grass_cure_percentage: number
  precipitation: number
  ffmc: number | null
  dmc: number | null
  dc: number | null
  isi: number | null
  bui: number | null
  fwi: number | null
  danger_class: number
  rate_of_spread: number
  hfi: number | null
  observation_valid: boolean
  observation_valid_comment: string
  intensity_group: number
  sixty_minute_fire_size: number
  fire_type: string
  date: DateTime
  last_updated: DateTime
}

/**
 * Axios does't marshal complex objects like DateTime.
 * RawDaily is the daily representation over the wire (a string date)
 * that we then marshall into a StationDaily (with a DateTime)
 */
export interface RawDaily extends Omit<StationDaily, 'date' | 'last_updated'> {
  date: string
  last_updated: string
}

export interface StationDailyResponse {
  dailies: RawDaily[]
}

const baseUrl = '/hfi-calc/'

export async function getHFIStations(): Promise<HFIWeatherStationsResponse> {
  const url = '/hfi-calc/fire-centres'
  const { data } = await axios.get(url)

  return data
}

export async function loadDefaultHFIResult(fire_center_id: number): Promise<HFIResultResponse> {
  const { data } = await axios.get<RawHFIResultResponse>(baseUrl + 'fire_centre/' + fire_center_id)
  return { ...data, planning_area_hfi_results: buildResult(data) }
}

export async function getFuelTypes(): Promise<FuelTypesResponse> {
  const data = await axios.get<FuelTypesResponse>(baseUrl + 'fuel_types')
  return data.data
}

export async function addNewStation(
  fireCentreId: number,
  newStation: Required<Omit<AdminStation, 'dirty'>>
): Promise<number> {
  const requestBody: AddStationRequest = {
    planning_area_id: newStation.planningArea.id,
    station_code: newStation.station.code,
    fuel_type_id: newStation.fuelType.id
  }
  const { status } = await axios.post<number>(baseUrl + 'admin/add-station/' + fireCentreId, requestBody)
  return status
}

export async function setStationSelected(
  fire_center_id: number,
  start_date: string,
  end_date: string,
  planning_area_id: number,
  station_code: number,
  selected: boolean
): Promise<HFIResultResponse> {
  const url =
    baseUrl +
    'fire_centre/' +
    fire_center_id +
    '/' +
    start_date +
    '/' +
    end_date +
    '/planning_area/' +
    planning_area_id +
    '/station/' +
    station_code +
    '/selected/' +
    selected

  const { data } = await axios.post<RawHFIResultResponse>(url)
  return { ...data, planning_area_hfi_results: buildResult(data) }
}

export async function setFuelType(
  fire_center_id: number,
  start_date: string,
  end_date: string,
  planning_area_id: number,
  station_code: number,
  fuel_type_id: number
): Promise<HFIResultResponse> {
  const url =
    baseUrl +
    'fire_centre/' +
    fire_center_id +
    '/' +
    start_date +
    '/' +
    end_date +
    '/planning_area/' +
    planning_area_id +
    '/station/' +
    station_code +
    '/fuel_type/' +
    fuel_type_id

  const { data } = await axios.post<RawHFIResultResponse>(url)
  return { ...data, planning_area_hfi_results: buildResult(data) }
}

export async function getPrepDateRange(
  fire_centre_id: number,
  start_date: string,
  end_date: string
): Promise<HFIResultResponse> {
  const url = baseUrl + 'fire_centre/' + fire_centre_id + '/' + start_date + '/' + end_date

  const { data } = await axios.get<RawHFIResultResponse>(url)
  return { ...data, planning_area_hfi_results: buildResult(data) }
}

export async function setNewFireStarts(
  fire_center_id: number,
  start_date: string,
  end_date: string,
  planning_area_id: number,
  prep_day_date: string,
  fire_start_range_id: number
): Promise<HFIResultResponse> {
  const url =
    baseUrl +
    'fire_centre/' +
    fire_center_id +
    '/' +
    start_date +
    '/' +
    end_date +
    '/planning_area/' +
    planning_area_id +
    '/fire_starts/' +
    prep_day_date +
    '/fire_start_range/' +
    fire_start_range_id

  const { data } = await axios.post<RawHFIResultResponse>(url)
  return { ...data, planning_area_hfi_results: buildResult(data) }
}

function buildResult(data: RawHFIResultResponse) {
  const planningAreaResultsWithDates: PlanningAreaResult[] = data.planning_area_hfi_results.map(areaResult => ({
    ...areaResult,
    daily_results: areaResult.daily_results.map(dr => ({
      ...dr,
      dailies: dr.dailies.map(validatedDaily => ({
        ...validatedDaily,
        daily: {
          ...validatedDaily.daily,
          date: formatISODateInPST(validatedDaily.daily.date),
          last_updated: DateTime.fromISO(validatedDaily.daily.last_updated)
        }
      })),
      date: formatISODateInPST(dr.date)
    }))
  }))
  return planningAreaResultsWithDates
}

export async function getPDF(fire_center_id: number, start_date: string, end_date: string): Promise<void> {
  const response = await axios.get(
    baseUrl + 'fire_centre/' + fire_center_id + '/' + start_date + '/' + end_date + '/pdf',
    {
      responseType: 'blob'
    }
  )
  const filename = (response.headers['content-disposition'] as string).split('=')[1]
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
}
