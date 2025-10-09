import { defineComponent, PropType, VNode } from 'vue'
import AppButton from '@/components/ui/Button'

type Accent = 'blue' | 'green' | 'purple' // compat, ya no afecta el color real

type TabItem = {
  id: string
  label: string
  icon?: (() => VNode | any) | VNode | any
}

export default defineComponent({
  name: 'MobileBottomNav',
  props: {
    activeTab: { type: String, required: true },
    tabs: { type: Array as PropType<TabItem[]>, required: true },
    accentColor: { type: String as PropType<Accent>, default: 'blue' }, // ignorado para colores, se mantiene por API
    onTabChange: { type: Function as PropType<(tab: string) => void>, default: undefined }
  },
  emits: ['update:activeTab'],
  setup(props, { emit }) {
    const renderIcon = (icon: TabItem['icon']) => (typeof icon === 'function' ? icon() : icon)

    const changeTab = (id: string) => {
      emit('update:activeTab', id)
      props.onTabChange?.(id)
    }

    return () => (
      <div class="fixed bottom-0 left-0 right-0 z-50">
        {/* Fondo glass con tokens */}
        <div class="backdrop-blur bg-surface/70 border-t border-outline/40">
          <div class="safe-area-pb">
            <div class="flex items-center justify-around px-2 py-2">
              {props.tabs.map(tab => {
                const isActive = props.activeTab === tab.id
                return (
                  <AppButton
                    key={tab.id}
                    class={[
                      'relative flex flex-col items-center justify-center h-14 min-w-[70px] rounded-2xl',
                      'touch-manipulation transition-all duration-300 active:scale-95',
                      // estados: activo usa brand; inactivo usa surface/onSurface
                      isActive
                        ? 'text-onPrimary shadow-lg'
                        : 'text-onSurface/70 hover:text-onSurface bg-surface hover:bg-surfaceVariant border border-outline/40'
                    ].join(' ')}
                    style={
                      isActive
                        ? {
                            // CTA con gradiente brand y sombra suave en brand
                            backgroundImage:
                              'linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600)))',
                            boxShadow: '0 8px 24px rgb(var(--brand-600) / 0.25)'
                          }
                        : {}
                    }
                    onClick={() => changeTab(tab.id)}
                  >
                    <div class={['mb-1 transition-transform duration-300', isActive ? 'scale-110' : 'scale-100'].join(' ')}>
                      {renderIcon(tab.icon)}
                    </div>
                    <span
                      class={[
                        'text-xs leading-tight transition-all duration-300',
                        isActive ? 'font-semibold' : 'font-medium'
                      ].join(' ')}
                    >
                      {tab.label}
                    </span>

                    {isActive && <div class="absolute top-2 right-2 w-2 h-2 bg-onPrimary/80 rounded-full" />}
                  </AppButton>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }
})
