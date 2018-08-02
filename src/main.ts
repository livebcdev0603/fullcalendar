import * as exportHooks from './exports'

// for intentional side-effects
import './theme/config'
import './basic/config'
import './agenda/config'
import './list/config'

import './event-sources/json-feed-event-source'
import './event-sources/array-event-source'

export = exportHooks
