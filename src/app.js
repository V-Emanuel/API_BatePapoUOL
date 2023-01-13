import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const PORT = 5000;
const app = express();
app.use(cors());
app.use(express.json());
app.listen(PORT);


