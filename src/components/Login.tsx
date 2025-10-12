import { defineComponent, ref } from "vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth";

export default defineComponent({
  name: "Login",
  emits: ["loginSuccess"],
  setup(_, { emit }) {
    const authStore = useAuthStore();
    const isRegistering = ref(false);
    const email = ref("");
    const password = ref("");
    const selectedRole = ref<"patient" | "caregiver" | "professional">(
      "patient"
    );
    const error = ref("");
    const loading = ref(false);

    const toggleMode = () => {
      isRegistering.value = !isRegistering.value;
      error.value = "";
    };

    const handleSubmit = async () => {
      if (!email.value || !password.value) {
        error.value = "Por favor, ingresa email y contraseña";
        return;
      }

      if (isRegistering.value && !selectedRole.value) {
        error.value = "Por favor, selecciona un rol";
        return;
      }

      loading.value = true;
      error.value = "";

      const result = isRegistering.value
        ? await authStore.register(
            email.value,
            password.value,
            selectedRole.value
          )
        : await authStore.login(email.value, password.value);

      if (result.success) {
        emit("loginSuccess");
      } else {
        error.value =
          result.error ||
          `Error al ${isRegistering.value ? "registrarse" : "iniciar sesión"}`;
      }

      loading.value = false;
    };

    return () => (
      <div class="app-container gradient-calm min-h-screen text-onSurface flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <Card class="w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-2xl border border-outline/40 bg-surface shadow-lg">
          <CardHeader class="text-center pb-6">
            <div class="relative inline-flex items-center justify-center mb-4">
              <div
                class="absolute inset-0 rounded-full blur-lg opacity-30"
                style="background: radial-gradient(circle at 50% 50%, rgb(var(--brand-400)) 0%, rgba(0,0,0,0) 60%);"
              />
              <div class="relative w-16 h-16 gradient-primary rounded-full grid place-items-center shadow-lg overflow-hidden">
                <img
                  src="./src/assets/logoVianova.png"
                  alt="Logo VIANOVA"
                  class="h-8 w-8 object-contain"
                />
              </div>
            </div>
            <CardTitle class="text-2xl font-semibold">VIANOVA</CardTitle>
            <CardDescription class="text-base text-onSurface/70">
              {isRegistering.value
                ? "Regístrate para comenzar"
                : "Inicia sesión para continuar"}
            </CardDescription>
          </CardHeader>

          <CardContent class="space-y-4">
            {error.value && (
              <div class="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                {error.value}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-onSurface/80 mb-1">
                    Email
                  </label>
                  <input
                    v-model={email.value}
                    type="email"
                    autocomplete="username"
                    class="w-full px-3 py-2 rounded-lg border border-outline/40 bg-surface text-onSurface placeholder-onSurface/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-onSurface/80 mb-1">
                    Contraseña
                  </label>
                  <input
                    v-model={password.value}
                    type="password"
                    autocomplete="current-password"
                    class="w-full px-3 py-2 rounded-lg border border-outline/40 bg-surface text-onSurface placeholder-onSurface/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    placeholder="••••••••"
                  />
                </div>

                {isRegistering.value && (
                  <div>
                    <label class="block text-sm font-medium text-onSurface/80 mb-2">
                      Selecciona tu rol
                    </label>
                    <div class="grid grid-cols-3 gap-2">
                      {[
                        { value: "patient", label: "Paciente", icon: "❤️" },
                        { value: "caregiver", label: "Cuidador", icon: "🤝" },
                        {
                          value: "professional",
                          label: "Profesional",
                          icon: "⚕️",
                        },
                      ].map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() =>
                            (selectedRole.value = role.value as any)
                          }
                          class={`p-3 rounded-lg border text-center transition-all ${
                            selectedRole.value === role.value
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-outline/40 bg-surface text-onSurface/70 hover:bg-surfaceVariant"
                          }`}
                        >
                          <div class="text-lg mb-1">{role.icon}</div>
                          <div class="text-xs font-medium">{role.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading.value}
                  class="w-full py-3 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                  style="background-image: linear-gradient(135deg, rgb(var(--brand-500)), rgb(var(--brand-600))); color: rgb(var(--onPrimary));"
                >
                  {loading.value
                    ? isRegistering.value
                      ? "Registrando..."
                      : "Iniciando sesión..."
                    : isRegistering.value
                    ? "Registrarse"
                    : "Iniciar sesión"}
                </Button>
              </div>
            </form>

            <div class="text-center">
              <button
                onClick={toggleMode}
                class="text-sm text-brand-600 hover:text-brand-500 transition-colors"
              >
                {isRegistering.value
                  ? "¿Ya tienes cuenta? Inicia sesión"
                  : "¿No tienes cuenta? Regístrate"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
});
