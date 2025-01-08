import 'dotenv/config'
import express  from "express"
import { APP_ORIGIN, NODE_ENV, PORT } from "./constant/env";
import connectToDatabase from "./config/db";
import cors from 'cors'
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler';
import catchError from './utils/catchError';
import { OK } from './constant/http';
import autRoutes from './routes/auth.route';
import authenticate from './middleware/authenticate';
import userRoutes from './routes/user.route';
import sessionRoutes from './routes/session.route';
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(
    cors({
        origin:APP_ORIGIN,
        credentials:true,

    })
)

app.use(cookieParser());


app.get('/',(req,res,next)=>{
        throw new Error('this is an test error');
         res.status(OK).json({
            status:'healthy'
        })
    }
);


app.use('/auth',autRoutes)


//protected routes
app.use('/user',authenticate,userRoutes);
app.use('/sessions',authenticate,sessionRoutes);

app.use(errorHandler);

app.listen(
    PORT,
    async ()=>{
        console.log(`the app is running on port ${PORT} in ${NODE_ENV} environment`);
        await connectToDatabase()
    }
)