import { globalPlugins } from '@fullcalendar/core'
import { default as luxonPlugin } from './index.js'
export * from './index.js'

globalPlugins.push(luxonPlugin)
