module.exports = {
    apps: [
        {
            name: "backend",
            script: "dist/main.js",
            cwd: "./backend",
        },
        {
            name: "frontend",
            script: "cmd",
            args: "/c npm run serve",
            cwd: "./gap-dashboard"
        }
    ]
}
