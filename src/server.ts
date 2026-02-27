import express from "express";
import identifyRoute from "./routes/identifyRoute";

const app = express();
app.use(express.json());

app.use("/identify", identifyRoute);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});