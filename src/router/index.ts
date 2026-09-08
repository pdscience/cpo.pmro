import { createRouter, createWebHistory } from "vue-router";
import { useOperacaoStore } from "@/stores/operacao";
import DashboardView from "@/views/DashboardView.vue";
import OperacoesView from "@/views/OperacoesView.vue";
import NovaOperacaoView from "@/views/NovaOperacaoView.vue";
import DetalhesOperacaoView from "@/views/DetalhesOperacaoView.vue";
import RelatoriosView from "@/views/RelatoriosView.vue";
import AuditoriaView from "@/views/AuditoriaView.vue";
import ImportarView from "@/views/ImportarView.vue";
import ConfigApiView from "@/views/ConfigApiView.vue";
import LoginView from "@/views/LoginView.vue";
import AdminView from "@/views/AdminView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/operacoes",
      name: "operacoes",
      component: OperacoesView,
      meta: { requiresAuth: true },
    },
    {
      path: "/operacoes/nova",
      name: "nova-operacao",
      component: NovaOperacaoView,
      meta: { requiresAuth: true },
    },
    {
      path: "/operacoes/:id",
      name: "detalhes-operacao",
      component: DetalhesOperacaoView,
      meta: { requiresAuth: true },
    },
    {
      path: "/importar",
      name: "importar",
      component: ImportarView,
      meta: { requiresAuth: true },
    },
    {
      path: "/config-api",
      name: "config-api",
      component: ConfigApiView,
      meta: { requiresAuth: true },
    },
    {
      path: "/relatorios",
      name: "relatorios",
      component: RelatoriosView,
      meta: { requiresAuth: true },
    },
    {
      path: "/auditoria",
      name: "auditoria",
      component: AuditoriaView,
      meta: { requiresAuth: true },
    },
    {
      path: "/admin",
      name: "admin",
      component: AdminView,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to, _from) => {
  const store = useOperacaoStore();

  if (to.meta.requiresAuth && !store.usuarioAtual) {
    return "/login";
  }
  if (to.path === "/login" && store.usuarioAtual) {
    return "/";
  }
  return true;
});

export default router;
