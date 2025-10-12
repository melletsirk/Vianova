<script setup
    lang='ts'>
    import { useAuthStore } from '@/stores/auth';
    import { ref } from 'vue';
    import Login from '@/components/Login';
    import PatientDashboard from '@/components/PatientDashboard';
    import CaregiverDashboard from '@/components/CaregiverDashboard';
    import ProfessionalDashboard from '@/components/ProfessionalDashboard';
    const authStore = useAuthStore();
    const selectedRole = ref<'patient' | 'caregiver' | 'professional'>('patient');
    const isSelectingRole = ref(false);
    
    function handleLoginSuccess() { /* User will be redirected to their dashboard based on stored role */ }
    
    async function handleRoleSelection() {
      await authStore.updateUserRole(selectedRole.value);
      isSelectingRole.value = false;
    }
    
    function checkNeedRoleSelection() {
      return authStore.isAuthenticated && !authStore.userDataLoading && !authStore.userRole;
    }</script>
<template>
    <Login v-if="!authStore.isAuthenticated" @loginSuccess="handleLoginSuccess" />
    <div v-else-if="authStore.userDataLoading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
        <p class="mt-4 text-onSurface/70">Cargando...</p>
      </div>
    </div>
    <div v-else-if="checkNeedRoleSelection()" class="min-h-screen flex items-center justify-center gradient-calm px-4">
      <div class="bg-surface rounded-2xl shadow-lg p-8 max-w-md w-full border border-outline/40">
        <h2 class="text-2xl font-semibold mb-2 text-center">Selecciona tu rol</h2>
        <p class="text-onSurface/70 text-center mb-6">Por favor, selecciona cómo usarás la aplicación</p>
        
        <div class="grid grid-cols-1 gap-3 mb-6">
          <button
            @click="selectedRole = 'patient'"
            :class="[
              'p-4 rounded-lg border text-left transition-all flex items-center gap-3',
              selectedRole === 'patient'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-outline/40 bg-surface text-onSurface/70 hover:bg-surfaceVariant'
            ]"
          >
            <div class="text-2xl">❤️</div>
            <div>
              <div class="font-medium">Paciente</div>
              <div class="text-sm opacity-70">Recibe cuidados y apoyo</div>
            </div>
          </button>
          
          <button
            @click="selectedRole = 'caregiver'"
            :class="[
              'p-4 rounded-lg border text-left transition-all flex items-center gap-3',
              selectedRole === 'caregiver'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-outline/40 bg-surface text-onSurface/70 hover:bg-surfaceVariant'
            ]"
          >
            <div class="text-2xl">🤝</div>
            <div>
              <div class="font-medium">Cuidador</div>
              <div class="text-sm opacity-70">Brinda apoyo a pacientes</div>
            </div>
          </button>
          
          <button
            @click="selectedRole = 'professional'"
            :class="[
              'p-4 rounded-lg border text-left transition-all flex items-center gap-3',
              selectedRole === 'professional'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-outline/40 bg-surface text-onSurface/70 hover:bg-surfaceVariant'
            ]"
          >
            <div class="text-2xl">⚕️</div>
            <div>
              <div class="font-medium">Profesional</div>
              <div class="text-sm opacity-70">Proporciona atención médica</div>
            </div>
          </button>
        </div>
        
        <button
          @click="handleRoleSelection"
          class="w-full py-3 rounded-lg font-medium transition-all duration-200 active:scale-[0.98]"
          style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600))); color: rgb(var(--onPrimary));"
        >
          Continuar
        </button>
      </div>
    </div>
    <PatientDashboard v-else-if="authStore.userRole === 'patient'" />
    <CaregiverDashboard v-else-if="authStore.userRole === 'caregiver'" />
    <ProfessionalDashboard v-else-if="authStore.userRole === 'professional'" />
</template>
<style>
.gradient-calm {
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 40%, #f1f5f9 100%);
}

.safe-area-pt {
    padding-top: env(safe-area-inset-top);
}
</style>
