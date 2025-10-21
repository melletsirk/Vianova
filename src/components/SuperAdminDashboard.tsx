import { defineComponent, ref, onMounted, computed } from 'vue'
import { useSuperAdminStore } from '@/stores/superAdmin'
import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'

export default defineComponent({
  name: 'SuperAdminDashboard',
  setup() {
    const superAdminStore = useSuperAdminStore()
    const authStore = useAuthStore()
    const activeTab = ref<'users' | 'relationships'>('users')
    const showDeleteConfirm = ref<string | null>(null)

    onMounted(async () => {
      await superAdminStore.initialize()
    })

    const handleDeleteUser = async (userId: string) => {
      const result = await superAdminStore.deleteUserAccount(userId)
      if (result.success) {
        showDeleteConfirm.value = null
        // Refresh data
        await superAdminStore.fetchAllUsers()
      }
    }

    const handleDeleteRelationship = async (relationshipId: string) => {
      const result = await superAdminStore.deleteRelationship(relationshipId)
      if (result.success) {
        showDeleteConfirm.value = null
        // Refresh data
        await superAdminStore.fetchAllRelationships()
      }
    }

    const getRoleIcon = (role: string) => {
      switch (role) {
        case 'patient': return '❤️'
        case 'caregiver': return '🤝'
        case 'professional': return '⚕️'
        case 'superadmin': return '👑'
        default: return '👤'
      }
    }

    const getRoleLabel = (role: string) => {
      switch (role) {
        case 'patient': return 'Paciente'
        case 'caregiver': return 'Cuidador'
        case 'professional': return 'Profesional'
        case 'superadmin': return 'Super Admin'
        default: return role
      }
    }

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }

    return () => (
      <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div class="max-w-7xl mx-auto">
          {/* Header */}
          <div class="mb-8 flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">Panel de Super Admin</h1>
              <p class="text-gray-600">Gestiona usuarios y conexiones del sistema</p>
            </div>
            <button
              type="button"
              onClick={() => authStore.logout()}
              class="inline-flex items-center justify-center rounded-xl px-4 py-2 touch-manipulation rounded-full w-12 h-12 bg-transparent hover:bg-surfaceVariant"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-log-out-icon h-5 w-5 text-onSurface"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" x2="9" y1="12" y2="12"></line>
              </svg>
            </button>
          </div>

          {/* Stats Cards */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card class="bg-white">
              <CardContent class="p-6">
                <div class="flex items-center">
                  <div class="p-3 bg-blue-100 rounded-lg">
                    <span class="text-2xl">👥</span>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">Total Usuarios</p>
                    <p class="text-2xl font-bold text-gray-900">{superAdminStore.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card class="bg-white">
              <CardContent class="p-6">
                <div class="flex items-center">
                  <div class="p-3 bg-green-100 rounded-lg">
                    <span class="text-2xl">🔗</span>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">Conexiones Activas</p>
                    <p class="text-2xl font-bold text-gray-900">{superAdminStore.totalRelationships}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card class="bg-white">
              <CardContent class="p-6">
                <div class="flex items-center">
                  <div class="p-3 bg-purple-100 rounded-lg">
                    <span class="text-2xl">📊</span>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-600">Sistema</p>
                    <p class="text-2xl font-bold text-gray-900">Activo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div class="mb-6">
            <div class="border-b border-gray-200">
              <nav class="-mb-px flex space-x-8">
                <button
                  onClick={() => activeTab.value = 'users'}
                  class={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab.value === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Usuarios ({superAdminStore.totalUsers})
                </button>
                <button
                  onClick={() => activeTab.value = 'relationships'}
                  class={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab.value === 'relationships'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Conexiones ({superAdminStore.totalRelationships})
                </button>
              </nav>
            </div>
          </div>

          {/* Users Tab */}
          {activeTab.value === 'users' && (
            <Card class="bg-white">
              <CardHeader>
                <CardTitle>Lista de Usuarios</CardTitle>
                <CardDescription>
                  Todos los usuarios registrados en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {superAdminStore.loading ? (
                  <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p class="mt-2 text-gray-600">Cargando usuarios...</p>
                  </div>
                ) : (
                  <div class="space-y-4">
                    {Object.entries(superAdminStore.usersByRole).map(([role, roleUsers]) => (
                      roleUsers.length > 0 && (
                        <div key={role}>
                          <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <span class="mr-2">{getRoleIcon(role)}</span>
                            {getRoleLabel(role)} ({roleUsers.length})
                          </h3>
                          <div class="space-y-2">
                            {roleUsers.map(user => (
                              <div key={user.uid} class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div class="flex items-center space-x-3">
                                  <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span class="text-lg">{getRoleIcon(user.role)}</span>
                                  </div>
                                  <div>
                                    <p class="font-medium text-gray-900">{user.name || 'Sin nombre'}</p>
                                    <p class="text-sm text-gray-600">{user.email}</p>
                                    <p class="text-xs text-gray-500">
                                      Creado: {formatDate(user.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                  {user.role !== 'superadmin' && (
                                    <>
                                      {showDeleteConfirm.value === `user-${user.uid}` ? (
                                        <div class="flex items-center space-x-2">
                                          <Button
                                            onClick={() => handleDeleteUser(user.uid)}
                                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                                          >
                                            Confirmar
                                          </Button>
                                          <Button
                                            onClick={() => showDeleteConfirm.value = null}
                                            class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 text-sm"
                                          >
                                            Cancelar
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          onClick={() => showDeleteConfirm.value = `user-${user.uid}`}
                                          class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                                        >
                                          Eliminar
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Relationships Tab */}
          {activeTab.value === 'relationships' && (
            <Card class="bg-white">
              <CardHeader>
                <CardTitle>Conexiones Activas</CardTitle>
                <CardDescription>
                  Relaciones entre pacientes, cuidadores y profesionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                {superAdminStore.loading ? (
                  <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p class="mt-2 text-gray-600">Cargando conexiones...</p>
                  </div>
                ) : (
                  <div class="space-y-4">
                    {superAdminStore.relationships.map(relationship => (
                      <div key={relationship.id} class="p-4 border border-gray-200 rounded-lg">
                        <div class="flex items-center justify-between mb-3">
                          <div class="flex items-center space-x-4">
                            <div class="text-sm text-gray-600">
                              <span class="font-medium">Paciente:</span> {relationship.patientName || relationship.patientEmail}
                            </div>
                            {relationship.caregiverId && (
                              <div class="text-sm text-gray-600">
                                <span class="font-medium">Cuidador:</span> {relationship.caregiverName || relationship.caregiverEmail}
                              </div>
                            )}
                            {relationship.professionalId && (
                              <div class="text-sm text-gray-600">
                                <span class="font-medium">Profesional:</span> {relationship.professionalName || relationship.professionalEmail}
                              </div>
                            )}
                          </div>
                          <div class="flex items-center space-x-2">
                            <span class={`px-2 py-1 text-xs rounded-full ${
                              relationship.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {relationship.status === 'active' ? 'Activa' : 'Pendiente'}
                            </span>
                            {showDeleteConfirm.value === `rel-${relationship.id}` ? (
                              <div class="flex items-center space-x-2">
                                <Button
                                  onClick={() => handleDeleteRelationship(relationship.id)}
                                  class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  onClick={() => showDeleteConfirm.value = null}
                                  class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 text-sm"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => showDeleteConfirm.value = `rel-${relationship.id}`}
                                class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                              >
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </div>
                        <div class="text-xs text-gray-500">
                          Creada: {formatDate(relationship.createdAt)}
                          {relationship.acceptedAt && (
                            <span> • Aceptada: {formatDate(relationship.acceptedAt)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {superAdminStore.relationships.length === 0 && (
                      <div class="text-center py-8 text-gray-500">
                        No hay conexiones activas
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }
})