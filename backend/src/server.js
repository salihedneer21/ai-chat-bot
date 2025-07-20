require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const searchRoutes = require('./routes/search');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/search', searchRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
