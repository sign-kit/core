import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './styles.css';
// import SignKit shared styles (local package) to demonstrate theming
import '@sign-kit/styles/index.css';

const app = createApp(App);
app.use(router);
app.mount('#app');

