module.exports = {
    devServer: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000', // 要代理到的目标服务器
                changeOrigin: true,
            },
        },
    },
};