const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
 
const app = express();
const PORT = process.env.PORT || 3000;
 
// ─── MongoDB Connection ────────────────────────────────────────────────────────
const MONGO_URI =
  "mongodb+srv://SE12:CSH2026@cluster0.arm9qe6.mongodb.net/?appName=Cluster0";
 
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));
 
// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
 
// ─── View Engine ──────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
 
// ─── Models ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ["teacher", "coach", "student"], required: true },
  sport:    { type: String }, // for coaches/students
  createdAt:{ type: Date, default: Date.now },
});
 
const reportSchema = new mongoose.Schema({
  studentName:  { type: String, required: true },
  studentId:    { type: String, required: true },
  teacherName:  { type: String, required: true },
  subject:      { type: String, required: true },
  grade:        { type: String, required: true },
  attendance:   { type: String, enum: ["Present", "Absent", "Tardy"], required: true },
  behavior:     { type: String, enum: ["Excellent", "Good", "Needs Improvement", "Poor"], required: true },
  comments:     { type: String },
  sport:        { type: String },
  createdAt:    { type: Date, default: Date.now },
});
 
const User   = mongoose.model("User",   userSchema);
const Report = mongoose.model("Report", reportSchema);
 
// ─── Routes ───────────────────────────────────────────────────────────────────
 
// HOME
app.get("/", (req, res) => {
  res.render("index");
});
 
// LOGIN
app.get("/login", (req, res) => {
  res.render("login");
});
 
app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const user = await User.findOne({ email, password, role });
    if (!user) {
      return res.render("login", { error: "Invalid credentials. Please try again." });
    }
    // Redirect based on role
    if (role === "coach")   return res.redirect("/coach-dashboard");
    if (role === "teacher") return res.redirect("/teacher-dashboard");
    if (role === "student") return res.redirect(`/student/${user._id}`);
  } catch (err) {
    res.render("login", { error: "Server error. Please try again." });
  }
});
 
// COACH DASHBOARD
app.get("/coach-dashboard", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(20);
    res.render("coach-dashboard", { reports });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
 
// TEACHER DASHBOARD
app.get("/teacher-dashboard", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.render("teacher-dashboard", { reports });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
 
// SUBMIT REPORT (Teacher)
app.post("/submit-report", async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    res.redirect("/teacher-dashboard?success=true");
  } catch (err) {
    res.status(500).send("Error saving report: " + err.message);
  }
});
 
// STUDENT VIEW
app.get("/student/:id", async (req, res) => {
  try {
    const reports = await Report.find({ studentId: req.params.id }).sort({ createdAt: -1 });
    res.render("student-dashboard", { reports, studentId: req.params.id });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
 
// API: Search students by sport/name
app.get("/api/search", async (req, res) => {
  const { q, sport } = req.query;
  const filter = {};
  if (q)     filter.studentName = { $regex: q, $options: "i" };
  if (sport) filter.sport = sport;
  try {
    const results = await Report.find(filter).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// API: Grade summary for charts
app.get("/api/grades/:studentId", async (req, res) => {
  try {
    const reports = await Report.find({ studentId: req.params.studentId }).sort({ createdAt: 1 });
    const data = reports.map((r) => ({
      subject: r.subject,
      grade:   r.grade,
      date:    r.createdAt,
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 CSH AthleticTrack running at http://localhost:${PORT}`);
});
 
module.exports = app;
