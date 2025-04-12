import express from 'express';
import request from 'request';

const app = express();

app.get('/capture', (req, res) => {
  request('http://192.168.137.52/capture').pipe(res);
});

app.listen(8080, () => {
  console.log('Proxy running on http://localhost:8080');
});
