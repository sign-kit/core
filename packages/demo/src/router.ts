import { createRouter, createWebHistory } from 'vue-router';
import BuilderPage from './pages/BuilderPage.vue';
import SignerPage from './pages/SignerPage.vue';
import IntegrityPage from './pages/IntegrityPage.vue';

const routes = [
  { path: '/', redirect: '/builder' },
  { path: '/builder', component: BuilderPage },
  { path: '/signer', component: SignerPage },
  { path: '/integrity', component: IntegrityPage },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
