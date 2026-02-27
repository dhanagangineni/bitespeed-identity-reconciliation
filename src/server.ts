import express from "express";
import identifyRoute from "./routes/identifyRoute";

const app = express();
app.use(express.json());

// health check route
app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/identify", identifyRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});