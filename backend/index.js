const express = require('express');
const TranscriptRouter = require('./routers/transcriptRouter')
const UserRouter = require('./routers/userRouter')
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors({
    origin:'*'
}));

app.use(express.json());
app.use('/transcript', TranscriptRouter);
app.use('/users', UserRouter);

//router or end points
app.get('/',(req,res) => {
    res.send('Response from Server');
});

//starting the server
app.listen(port,() => {
    console.log('Server Started'); 
});

    