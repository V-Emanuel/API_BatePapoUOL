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
    console.log(err)
    console.log('Deu errado')
}


app.post('/participants', async (req, res) => {
    const user = req.body;
    const userSchema = joi.object({
        name: joi.string().required()
    });
    const validation = userSchema.validate(user, { abortEarly: true });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    try {
        const nameExist = await db.collection('participants').findOne({ name: user.name })
        if (nameExist) return res.status(409).send("esse usuário já existe")
        await db.collection('participants').insertOne({
            name: user.name,
            lastStatus: Date.now()
        })
        await db.collection("messages").insertOne({
            from: user.name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs().format('HH:mm:ss')
        })
        return res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get('/participants', async (req, res) => {
    const users = await db.collection("participants").find().toArray()
    try {
        if (!users) return res.status(404).send("Não há participantes")
        res.send(users)
    } catch (error) {
        res.status(500).send("Deu um erro no servidor de banco de dados")
    }
})

app.post('/messages', async (req, res) => {
    const messages = req.body;
    const user = req.headers.user
    const messageSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid("private_message", "message").required()
    });
    const validation = messageSchema.validate(messages, { abortEarly: true });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    const userExists = await db.collection("participants").findOne({ name: user })
    if (!userExists) return res.sendStatus(422)
    try {
        await db.collection("messages").insertOne({
            from: user,
            ...messages,
            time: dayjs().format('HH:mm:ss')
        })
        return res.sendStatus(201)
    } catch (err) {
        return res.sendStatus(500).send(err.message)
    }
})

app.get('/messages', async (req, res) => {
    const limit = Number(req.query.limit)
    const user= req.headers.user
    const messages = await db.collection("messages").find(
        {to: "Todos"}, {to: userName}, {from: userName}
    ).toArray()
    try {
        if(limit && limit < 1)return res.sendStatus(422)
        return res.send([...messages].slice(-limit).reverse())
    } catch (err) {
        return res.sendStatus(500).send(err.messages)
    }
})

app.listen(PORT);
