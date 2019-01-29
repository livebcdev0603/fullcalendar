import moment from 'moment'
// import 'moment-timezone' // rollup includes weird require() markup
import { NamedTimeZoneImpl, createPlugin } from '@fullcalendar/core'


class MomentNamedTimeZone extends NamedTimeZoneImpl {

  offsetForArray(a: number[]): number {
    return (moment as any).tz(a, this.timeZoneName).utcOffset()
  }

  timestampToArray(ms: number): number[] {
    return (moment as any).tz(ms, this.timeZoneName).toArray()
  }

}

export default createPlugin({
  namedTimeZonedImpl: MomentNamedTimeZone
})
