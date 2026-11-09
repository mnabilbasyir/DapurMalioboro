require('dotenv').config();

const express = require('express');
const app = express();
const PORT = 3006;

const router       = require('./src/router/router');
const userRouter   = require('./src/router/userRouter');
const errorHandler = require('./src/middleware/errorHandler');

app.use(express.json());

app.use('/', router);
app.use('/user', userRouter);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
