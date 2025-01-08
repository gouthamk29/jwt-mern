import mongoose from "mongoose"
import { MONGO_URL } from "../constant/env";
const connectToDatabase =async ()=>{
    try{
        await mongoose.connect(MONGO_URL);
        console.log('successfully connected to database')
    }catch(error){
        console.log('could not connect to database',error);
       
        process.exit(1);
    }
}

export default connectToDatabase;