import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mount, flushPromises } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../App.vue";
import { useOperacaoStore } from "../stores/operacao";

function criarRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { template: "<div>app-ok</div>" } }],
  });
}

function criarUsuarioAutenticado(pinia: ReturnType<typeof createPinia>) {
  const store = useOperacaoStore(pinia);
  store.usuarioAtual = {
    id: "1",
    nome: "Teste",
    email: "teste@pm.ro.gov.br",
    perfil: "admin",
    organizacaoPolicialMilitar: "PMRO",
    ativo: true,
    createdAt: new Date().toISOString(),
  };
  return store;
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mounts renders properly", async () => {
    const router = criarRouter();

    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
    });

    await router.isReady();
    expect(wrapper.text()).toContain("app-ok");
  });

  it("exibe aviso quando o carregamento da API falha", async () => {
    localStorage.setItem("cpo_api_url", "https://script.google.com/macros/s/x/exec");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const pinia = createPinia();
    const store = criarUsuarioAutenticado(pinia);
    const router = criarRouter();

    const wrapper = mount(App, {
      global: { plugins: [pinia, router] },
    });

    await router.isReady();
    await flushPromises();

    expect(store.erro).toContain("Não foi possível conectar");
    expect(wrapper.text()).toContain("Não foi possível carregar as operações");
  });

  it("permite fechar o aviso", async () => {
    localStorage.setItem("cpo_api_url", "https://script.google.com/macros/s/x/exec");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const pinia = createPinia();
    const store = criarUsuarioAutenticado(pinia);
    const router = criarRouter();

    const wrapper = mount(App, {
      global: { plugins: [pinia, router] },
    });

    await router.isReady();
    await flushPromises();
    expect(wrapper.find('[aria-label="Fechar aviso"]').exists()).toBe(true);

    await wrapper.find('[aria-label="Fechar aviso"]').trigger("click");
    await flushPromises();

    expect(store.erro).toBeNull();
    expect(wrapper.find('[aria-label="Fechar aviso"]').exists()).toBe(false);
  });
});