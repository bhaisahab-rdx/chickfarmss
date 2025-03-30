import express from 'express';
import { default as testDeployment } from './api/test-deployment.js';

const app = express();
const port = 3001;

// Mount the test-deployment handler at the root path
app.get('/', testDeployment);

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});