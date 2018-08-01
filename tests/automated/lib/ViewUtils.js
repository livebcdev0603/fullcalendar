const VIEW_CONTAINER_CLASS = 'fc-view-container'


export function getViewContainerEl() {
  return $(`.${VIEW_CONTAINER_CLASS}`)
}

export function getViewContainerElHeight() {
  return getViewContainerEl().height()
}

export function getViewContainerElWidth() {
  return getViewContainerEl().width()
}
