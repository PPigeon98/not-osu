import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// CORS middleware to parse JSON
app.use(cors());
app.use(express.json());

////////////////////////////////////////////////////////////////////////////////////////////////////
// WRITE BELOW ONLY!!



// WRITE ABOVE ONLY!!
////////////////////////////////////////////////////////////////////////////////////////////////////

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
