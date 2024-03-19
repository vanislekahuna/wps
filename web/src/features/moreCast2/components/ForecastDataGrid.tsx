import { styled } from '@mui/material/styles'
import React from 'react'
import {
  DataGrid,
  GridCallbackDetails,
  GridCellParams,
  GridColumnGroupingModel,
  GridColumnVisibilityModel,
  GridEventListener,
  MuiEvent
} from '@mui/x-data-grid'
import { MoreCast2Row } from 'features/moreCast2/interfaces'
import { LinearProgress } from '@mui/material'
import { DataGridColumns } from 'features/moreCast2/components/DataGridColumns'
import { ModelChoice } from 'api/moreCast2API'
import { MORECAST_MODEL_COLORS, MORECAST_WEATHER_PARAMS, MoreCastModelColors, MoreCastParams } from 'app/theme'
import { fillStationGrassCuringForward } from 'features/moreCast2/util'
import { getSimulatedIndicesAndStoreEditedRows } from 'features/moreCast2/slices/dataSlice'
import { AppDispatch } from 'app/store'
import { useDispatch } from 'react-redux'
import { ColumnClickHandlerProps } from 'features/moreCast2/components/TabbedDataGrid'

const PREFIX = 'ForecastDataGrid'

const classes = {
  root: `${PREFIX}-root`
}

const Root = styled('div')(() => {
  const styles: Record<string, React.CSSProperties> = {
    [`&.${classes.root}`]: {
      display: 'flex',
      flexGrow: 1,
      flexDirection: 'column',
      height: '1px'
    }
  }

  Object.keys(MORECAST_WEATHER_PARAMS).forEach(key => {
    styles[`& .${key}`] = {
      backgroundColor: MORECAST_WEATHER_PARAMS[key as keyof MoreCastParams].active
    }
  })

  Object.keys(MORECAST_MODEL_COLORS).forEach(key => {
    styles[`& .${key}`] = {
      backgroundColor: MORECAST_MODEL_COLORS[key as keyof MoreCastModelColors].bg,
      borderRight: 'solid',
      borderWidth: '1px',
      // Ugly override, tried to avoid, but MUI overwrites border with it's own otherwise
      borderRightColor: `${MORECAST_MODEL_COLORS[key as keyof MoreCastModelColors].border} !important`
    }
    styles[`& .${key}-header`] = {
      backgroundColor: MORECAST_MODEL_COLORS[key as keyof MoreCastModelColors].bg,
      borderBottom: 'solid',
      borderRight: 'solid',
      borderWidth: '1px',

      // Ugly override, tried to avoid, but MUI overwrites border with it's own otherwise
      borderColor: `${MORECAST_MODEL_COLORS[key as keyof MoreCastModelColors].border} !important`
    }
  })

  styles[`& .forecastCell`] = {
    backgroundColor: 'rgba(238,238,238,1)'
  }

  return styles
})

export interface ForecastDataGridProps {
  loading: boolean
  columnClickHandlerProps: ColumnClickHandlerProps
  columnVisibilityModel: GridColumnVisibilityModel
  setColumnVisibilityModel: React.Dispatch<React.SetStateAction<GridColumnVisibilityModel>>
  onCellDoubleClickHandler: (
    params: GridCellParams,
    event: MuiEvent<React.MouseEvent>,
    details: GridCallbackDetails
  ) => void
  handleColumnHeaderClick: GridEventListener<'columnHeaderClick'>
  columnGroupingModel: GridColumnGroupingModel
  allMoreCast2Rows: MoreCast2Row[]
}

const ForecastDataGrid = ({
  loading,
  columnClickHandlerProps,
  columnVisibilityModel,
  setColumnVisibilityModel,
  onCellDoubleClickHandler,
  handleColumnHeaderClick,
  columnGroupingModel,
  allMoreCast2Rows
}: ForecastDataGridProps) => {
  const dispatch: AppDispatch = useDispatch()

  const processRowUpdate = async (newRow: MoreCast2Row) => {
    const filledRows = fillStationGrassCuringForward(newRow, allMoreCast2Rows)

    dispatch(getSimulatedIndicesAndStoreEditedRows(newRow, filledRows))

    return newRow
  }

  return (
    <Root className={classes.root} data-testid={`morecast2-data-grid`}>
      <DataGrid
        getCellClassName={params => {
          return params.field.endsWith('Forecast') || params.field.endsWith('Actual') ? 'forecastCell' : ''
        }}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={newModel => setColumnVisibilityModel(newModel)}
        columnGroupingModel={columnGroupingModel}
        experimentalFeatures={{ columnGrouping: true }}
        slots={{
          loadingOverlay: LinearProgress
        }}
        onColumnHeaderClick={handleColumnHeaderClick}
        onCellDoubleClick={onCellDoubleClickHandler}
        loading={loading}
        columns={DataGridColumns.getTabColumns(columnClickHandlerProps)}
        isCellEditable={params => params.row[params.field] !== ModelChoice.ACTUAL}
        rows={allMoreCast2Rows}
        processRowUpdate={processRowUpdate}
      />
    </Root>
  )
}

export default React.memo(ForecastDataGrid)
