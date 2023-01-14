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
})
.catch((err)=>{
    console.log(err)
    console.log("Deu errado")
})

app.post('/participants', async (req, res) => {
    const {name} = req.body;
    const lastStatus = Date.now()
    try{
        const nameExist = await db.collection('participants').findOne({name})
        if (nameExist) return res.status(409).send("esse usuário já existe")
        await db.collection('participants').insertOne({name, lastStatus})
        res.send('Ok')
    }catch(err){
        console.log(err)
        res.status(500).send("Deu algo errado no servidor")
    } 
})

app.get('/participants', async (res, res) => {
    try {
        const users = await db.collection("participants").find().toArray()
        if (!users) return res.status(404).send("Não há participantes")
        res.send(users)
      } catch (error) {
        res.status(500).send("Deu um erro no servidor de banco de dados")
      }
})
