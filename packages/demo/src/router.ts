import { createRouter, createWebHistory } from 'vue-router';
import BuilderPage from './pages/BuilderPage.vue';
import SignerPage from './pages/SignerPage.vue';
import IntegrityPage from './pages/IntegrityPage.vue';
import WebComponentPage from './pages/WebComponentPage.vue';

const routes = [
  { path: '/', redirect: '/builder' },
  { path: '/builder', component: BuilderPage },
  { path: '/signer', component: SignerPage },
  { path: '/integrity', component: IntegrityPage },
  { path: '/webcomponent', component: WebComponentPage },
  { path: '/webcomponent/:pathMatch(.*)*', component: WebComponentPage },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
