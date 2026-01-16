import type { DisplayEvent, DisplayFormat, DisplayStage } from './displayEvent'

export type DisplayPanelState = {
  format: DisplayFormat
  content: string
}

export type DisplayState = {
  stage: DisplayStage
  panels: Record<DisplayStage, DisplayPanelState>
}

export const createInitialDisplayState = (): DisplayState => ({
  stage: 'status',
  panels: {
    searching: { format: 'status', content: '' },
    thinking: { format: 'status', content: '' },
    output: { format: 'text', content: '' },
    status: { format: 'status', content: '' },
  },
})

export type DisplayAction =
  | { type: 'reset' }
  | {
      type: 'event'
      event: DisplayEvent
    }

export const displayReducer = (state: DisplayState, action: DisplayAction): DisplayState => {
  switch (action.type) {
    case 'reset':
      return createInitialDisplayState()
    case 'event': {
      const event = action.event
      if (event.stage === 'output' && event.format === 'status') {
        const currentStatusPanel = state.panels.status
        const nextStatusPanel: DisplayPanelState = {
          format: 'status',
          content: event.delta ? `${currentStatusPanel.content}${event.content}` : event.content,
        }
        return {
          stage: event.stage,
          panels: {
            ...state.panels,
            status: nextStatusPanel,
          },
        }
      }
      const currentPanel = state.panels[event.stage]
      const sameFormat = currentPanel.format === event.format
      const nextPanel: DisplayPanelState = {
        format: event.format,
        content: event.delta && sameFormat ? `${currentPanel.content}${event.content}` : event.content,
      }
      return {
        stage: event.stage,
        panels: {
          ...state.panels,
          [event.stage]: nextPanel,
        },
      }
    }
  }
}
