const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const jwt= require('jsonwebtoken');
const cookieParser= require('cookie-parser')
//middlewares
app.use(cors({
    origin:'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
//middleware for verifying token
const verifyToken = (req, res, next)=>{
    const token= req?.cookies?.token;
    //console.log('Token inside verify middleware', token);
    if(!token){
        return res.status(401).send({message: 'User Unauthorized'});
    }
    //if token exists then verify and decode the token for verification
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode)=>{
        if(err){
            return res.status(401).send({message: 'Unauthorized Access'});
        }
        req.user= decode; 
        next();
    })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cfuzedb.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const database = client.db("bookshelfdb");
//collections
const categories = database.collection("categories");
const books = database.collection("books");
const cart = database.collection("cart");


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        //add book category
        app.post('/addCategory', async (req, res)=>{
            const result= await categories.insertOne(req.body);
            res.send(result);
        })
        //get all book categories
        app.get('/categories', async (req, res)=>{
            const result= await categories.find().toArray();
            res.send(result);
        })

        //get books of all categories
        app.get('/allBooks', verifyToken, async (req, res)=>{            
            if(req.query.email !== req.user.email){
                return res.status(403).send({message: 'Forbidden to view the content of this page'})
            }
            const result= await books.find().toArray();
            res.send(result);
        })

        //get only available books (quantity>0)
        app.get('/availableBooks', async(req, res)=>{
            const query={quantity: {$gt: 0}};
            const result= await books.find(query).toArray();
            res.send(result);
        })

        //add book
        app.post('/addBook', async(req, res)=>{
            const result= await books.insertOne(req.body);
            // console.log(req.cookies);
            res.send(result);
        })

        //find Books by category
        app.get('/books/category/:category', async(req, res)=>{            
            const query= {category: req.params.category};            
            const result= await books.find(query).toArray();
            res.send(result);
        })

        //find a book by id
        app.get('/book/:id', async(req, res)=>{
            //console.log(req.params);
            const query={_id: new ObjectId(req.params.id)}
            const result= await books.findOne(query);
            res.send(result);
        })

        //update book information 
        app.put('/updateBook/:id', async (req, res)=>{
            const id= req.params.id; 
            const newBook= req.body;
            const filter= {_id: new ObjectId(id)};
            const updatedData= {
                $set:newBook
            }
            //console.log(updatedData);
            const result= await books.updateOne(filter, updatedData) ;
            res.send(result);
        })

        //add book to cart
        app.post('/addToCart', async(req, res)=>{
            const result= await cart.insertOne(req.body);
            res.send(result);            
        })

        //update stock after adding to cart
        app.patch('/updateStock/:id', async(req, res)=>{
            const id= req.params.id;
            const newQuantity= req.body.quantity; 
            const filter= {_id: new ObjectId(id)}; 
            const updatedDoc= {
                $set: {
                    quantity: newQuantity
                }
            }
            //console.log(updatedDoc);
            const result= await books.updateOne(filter, updatedDoc) ;
            res.send(result);
        })
        
        //get borrowed books
        app.get('/borrowedBooks', async(req, res)=>{
            
            let query={};
            if(req.query?.email){
                query={email:req.query?.email}
            }
            const result= await cart.find(query).toArray();
            res.send(result);            
        })

        //delete borrowed book
        app.delete('/delete/cart/:email/:bookID', async(req,res)=>{
            const email=req.params.email;
            const bookID=req.params.bookID;
            const query={email:email, bookID:bookID };
            const result= await cart.deleteOne(query);
            res.send(result);
        })

        //JSON Web token JWT
        app.post('/jwt', async(req, res)=>{
            const user= req.body;
            const token= jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
            res.cookie('token', token,{
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
            .send({success: true})
        })


    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);



app.get('/', async (req, res) => {
    await res.send('Bookshelf Server is running');
})

app.listen(port, () => {
    console.log(`Bookshelf server is running on port:${port}`)
})