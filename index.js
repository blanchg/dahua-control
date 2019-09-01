import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './App.vue';
import Camera from './Camera.vue';


Vue.use(VueRouter);

const router = new VueRouter({
    routes: [
        {path: '/:cam', component: Camera}
    ]
})

const root = new Vue({
    router,
    render: createElement => createElement(App)
}).$mount('#app')