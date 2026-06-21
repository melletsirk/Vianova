# Vianova

Plataforma web multirrol en tiempo real que conecta a pacientes, cuidadores y profesionales de salud en un solo espacio de coordinación de cuidados paliativos.

🔗 **Demo en producción:** [vianova-two.vercel.app](https://vianova-two.vercel.app)

---

## 🩺 Sobre el proyecto

Vianova nace para resolver un problema concreto: la coordinación de cuidados paliativos suele estar fragmentada entre llamadas, mensajes y papel. La plataforma centraliza esa coordinación dando a cada tipo de usuario exactamente la vista y los permisos que necesita, con datos sincronizados en tiempo real.

1.er Puesto — Fase Clasificatoria Local, Feria de Emprendimientos UCSM (2025). Proyecto clasificado a etapa nacional.

## ⚙️ Funcionalidades clave

- **Control de acceso basado en roles (RBAC)** para 4 tipos de usuario — paciente, cuidador, profesional de salud y superadministrador — cada uno con vistas, permisos y alcance de datos independientes.
- **Sincronización en tiempo real** vía Firebase Firestore: los dashboards se actualizan en vivo entre usuarios, sin necesidad de polling.
- **Panel de superadministrador** para gestión de usuarios y datos a nivel de toda la plataforma.

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 (Composition API) + TypeScript + Vite |
| Estilos | Tailwind CSS |
| Backend / Auth | Firebase Authentication + Firestore |
| Reglas de seguridad | Firestore Security Rules (`firestore.rules`) |
| Despliegue | Vercel |
| CI/CD | GitHub Actions → build y deploy automático a Vercel en cada push a `main`, con webhooks de estado en `/api/webhook.ts` |

## 🚀 Cómo correrlo localmente

```bash
npm install
npm run dev
```

Configuración de variables de entorno y credenciales de Firebase: ver [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md).
Configuración de despliegue automático: ver [`DEPLOYMENT_README.md`](./DEPLOYMENT_README.md).
