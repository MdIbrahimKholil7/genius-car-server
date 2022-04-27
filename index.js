const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const res = require('express/lib/response');
const app = express()
app.use(cors())
require('dotenv').config()
app.use(express.json())
const port = process.env.PORT || 5000

function verifyJWT(req, res, next) {
    const header = req.headers.authorization
    if(!header){
        const error=res.status(401).send({message:'Unauthorized access'})
        console.log(error)
        return 
    }
    const token=header.split(' ')[1]
    jwt.verify(token,process.env.ACCESS_TOKEN,(error,decode)=>{
        if(error){
            console.log('403 from verify jwt')
           return res.status(403).send({message:'forbidden access'})
        }
        req.decode=decode
        console.log('decode',decode)
        next()
    })
}

const uri = `mongodb+srv://dbuser1:0suGdWn1KPvwElGA@cluster0.bqhee.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        console.log('connect')
        await client.connect()
        const serviceCollection = client.db('geniusService').collection('service')
        const orderCollection = client.db('geniusService').collection('order')
        // get all data 
        app.get('/service', async (req, res) => {
            console.log('data')
            const query = {}
            const cursor = serviceCollection.find(query)
            const service = await cursor.toArray()
            res.send(service)

        })

        // get one data 
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.findOne(query)
            res.send(result)
        })

        // access token 
        app.post('/login', async (req, res) => {
            const body = req.body
            const accessToken = jwt.sign(body, process.env.ACCESS_TOKEN, {
                expiresIn: '1d'
            })
            res.send({ accessToken })
        })

        // Order collection 
        // get order 
        app.get('/order', verifyJWT, async (req, res) => {
            const email = req.query.email
            const decodeEmail=req.decode.user
            console.log(decodeEmail,email)
            if(decodeEmail === email){
                const query = { email }
                const cursor = orderCollection.find(query)
                const result = await cursor.toArray()
                res.send(result)
            }else {
                return res.status(403).send({message:'forbidden access'})
            }
        })
        // getProduct 
        app.post('/product', async (req, res) => {
            const body = req.body
            const keys = body.map(prod => prod.productId)
            const ids = keys.map(id => ObjectId(id))
            const query = { _id: { $in: ids } }
            const cursor = serviceCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
            //for post
        })
        // post data 
        app.post('/order', async (req, res) => {
            const body = req.body
            console.log(body)
            const order = await orderCollection.insertOne(body)
            res.send({ order })
        })

    } finally {
        // client.close()
    }
}

run().catch(console.dir)
app.get('/', (req, res) => {
    res.send('server is running')
})
app.get('/hero',(req,res)=>{
    res.send('Heroku update')
})
app.listen(port, () => {
    console.log('Port is running', port)
})


