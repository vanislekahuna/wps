import {
  GridAlignment,
  GridCellParams,
  GridColDef,
  GridColumnHeaderParams,
  GridRenderCellParams,
  GridValueFormatterParams,
  GridValueGetterParams,
  GridValueSetterParams
} from '@mui/x-data-grid'
import { WeatherDeterminate, WeatherDeterminateType } from 'api/moreCast2API'
import { modelColorClass, modelHeaderColorClass } from 'app/theme'
import { GridComponentRenderer } from 'features/moreCast2/components/GridComponentRenderer'
import { ColumnClickHandlerProps } from 'features/moreCast2/components/TabbedDataGrid'

export const DEFAULT_COLUMN_WIDTH = 80
export const DEFAULT_FORECAST_COLUMN_WIDTH = 145
export const DEFAULT_FORECAST_SUMMARY_COLUMN_WIDTH = 110

// Defines the order in which weather models display in the datagrid.
export const ORDERED_COLUMN_HEADERS: WeatherDeterminateType[] = [
  WeatherDeterminate.ACTUAL,
  WeatherDeterminate.HRDPS,
  WeatherDeterminate.HRDPS_BIAS,
  WeatherDeterminate.RDPS,
  WeatherDeterminate.RDPS_BIAS,
  WeatherDeterminate.GDPS,
  WeatherDeterminate.GDPS_BIAS,
  WeatherDeterminate.NAM,
  WeatherDeterminate.NAM_BIAS,
  WeatherDeterminate.GFS,
  WeatherDeterminate.GFS_BIAS
]

// Columns that can have values entered as part of a forecast
export const TEMP_HEADER = 'Temp'
export const RH_HEADER = 'RH'
export const WIND_SPEED_HEADER = 'Wind Speed'
export const WIND_DIR_HEADER = 'Wind Dir'
export const PRECIP_HEADER = 'Precip'
export const GC_HEADER = 'GC'

export interface ForecastColDefGenerator {
  getField: () => string
  generateForecastColDef: (columnClickHandlerProps: ColumnClickHandlerProps, headerName?: string) => GridColDef
  generateForecastSummaryColDef: (columnClickHandlerProps: ColumnClickHandlerProps) => GridColDef
}

export interface ColDefGenerator {
  getField: () => string
  generateColDef: (columnClickHandlerProps: ColumnClickHandlerProps, headerName?: string) => GridColDef
  generateColDefs: (
    columnClickHandlerProps: ColumnClickHandlerProps,
    headerName?: string,
    includeBiasFields?: boolean
  ) => GridColDef[]
}

export class ColumnDefBuilder implements ColDefGenerator, ForecastColDefGenerator {
  constructor(
    readonly field: string,
    readonly headerName: string,
    readonly type: 'string' | 'number',
    readonly precision: number,
    readonly gridComponentRenderer: GridComponentRenderer
  ) {}
  public getField = () => {
    return this.field
  }
  public generateColDef = () => {
    return this.generateColDefWith(this.field, this.headerName, this.precision, DEFAULT_COLUMN_WIDTH)
  }

  public generateForecastColDef = (columnClickHandlerProps: ColumnClickHandlerProps, headerName?: string) => {
    return this.generateForecastColDefWith(
      `${this.field}${WeatherDeterminate.FORECAST}`,
      headerName ?? this.headerName,
      this.precision,
      columnClickHandlerProps,
      DEFAULT_FORECAST_COLUMN_WIDTH
    )
  }

  public generateForecastSummaryColDef = (columnClickHandlerProps: ColumnClickHandlerProps) => {
    return this.generateForecastSummaryColDefWith(
      `${this.field}${WeatherDeterminate.FORECAST}`,
      this.headerName,
      this.precision,
      columnClickHandlerProps,
      DEFAULT_FORECAST_SUMMARY_COLUMN_WIDTH
    )
  }

  public generateColDefs = (
    columnClickHandlerProps: ColumnClickHandlerProps,
    headerName?: string,
    includeBiasFields = true
  ) => {
    const gridColDefs: GridColDef[] = []
    // Forecast columns have unique requirement (eg. column header menu, editable, etc.)
    const forecastColDef = this.generateForecastColDef(columnClickHandlerProps, headerName)
    gridColDefs.push(forecastColDef)

    for (const colDef of this.generateNonForecastColDefs(includeBiasFields)) {
      gridColDefs.push(colDef)
    }

    return gridColDefs
  }

  public generateNonForecastColDefs = (includeBiasFields: boolean) => {
    const fields = includeBiasFields
      ? ORDERED_COLUMN_HEADERS
      : ORDERED_COLUMN_HEADERS.filter(header => !header.endsWith('_BIAS'))
    return fields.map(header =>
      this.generateColDefWith(`${this.field}${header}`, header, this.precision, DEFAULT_COLUMN_WIDTH)
    )
  }

  public generateColDefWith = (field: string, headerName: string, precision: number, width?: number) => {
    return {
      field,
      disableColumnMenu: true,
      disableReorder: true,
      headerAlign: 'center' as GridAlignment,
      headerName,
      sortable: false,
      type: 'number',
      width: width ?? DEFAULT_COLUMN_WIDTH,
      cellClassName: (params: Pick<GridCellParams, 'field'>) => {
        return modelColorClass(params)
      },
      headerClassName: (params: Pick<GridColumnHeaderParams, 'field'>) => {
        return modelHeaderColorClass(params)
      },
      renderCell: (params: Pick<GridRenderCellParams, 'formattedValue'>) => {
        return this.gridComponentRenderer.renderCellWith(params)
      },
      renderHeader: (params: GridColumnHeaderParams) => {
        return this.gridComponentRenderer.renderHeaderWith(params)
      },
      valueGetter: (params: Pick<GridValueGetterParams, 'row' | 'value'>) =>
        this.gridComponentRenderer.valueGetter(params, precision, field, headerName),
      valueFormatter: (params: Pick<GridValueFormatterParams, 'value'>) => {
        return this.valueFormatterWith(params, precision)
      }
    }
  }

  public generateForecastColDefWith = (
    field: string,
    headerName: string,
    precision: number,
    columnClickHandlerProps: ColumnClickHandlerProps,
    width?: number
  ) => {
    const isGrassField = field.includes('grass')
    const isCalcField = field.includes('Calc')
    if (isGrassField || isCalcField) {
      width = DEFAULT_COLUMN_WIDTH
    }
    return {
      field: field,
      disableColumnMenu: true,
      disableReorder: true,
      editable: true,
      headerAlign: 'center' as GridAlignment,
      headerName: headerName,
      sortable: false,
      type: 'number',
      width: width ?? DEFAULT_FORECAST_COLUMN_WIDTH,
      renderHeader: (params: GridColumnHeaderParams) => {
        return isCalcField || isGrassField
          ? this.gridComponentRenderer.renderHeaderWith(params)
          : this.gridComponentRenderer.renderForecastHeaderWith(params, columnClickHandlerProps)
      },
      renderCell: (params: Pick<GridRenderCellParams, 'row' | 'formattedValue'>) => {
        return isCalcField
          ? this.gridComponentRenderer.renderCellWith(params)
          : this.gridComponentRenderer.renderForecastCellWith(params, field)
      },
      valueFormatter: (params: Pick<GridValueFormatterParams, 'value'>) => {
        return this.valueFormatterWith(params, precision)
      },
      valueGetter: (params: Pick<GridValueGetterParams, 'row' | 'value'>) =>
        this.gridComponentRenderer.valueGetter(params, precision, field, headerName),
      valueSetter: (params: Pick<GridValueSetterParams, 'row' | 'value'>) =>
        this.valueSetterWith(params, field, precision)
    }
  }

  public generateForecastSummaryColDefWith = (
    field: string,
    headerName: string,
    precision: number,
    columnClickHandlerProps: ColumnClickHandlerProps,
    width?: number
  ) => {
    const isGrassField = field.includes('grass')
    const isCalcField = field.includes('Calc')
    if (isGrassField || isCalcField) {
      width = DEFAULT_COLUMN_WIDTH
    }
    return {
      field: field,
      disableColumnMenu: true,
      disableReorder: true,
      editable: true,
      headerAlign: 'center' as GridAlignment,
      headerName: headerName,
      sortable: false,
      type: 'number',
      width: width ?? DEFAULT_FORECAST_SUMMARY_COLUMN_WIDTH,
      renderHeader: (params: GridColumnHeaderParams) => {
        return isCalcField || isGrassField
          ? this.gridComponentRenderer.renderHeaderWith(params)
          : this.gridComponentRenderer.renderForecastHeaderWith(params, columnClickHandlerProps)
      },
      renderCell: (params: Pick<GridRenderCellParams, 'row' | 'formattedValue'>) => {
        return isCalcField
          ? this.gridComponentRenderer.renderCellWith(params)
          : this.gridComponentRenderer.renderForecastSummaryCellWith(params)
      },
      valueFormatter: (params: Pick<GridValueFormatterParams, 'value'>) => {
        return this.valueFormatterWith(params, precision)
      },
      valueGetter: (params: Pick<GridValueGetterParams, 'row' | 'value'>) =>
        this.gridComponentRenderer.valueGetter(params, precision, field, headerName),
      valueSetter: (params: Pick<GridValueSetterParams, 'row' | 'value'>) =>
        this.valueSetterWith(params, field, precision)
    }
  }

  public valueFormatterWith = (params: Pick<GridValueFormatterParams, 'value'>, precision: number) =>
    this.gridComponentRenderer.predictionItemValueFormatter(params, precision)
  public valueGetter = (
    params: Pick<GridValueGetterParams, 'row' | 'value'>,
    field: string,
    precision: number,
    headerName: string
  ) => this.gridComponentRenderer.valueGetter(params, precision, field, headerName)
  public valueSetterWith = (params: Pick<GridValueSetterParams, 'row' | 'value'>, field: string, precision: number) =>
    this.gridComponentRenderer.predictionItemValueSetter(params, field, precision)
}
