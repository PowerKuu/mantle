import { createNanoEvents, Emitter, EventsMap } from "nanoevents"


export class NanoEventEmitter<events extends EventsMap> {
  emitter: Emitter

  constructor () {
    this.emitter = createNanoEvents<events>()
  }

  emit(event: keyof events, ...args: Parameters<events[keyof events]>) {
    this.emitter.emit(event as string|number, ...args)
  }

  on<E extends keyof events>(event: E, callback: events[E]) {
    return this.emitter.on(event as string|number, callback)
  }
}

