
// Creating
// ----------------------------------------------------------------------------------------------------------------

const elementPropHash = { // when props given to createElement should be treated as props, not attributes
  className: true,
  colSpan: true,
  rowSpan: true
}

const containerTagHash = {
  '<tr': 'tbody',
  '<td': 'tr'
}

export function createElement(tagName: string, attrs: object | null, content?: ElementContent): HTMLElement {
  let el: HTMLElement = document.createElement(tagName)

  if (attrs) {
    for (let attrName in attrs) {
      if (attrName === 'style') {
        applyStyle(el, attrs[attrName])
      } else if (elementPropHash[attrName]) {
        el[attrName] = attrs[attrName]
      } else {
        el.setAttribute(attrName, attrs[attrName])
      }
    }
  }

  if (typeof content === 'string') {
    el.innerHTML = content // shortcut. no need to process HTML in any way
  } else if (content != null) {
    appendToElement(el, content)
  }

  return el
}

export function htmlToElement(html: string): HTMLElement {
  html = html.trim()
  let container = document.createElement(computeContainerTag(html))
  container.innerHTML = html
  return container.firstChild as HTMLElement
}

export function htmlToElements(html: string): HTMLElement[] {
  return Array.prototype.slice.call(htmlToNodeList(html))
}

function htmlToNodeList(html: string): NodeList {
  html = html.trim()
  let container = document.createElement(computeContainerTag(html))
  container.innerHTML = html
  return container.childNodes
}

// assumes html already trimmed and tag names are lowercase
function computeContainerTag(html: string) {
  return containerTagHash[
    html.substr(0, 3) // faster than using regex
  ] || 'div'
}


// Inserting / Removing
// ----------------------------------------------------------------------------------------------------------------

export type ElementContent = string | Node | NodeList | Node[]

export function appendToElement(el: HTMLElement, content: ElementContent) {
  let childNodes = normalizeContent(content)
  for (let i = 0; i < childNodes.length; i++) {
    el.appendChild(childNodes[i])
  }
}

export function prependToElement(parent: HTMLElement, content: ElementContent) {
  let newEls = normalizeContent(content)
  let afterEl = parent.firstChild || null // if no firstChild, will append to end, but that's okay, b/c there were no children

  for (let i = 0; i < newEls.length; i++) {
    parent.insertBefore(newEls[i], afterEl)
  }
}

export function insertAfterElement(refEl: HTMLElement, content: ElementContent) {
  let newEls = normalizeContent(content)
  let afterEl = refEl.nextSibling || null

  for (let i = 0; i < newEls.length; i++) {
    refEl.parentNode.insertBefore(newEls[i], afterEl)
  }
}

function normalizeContent(content: ElementContent): NodeList | Node[] {
  let els
  if (typeof content === 'string') {
    els = htmlToNodeList(content)
  } else if (content instanceof Node) {
    els = [ content ]
  } else { // assumed to be NodeList or Node[]
    els = content
  }
  return els
}

export function removeElement(el: HTMLElement) {
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  }
}


// Querying
// ----------------------------------------------------------------------------------------------------------------

// from https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
const matchesMethod =
  Element.prototype.matches ||
  (Element.prototype as any).matchesSelector ||
  (Element.prototype as any).mozMatchesSelector ||
  (Element.prototype as any).msMatchesSelector ||
  (Element.prototype as any).oMatchesSelector ||
  (Element.prototype as any).webkitMatchesSelector

const closestMethod = Element.prototype.closest || function(selector) {
  let el = this
  if (!document.documentElement.contains(el)) {
    return null
  }
  do {
    if (elementMatches(el, selector)) {
      return el
    }
    el = el.parentElement || el.parentNode
  } while (el !== null && el.nodeType === 1)
  return null
}

export function elementClosest(el: HTMLElement, selector: string) {
  return closestMethod.call(el, selector)
}

export function elementMatches(el: HTMLElement, selector: string) {
  return matchesMethod.call(el, selector)
}

// only func that accepts multiple subject els (in this case, the 'containers')
export function findElements(containers: HTMLElement[] | HTMLElement, selector: string): HTMLElement[] {
  if (containers instanceof HTMLElement) {
    containers = [ containers ]
  }
  let allMatches: HTMLElement[] = []

  for (let i = 0; i < containers.length; i++) {
    let matches = containers[i].querySelectorAll(selector)
    for (let j = 0; j < matches.length; j++) {
      allMatches.push(matches[j] as HTMLElement)
    }
  }

  return allMatches
}

// only queries direct child elements
export function queryChildren(parent: HTMLElement, selector?: string): HTMLElement[] {
  let childNodes = parent.childNodes
  let a = []

  for (let i = 0; i < childNodes.length; i++) {
    let childNode = childNodes[i]
    if (
      childNode.nodeType === 1 && // an element
      (!selector || elementMatches(childNode as HTMLElement, selector))
    ) {
      a.push(childNode)
    }
  }

  return a
}

// queries for the first matching direct child element
export function queryChild(parent: HTMLElement, selector?: string): HTMLElement | null {
  let childNodes = parent.childNodes

  for (let i = 0; i < childNodes.length; i++) {
    let childNode = childNodes[i]
    if (
      childNode.nodeType === 1 && // an element
      (!selector || elementMatches(childNode as HTMLElement, selector))
    ) {
      return childNode as HTMLElement
    }
  }

  return null
}


// Event Delegation
// ----------------------------------------------------------------------------------------------------------------

export function listenBySelector(
  container: HTMLElement,
  eventType: string,
  selector: string,
  handler: (ev: Event, matchedTarget: HTMLElement) => void
) {
  function realHandler(ev: Event) {
    let matchedChild = elementClosest(ev.target as HTMLElement, selector)
    if (matchedChild) {
      handler.call(matchedChild, ev, matchedChild)
    }
  }

  container.addEventListener(eventType, realHandler)

  return function() {
    container.removeEventListener(eventType, realHandler)
  }
}

export function listenToHoverBySelector(
  container: HTMLElement,
  selector: string,
  onMouseEnter: (ev: Event, matchedTarget: HTMLElement) => void,
  onMouseLeave: (ev: Event, matchedTarget: HTMLElement) => void
) {
  let currentMatchedChild

  return listenBySelector(container, 'mouseover', selector, function(ev, matchedChild) {
    if (matchedChild !== currentMatchedChild) {
      currentMatchedChild = matchedChild
      onMouseEnter(ev, matchedChild)

      let realOnMouseLeave = (ev) => {
        currentMatchedChild = null
        onMouseLeave(ev, matchedChild)
        matchedChild.removeEventListener('mouseleave', realOnMouseLeave)
      }

      // listen to the next mouseleave, and then unattach
      matchedChild.addEventListener('mouseleave', realOnMouseLeave)
    }
  })
}


// Style
// ----------------------------------------------------------------------------------------------------------------

const PIXEL_PROP_RE = /(top|left|right|bottom|width|height)$/i

export function applyStyle(el: HTMLElement, props: object, propVal?: any) {
  for (let propName in props) {
    applyStyleProp(el, propName, props[propName])
  }
}

export function applyStyleProp(el: HTMLElement, name: string, val) {
  if (val == null) {
    el.style[name] = ''
  } else if (typeof val === 'number' && PIXEL_PROP_RE.test(name)) {
    el.style[name] = val + 'px'
  } else {
    el.style[name] = val
  }
}


// Dimensions
// ----------------------------------------------------------------------------------------------------------------

export function computeHeightAndMargins(el: HTMLElement) {
  let computed = window.getComputedStyle(el)
  return el.offsetHeight +
    parseInt(computed.marginTop, 10) +
    parseInt(computed.marginBottom, 10)
}


// Animation
// ----------------------------------------------------------------------------------------------------------------

const transitionEventNames = [
  'webkitTransitionEnd',
  'otransitionend',
  'oTransitionEnd',
  'msTransitionEnd',
  'transitionend'
]

// triggered only when the next single subsequent transition finishes
export function whenTransitionDone(el: HTMLElement, callback: (ev: Event) => void) {
  let realCallback = function(ev) {
    callback(ev)
    transitionEventNames.forEach(function(eventName) {
      el.removeEventListener(eventName, realCallback)
    })
  }

  transitionEventNames.forEach(function(eventName) {
    el.addEventListener(eventName, realCallback) // cross-browser way to determine when the transition finishes
  })
}
