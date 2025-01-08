import mongoose from "mongoose";
import VericationCodeType from "../constant/verificationCodeTypes";

export interface VericationCodeDocument extends mongoose.Document{
    userId:mongoose.Types.ObjectId;
    type:VericationCodeType;
    expiredAt:Date;
    createdAt:Date;
}

const verificationCodeSchema = new mongoose.Schema<VericationCodeDocument>({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:"user",required:true,index:true},
    type:{type:String,required:true},
    createdAt:{type:Date,required:true,default:Date.now},
    expiredAt:{type:Date,required:true},
});

const VerificationCodeModel = mongoose.model<VericationCodeDocument>('VerificationCode',verificationCodeSchema,"verification_codes");

export default VerificationCodeModel;