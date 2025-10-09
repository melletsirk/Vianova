import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'Button',
  emits: ['click'],
  props: {
    class: { type: String, default: '' },
    type: { type: String as PropType<'button' | 'reset' | 'submit'>, default: 'button' },
    disabled: { type: Boolean, default: false },
  },
  setup(props, { emit, slots }) {
    return () => (
      <button
        type={props.type}
        disabled={props.disabled}
        class={['inline-flex items-center justify-center rounded-xl px-4 py-2', props.class].join(' ')}
        onClick={(e) => emit('click', e)}
      >
        {slots.default?.()}
      </button>
    )
  }
})
