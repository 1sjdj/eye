import Vue from "vue";
import VueRouter from "vue-router";
import Login from "../views/Login.vue";
import Classification from "../views/Classification.vue";
import LLMService from "../views/LLMService.vue";
import Dashboard from "../views/Dashboard.vue";
import store from "../store/index";
import InformationEntry from "@/views/InformationEntry.vue";
import PatientManagement from "@/views/PatientManagement.vue";
import DataAnalysis from "@/views/DataAnalysis.vue";
import PersonalCenter from "@/views/PersonalCenter.vue";
import Register from "@/views/Register.vue";
import BrightnessSlider from "@/views/BrightnessSlider.vue";
Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Login',
        component: Login,
        meta: { requiresAuth: false }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
            name: "首页",
            requiresAuth: true
        }
    },
    {
        path: "/InformationEntry",
        name: "InformationEntry",
        component: InformationEntry,
        meta: { 
            name: "信息录入",
            requiresAuth: true 
        },
    },
    {
        path: "/PatientManagement",
        name: "PatientManagement",
        component: PatientManagement,
        meta: {
            name: "患者管理",
            requiresAuth: true
        },
    },
    {
        path: "/classification",
        name: "Classification",
        component: Classification,
        meta: { 
            name: "分类识别",
            requiresAuth: true 
        },
    },

    {
        path: "/llms",
        name: "LLMService",
        component: LLMService,
        meta: { 
            name: "Eye Disease AI Assistant",
            requiresAuth: true 
        },
    },
    {
        path: "/register",
        name: "Register",
        component: Register,
        meta: { 
            requiresAuth: false 
        },
    },
    {
        path: "/BrightnessSlider",
        name: "BrightnessSlider",
        component: BrightnessSlider,
        meta: { 
            name: "亮度调节",
            requiresAuth: true 
        },
    },
    // {
    //     path: "/case-derivation",
    //     name: "CaseDerivation",
    //     component: CaseDerivation,
    //     meta: {
    //         name: "病例导出",
    //         requiresAuth: true
    //     },
    // },
    {
        path: "/data-analysis",
        name: "DataAnalysis",
        component: DataAnalysis,
        meta: {
            name: "数据分析",
            requiresAuth: true
        },
    },

    {
        path: "/personal-center",
        name: "PersonalCenter",
        component: PersonalCenter,
        meta: {
            name: "个人中心",
            requiresAuth: true
        },
    },
];

const router = new VueRouter({
    mode: "history",
    base: process.env.BASE_URL,
    routes,
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('username') && localStorage.getItem('userRole');
    
    // 如果需要认证且未认证
    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/');
    }
    // 如果已认证且试图访问登录页或注册页
    else if (isAuthenticated && (to.path === '/' || to.path === '/register')) {
        next('/dashboard');
    }
    // 其他情况正常导航
    else {
        next();
    }
});

export default router;
