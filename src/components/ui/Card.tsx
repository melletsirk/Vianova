import { defineComponent } from 'vue'

export const Card = defineComponent({
  name: 'Card',
  emits: ['click'],
  props: { class: { type: String, default: '' } },
  setup(props, { slots, emit }) {
    return () => (
      <div
        class={['rounded-2xl border bg-white shadow-sm', props.class].join(' ')}
        onClick={(e) => emit('click', e)}
      >
        {slots.default?.()}
      </div>
    )
  },
})

export const CardHeader = defineComponent({
  name: 'CardHeader',
  props: { class: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => <div class={['p-4', props.class].join(' ')}>{slots.default?.()}</div>
  },
})
export const CardContent = defineComponent({
  name: 'CardContent',
  props: { class: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => <div class={['p-4 ', props.class].join(' ')}>{slots.default?.()}</div>
  },
})
export const CardTitle = defineComponent({
  name: 'CardTitle',
  props: { class: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => <h3 class={['font-semibold leading-none tracking-tight', props.class].join(' ')}>{slots.default?.()}</h3>
  },
})
export const CardDescription = defineComponent({
  name: 'CardDescription',
  props: { class: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => <p class={['text-sm text-muted-foreground', props.class].join(' ')}>{slots.default?.()}</p>
  },
})
