import { createApp } from './app';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3002;

createApp().listen(port, host, () => {
  console.log(`[ ready ] employment-insurance-bff listening at http://${host}:${port}`);
});
