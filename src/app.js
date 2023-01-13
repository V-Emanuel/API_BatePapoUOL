import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const PORT = 5000;
const app = express();
app.use(cors());
app.use(express.json());
app.listen(PORT);

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()

.then(() => {
	db = mongoClient.db();
    console.log("Deu Certo")
})

.catch(()=>{
    console.log("Deu errado")
})

