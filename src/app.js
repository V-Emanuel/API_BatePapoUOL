import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi';
import dayjs from "dayjs";
dotenv.config();

const PORT = 5000;
const app = express();
app.use(cors());
app.use(express.json());


const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;
try {
    await mongoClient.connect()
    db = mongoClient.db()
    console.log('Deu certo')
} catch (err) {
    console.log('Deu errado')
}

app.post('/participants', async (req, res) => {
    const { name } = req.body;
    const lastStatus = Date.now();
    const userSchema = joi.object({
        name: joi.string().required()
    });
    const validation = userSchema.validate(name, { abortEarly: true });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    try {
        const nameExist = await db.collection('participants').findOne({ name })
        if (nameExist) return res.status(409).send("esse usuário já existe")
        await db.collection('participants').insertOne({ name, lastStatus })
        await db.collection("messages").insertOne({
            from: name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs().format('HH:mm:ss')
        })
        res.send('Ok')
    } catch (err) {
        console.log(err)
        res.status(500).send("Deu algo errado no servidor")
    }
})

app.get('/participants', async (req, res) => {
    try {
        const users = await db.collection("participants").find().toArray()
        if (!users) return res.status(404).send("Não há participantes")
        res.send(users)
    } catch (error) {
        res.status(500).send("Deu um erro no servidor de banco de dados")
    }
})

app.post('/messages', async (req, res) => {
    const { to, text, type} = req.body;
    const messageSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required()
    });
    const validation = messageSchema.validate({to, text, type}, { abortEarly: true });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    try {
        await db.collection("messages").insertOne({
            to,
            text,
            type,
            time: dayjs().format('HH:mm:ss')
        })
        res.send('Ok')
    } catch (err) {
        console.log(err)
        res.status(500).send("Deu algo errado no servidor")
    }
})

app.get('/messages', async (req, res) => {
    const messages =  await db.collection("messages").find().toArray()
    try {
        return res.send(messages)
    } catch(err) {
        return res.sendStatus(500).send(err.message)
    }
})

app.listen(PORT);