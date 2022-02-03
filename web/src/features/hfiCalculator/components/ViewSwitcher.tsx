import { FireCentre } from 'api/hfiCalcAPI'
import { DailyViewTable } from 'features/hfiCalculator/components/DailyViewTable'
import WeeklyViewTable from 'features/hfiCalculator/components/WeeklyViewTable'
import {
  FireStarts,
  ValidatedStationDaily
} from 'features/hfiCalculator/slices/hfiCalculatorSlice'
import React from 'react'

export interface ViewSwitcherProps {
  testId?: string
  dailies: ValidatedStationDaily[]
  dateOfInterest: string
  setSelected: (selected: number[]) => void
  setNewFireStarts: (
    areaName: string,
    dayOffset: number,
    newFireStarts: FireStarts
  ) => void
  selectedPrepDay: string
  selectedFireCentre: FireCentre | undefined
}

const ViewSwitcher = (props: ViewSwitcherProps) => {
  return (
    <React.Fragment>
      {props.selectedPrepDay == '' ? (
        <WeeklyViewTable
          testId="hfi-calc-weekly-table"
          fireCentre={props.selectedFireCentre}
          dailies={props.dailies}
          currentDay={props.dateOfInterest}
          setSelected={props.setSelected}
          setNewFireStarts={props.setNewFireStarts}
        />
      ) : (
        <DailyViewTable
          testId="hfi-calc-daily-table"
          fireCentre={props.selectedFireCentre}
          dailies={props.dailies}
          setSelected={props.setSelected}
        ></DailyViewTable>
      )}
    </React.Fragment>
  )
}

export default React.memo(ViewSwitcher)
