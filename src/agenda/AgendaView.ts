import AbstractAgendaView from './AbstractAgendaView'
import DateProfileGenerator, { DateProfile } from '../DateProfileGenerator'
import { ComponentContext } from '../component/Component'
import { ViewSpec } from '../structs/view-spec'
import DayHeader from '../common/DayHeader'
import DaySeries from '../common/DaySeries'
import DayTable from '../common/DayTable'
import SimpleTimeGrid from './SimpleTimeGrid'
import SimpleDayGrid from '../basic/SimpleDayGrid'
import reselector from '../util/reselector'
import { ViewProps } from '../View'


export default class AgendaView extends AbstractAgendaView {

  header: DayHeader
  simpleDayGrid: SimpleDayGrid
  simpleTimeGrid: SimpleTimeGrid

  buildDayTable = reselector(buildDayTable)

  constructor(
    context: ComponentContext,
    viewSpec: ViewSpec,
    dateProfileGenerator: DateProfileGenerator,
    parentEl: HTMLElement
  ) {
    super(context, viewSpec, dateProfileGenerator, parentEl)

    if (this.opt('columnHeader')) {
      this.header = new DayHeader(
        this.context,
        this.el.querySelector('.fc-head-container')
      )
    }

    this.simpleTimeGrid = new SimpleTimeGrid(context, this.timeGrid)

    if (this.dayGrid) {
      this.simpleDayGrid = new SimpleDayGrid(context, this.dayGrid)
    }
  }

  destroy() {
    super.destroy()

    if (this.header) {
      this.header.destroy()
    }
  }

  render(props: ViewProps) {
    super.render(props) // for flags for updateSize

    let { dateProfile, dateSelection } = this.props
    let dayTable = this.buildDayTable(dateProfile, this.dateProfileGenerator)

    if (this.header) {
      this.header.receiveProps({
        dateProfile,
        dates: dayTable.headerDates,
        datesRepDistinctDays: true,
        renderIntroHtml: this.renderHeadIntroHtml
      })
    }

    this.simpleTimeGrid.receiveProps({
      dateProfile,
      dayTable,
      businessHours: props.businessHours,
      dateSelection: dateSelection && !dateSelection.allDay ? dateSelection : null,
      eventStore: this.filterEventsForTimeGrid(props.eventStore, props.eventUis),
      eventUis: props.eventUis,
      eventSelection: props.eventSelection,
      eventDrag: this.buildEventDragForTimeGrid(props.eventDrag),
      eventResize: this.buildEventResizeForTimeGrid(props.eventResize)
    })

    if (this.simpleDayGrid) {
      this.simpleDayGrid.receiveProps({
        dateProfile,
        dayTable,
        businessHours: props.businessHours,
        dateSelection: dateSelection && dateSelection.allDay ? dateSelection : null,
        eventStore: this.filterEventsForDayGrid(props.eventStore, props.eventUis),
        eventUis: props.eventUis,
        eventSelection: props.eventSelection,
        eventDrag: this.buildEventDragForDayGrid(props.eventDrag),
        eventResize: this.buildEventResizeForDayGrid(props.eventResize),
        nextDayThreshold: this.nextDayThreshold,
        isRigid: false
      })
    }
  }

  renderNowIndicator(date) {
    this.simpleTimeGrid.renderNowIndicator(date)
  }

}

function buildDayTable(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator): DayTable {
  let daySeries = new DaySeries(dateProfile.renderRange, dateProfileGenerator)

  return new DayTable(daySeries, false)
}
