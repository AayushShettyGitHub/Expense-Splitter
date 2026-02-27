```javascript
require('dotenv').config();
const connectToDatabase = require("./config/database.js");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");

const Routes = require('./routes/appRoutes.js');


const app = express();
const PORT = process.env.PORT || 3000; 
const MONGO_URI = process.env.MONGO_URI; 

app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://expense-splitter-frontend.vercel.app",
      "https://expense-splitter-frontend-git-main-siddharth-sharmas-projects.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json()); 

app.use("/api", Routes);



app.listen(PORT, () => {
  console.log(`Server running on port ${ PORT } `);
  connectToDatabase();
});
