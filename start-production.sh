npm run server $1 $2

cd ./services/gap-device-dashboard/backend
npx pm2 start dist/main.js --name gap-device-dashboard