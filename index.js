const express= require('express');
const cors= require('cors');

const app= express();
const port= process.env.PORT || 5000;

//middlewares
app.use(cors());
app.use(express.json());


app.get('/', async (req,res)=>{
    await res.send('Bookshelf Server is running');
})

app.listen(port,()=>{
    console.log(`Bookshelf server is running on port:${port}`)
})