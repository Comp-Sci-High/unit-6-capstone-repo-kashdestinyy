// Core dependencies
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

// App setup
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// View engine
app.set("view engine", "ejs");

// MongoDB connection
mongoose.connect("mongodb+srv://SE12:CSH2026@cluster0.arm9qe6.mongodb.net/GamePlanDB?retryWrites=true&w=majority&appName=Cluster0")
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
});

/* ROUTES */

// Homepage
app.get("/", (req, res) => {
    res.render("index");
});

// Login page
app.get("/login", (req, res) => {
    res.render("login");
});

// Coach Dashboard
app.get("/coach-dashboard", (req, res) => {
    res.render("coach-dashboard");
});

// Teacher Dashboard
app.get("/teacher-dashboard", (req, res) => {
    res.render("teacher-dashboard");
});

// Student Dashboard
app.get("/student-dashboard", (req, res) => {
    res.render("student-dashboard");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});