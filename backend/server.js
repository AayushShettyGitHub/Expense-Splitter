
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; 
const MONGO_URI = process.env.MONGO_URI; 


app.use(cors()); 
app.use(express.json()); 




app.get('/', (req, res) => {
    res.send('API is running...');
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});