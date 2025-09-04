const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors()); // Allow frontend to call backend

// Simple API endpoint
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.listen(8000, () => {
  console.log("Backend running on http://localhost:8000");
});
