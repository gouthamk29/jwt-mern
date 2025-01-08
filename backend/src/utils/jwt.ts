import jwt,{ SignOptions, VerifyOptions } from "jsonwebtoken"
import { SessionDocument } from "../models/session.model"
import { UserDocument } from "../models/user.model"
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constant/env"


export type RefreshTokenPayload = {
    sessionId:SessionDocument['_id'],

}

export type AccessTokenPayload = {
    sessionId:SessionDocument['_id'],
    userId:UserDocument['_id'],
}

export type SignOptionAndSecret = SignOptions & {
    secret:string,
}

const defaults: SignOptions = {
    audience:['user'],
}

export const accessTokenSignOptions:SignOptionAndSecret = {
    expiresIn:'15m',
    secret:JWT_SECRET
}


export const refreshTokenSignOptions:SignOptionAndSecret = {
    expiresIn:'30d',
    secret:JWT_REFRESH_SECRET,
}



export const signToken = (
    payload:RefreshTokenPayload | AccessTokenPayload,
    options?:SignOptionAndSecret,
)=>{
        const {secret,...signOptn} = options || accessTokenSignOptions

        return jwt.sign(
            payload,secret,{
                ...defaults,
                ...signOptn}
            )
    } 


export const verifyToken = <TPayload extends object = AccessTokenPayload>(
    token:string,
    options?:VerifyOptions & {secret:string}
)=>{
    const {secret =JWT_SECRET,...verifyOptn} = options || {};

    try{
        const payload = jwt.verify(token,secret,{
            ...defaults,
            ...verifyOptn,
        }) as TPayload;
        return {
            payload
        }
    } catch(error:any){
        return {
            error:error.message
        }
    }
}