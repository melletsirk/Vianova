import { defineComponent, ref, computed, onMounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth'
import { useRelationshipsStore } from '@/stores/relationships'
import type { UserRole } from '@/types/relationships'
import { CONNECTION_PERMISSIONS } from '@/types/relationships'

export default defineComponent({
  name: 'ConnectionManager',
  setup() {
    const authStore = useAuthStore()
    const relationshipsStore = useRelationshipsStore()

    const showInviteModal = ref(false)
    const showCodeModal = ref(false)
    const inviteEmail = ref('')
    const inviteRole = ref<UserRole>('caregiver')
    const inviteMessage = ref('')
    const invitationCode = ref('')
    const codeInput = ref('')
    const loading = ref(false)
    const error = ref('')
    const success = ref('')

    const availableRoles = computed(() => {
      const currentRole = authStore.userData?.role
      if (!currentRole) return []
      return CONNECTION_PERMISSIONS[currentRole] || []
    })

    const roleLabels: Record<UserRole, string> = {
      patient: 'Paciente',
      caregiver: 'Cuidador',
      professional: 'Profesional'
    }

    const roleIcons: Record<UserRole, string> = {
      patient: '❤️',
      caregiver: '🤝',
      professional: '⚕️'
    }

    onMounted(async () => {
      await relationshipsStore.initialize()
    })

    const handleCreateInvitation = async () => {
      if (!inviteEmail.value) {
        error.value = 'Por favor ingresa un email'
        return
      }

      loading.value = true
      error.value = ''
      success.value = ''

      const result = await relationshipsStore.createInvitation(
        inviteEmail.value,
        inviteRole.value,
        inviteMessage.value
      )

      loading.value = false

      if (result.success && result.code) {
        invitationCode.value = result.code
        success.value = 'Invitación creada exitosamente'
        inviteEmail.value = ''
        inviteMessage.value = ''
      } else {
        error.value = result.error || 'Error al crear invitación'
      }
    }

    const handleUseCode = async () => {
      if (!codeInput.value || codeInput.value.length !== 6) {
        error.value = 'Por favor ingresa un código válido de 6 dígitos'
        return
      }

      loading.value = true
      error.value = ''
      success.value = ''

      const result = await relationshipsStore.useInvitationCode(codeInput.value)

      if (result.success && result.invitation) {
        // Auto-accept the invitation
        const acceptResult = await relationshipsStore.acceptInvitation(result.invitation.id)
        
        loading.value = false

        if (acceptResult.success) {
          success.value = 'Conexión establecida exitosamente'
          codeInput.value = ''
          showCodeModal.value = false
        } else {
          error.value = acceptResult.error || 'Error al aceptar invitación'
        }
      } else {
        loading.value = false
        error.value = result.error || 'Código inválido'
      }
    }

    const handleAcceptInvitation = async (invitationId: string) => {
      loading.value = true
      const result = await relationshipsStore.acceptInvitation(invitationId)
      loading.value = false

      if (result.success) {
        success.value = 'Invitación aceptada'
      } else {
        error.value = result.error || 'Error al aceptar invitación'
      }
    }

    const handleRejectInvitation = async (invitationId: string) => {
      loading.value = true
      const result = await relationshipsStore.rejectInvitation(invitationId)
      loading.value = false

      if (result.success) {
        success.value = 'Invitación rechazada'
      } else {
        error.value = result.error || 'Error al rechazar invitación'
      }
    }

    const handleRemoveConnection = async (relationshipId: string) => {
      if (!confirm('¿Estás seguro de que deseas eliminar esta conexión?')) return

      loading.value = true
      const result = await relationshipsStore.removeConnection(relationshipId)
      loading.value = false

      if (result.success) {
        success.value = 'Conexión eliminada'
      } else {
        error.value = result.error || 'Error al eliminar conexión'
      }
    }

    const copyCodeToClipboard = () => {
      navigator.clipboard.writeText(invitationCode.value)
      success.value = 'Código copiado al portapapeles'
    }

    return () => (
      <div class="space-y-6">
        {/* Notifications */}
        {error.value && (
          <div class="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
            {error.value}
          </div>
        )}
        {success.value && (
          <div class="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {success.value}
          </div>
        )}

        {/* Received Invitations */}
        {relationshipsStore.receivedInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Invitaciones Recibidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                {relationshipsStore.receivedInvitations.map(invitation => (
                  <div
                    key={invitation.id}
                    class="p-4 border border-outline/40 rounded-lg flex items-center justify-between"
                  >
                    <div class="flex items-center gap-3">
                      <div class="text-2xl">{roleIcons[invitation.fromUserRole]}</div>
                      <div>
                        <p class="font-medium">{invitation.fromUserName || invitation.fromUserEmail}</p>
                        <p class="text-sm text-onSurface/70">
                          Te invita a conectar como {roleLabels[invitation.toRole]}
                        </p>
                        {invitation.message && (
                          <p class="text-sm text-onSurface/60 mt-1 italic">"{invitation.message}"</p>
                        )}
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <Button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={loading.value}
                        class="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                      >
                        Aceptar
                      </Button>
                      <Button
                        onClick={() => handleRejectInvitation(invitation.id)}
                        disabled={loading.value}
                        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div class="flex gap-3">
          <Button
            onClick={() => showInviteModal.value = true}
            class="flex-1 py-3 rounded-lg font-medium"
            style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600))); color: rgb(var(--onPrimary));"
          >
            + Invitar Usuario
          </Button>
          <Button
            onClick={() => showCodeModal.value = true}
            class="flex-1 py-3 rounded-lg font-medium border border-brand-500 text-brand-600 hover:bg-brand-50"
          >
            Usar Código
          </Button>
        </div>

        {/* My Connections */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Conexiones ({relationshipsStore.myConnections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {relationshipsStore.myConnections.length === 0 ? (
              <p class="text-center text-onSurface/60 py-8">
                No tienes conexiones aún. Invita a alguien o usa un código de invitación.
              </p>
            ) : (
              <div class="space-y-3">
                {relationshipsStore.myConnections.map(connection => (
                  <div
                    key={connection.userId}
                    class="p-4 border border-outline/40 rounded-lg flex items-center justify-between hover:bg-surfaceVariant transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <div class="text-2xl">{roleIcons[connection.userRole]}</div>
                      <div>
                        <p class="font-medium">{connection.userName}</p>
                        <p class="text-sm text-onSurface/70">{connection.userEmail}</p>
                        <p class="text-xs text-onSurface/50 mt-1">
                          {roleLabels[connection.userRole]} • Conectado el{' '}
                          {connection.connectedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRemoveConnection(connection.relationshipId)}
                      class="px-3 py-1 text-sm text-error hover:bg-error/10 rounded"
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invite Modal */}
        {showInviteModal.value && (
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card class="w-full max-w-md">
              <CardHeader>
                <CardTitle>Invitar Usuario</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Email del usuario</label>
                  <input
                    v-model={inviteEmail.value}
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    class="w-full px-3 py-2 border border-outline/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Rol del usuario</label>
                  <div class="grid grid-cols-1 gap-2">
                    {availableRoles.value.map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => inviteRole.value = role}
                        class={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                          inviteRole.value === role
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-outline/40 hover:bg-surfaceVariant'
                        }`}
                      >
                        <div class="text-xl">{roleIcons[role]}</div>
                        <div class="font-medium">{roleLabels[role]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Mensaje (opcional)</label>
                  <textarea
                    v-model={inviteMessage.value}
                    placeholder="Agrega un mensaje personalizado..."
                    rows={3}
                    class="w-full px-3 py-2 border border-outline/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {invitationCode.value && (
                  <div class="p-4 bg-brand-50 border border-brand-200 rounded-lg">
                    <p class="text-sm font-medium mb-2">Código de invitación:</p>
                    <div class="flex items-center gap-2">
                      <code class="flex-1 text-2xl font-bold text-brand-700 tracking-wider">
                        {invitationCode.value}
                      </code>
                      <Button
                        onClick={copyCodeToClipboard}
                        class="px-3 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
                      >
                        Copiar
                      </Button>
                    </div>
                    <p class="text-xs text-onSurface/60 mt-2">
                      Comparte este código con el usuario para que pueda conectarse
                    </p>
                  </div>
                )}

                <div class="flex gap-2">
                  <Button
                    onClick={handleCreateInvitation}
                    disabled={loading.value}
                    class="flex-1 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                  >
                    {loading.value ? 'Creando...' : 'Crear Invitación'}
                  </Button>
                  <Button
                    onClick={() => {
                      showInviteModal.value = false
                      invitationCode.value = ''
                      error.value = ''
                    }}
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cerrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Code Input Modal */}
        {showCodeModal.value && (
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card class="w-full max-w-md">
              <CardHeader>
                <CardTitle>Usar Código de Invitación</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Código de 6 dígitos</label>
                  <input
                    v-model={codeInput.value}
                    type="text"
                    maxlength={6}
                    placeholder="000000"
                    class="w-full px-4 py-3 text-2xl font-bold tracking-wider text-center border-2 border-outline/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <p class="text-xs text-onSurface/60 mt-2 text-center">
                    Ingresa el código que te compartieron
                  </p>
                </div>

                <div class="flex gap-2">
                  <Button
                    onClick={handleUseCode}
                    disabled={loading.value || codeInput.value.length !== 6}
                    class="flex-1 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
                  >
                    {loading.value ? 'Verificando...' : 'Conectar'}
                  </Button>
                  <Button
                    onClick={() => {
                      showCodeModal.value = false
                      codeInput.value = ''
                      error.value = ''
                    }}
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }
})