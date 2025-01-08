import { boolean } from "joi";
import mongoose from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";
import { compare } from "bcrypt";

export interface UserDocument extends mongoose.Document{
    _id: mongoose.Types.ObjectId;
    email:string;
    password:string;
    verified:boolean;
    createdAt:Date;
    updatedAt:Date;
    comparePassword(val:string):Promise<boolean>;
    omitPassword():Pick<UserDocument,
    "_id"|"verified"|"email"|"createdAt"|"updatedAt">;
}

const userSchema =new mongoose.Schema<UserDocument>({
    email:{type:String,unique:true,required:true},
    password:{type:String,required:true},
    verified:{type:Boolean,required:true,default:false},
},
    {
        timestamps:true
    }
);

userSchema.pre("save",async function (next) {

    if(!this.isModified('password')){
        return next();
    }
    this.password = await hashValue(this.password);
    return next();
})

userSchema.methods.comparePassword = async function (val:string) {
    return compareValue(val,this.password); 
}

userSchema.methods.omitPassword = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
}

const UserModel = mongoose.model<UserDocument>('user',userSchema);
export default UserModel; 