// Core dependencies
const express = require("express");
const mongoose = require("mongoose");

// App setup
const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error(err));

// Basic route (just to test server)
app.get("/", (req, res) => {
    res.send("Server is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});