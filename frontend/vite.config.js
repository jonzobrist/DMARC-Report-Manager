import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '../', '');
    const allowedHosts = (env.ALLOWED_HOSTS || '').split(',').map(h => h.trim()).filter(h => h);

    return {
        plugins: [react()],
        envDir: '../',
        server: {
            host: env.APP_HOST || '127.0.0.1',
            port: parseInt(env.FRONTEND_PORT || '5173'),
            allowedHosts: allowedHosts.length > 0 ? allowedHosts : true
        }
    };
})
