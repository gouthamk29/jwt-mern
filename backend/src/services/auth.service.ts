import { APP_ORIGIN, JWT_REFRESH_SECRET, JWT_SECRET } from "../constant/env"
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, TOO_MANY_REQUESTS, UNAUTHORIZED } from "../constant/http"
import VericationCodeType from "../constant/verificationCodeTypes"
import SessionModel from "../models/session.model"
import UserModel from "../models/user.model"
import VerificationCodeModel from "../models/verificationCode.model"
import appAssert from "../utils/appAssert"
import { fiveMinutesAgo, ONE_DAY_MS, oneHourFromNow, oneYearFromNow, thirtyDaysFromNow } from "../utils/date"
import jwt, { verify } from 'jsonwebtoken'
import { RefreshTokenPayload, refreshTokenSignOptions, signToken, verifyToken } from "../utils/jwt"
import { sendMail } from "../utils/sendMail"
import { getPasswordResetTemplate, getVerifyEmailTemplate } from "../utils/emailTemplates"
import e from "express"
import { verificationCodeSchema } from "../controllers/auth.schema"
import { hashValue } from "../utils/bcrypt"

export type CreateAccountParams = {
    email:string,
    password:string,
    userAgent?:string,
}

export const createAccount = async (data:CreateAccountParams) =>{
    
    // verify if user already exists in the database and pull its data
    const existingUser = await UserModel.exists({
        email:data.email
    })

    // throw error if user already exists       
    appAssert(!existingUser,CONFLICT,'email already in use ')

    // create user
    const user = await UserModel.create({
        email:data.email,
        password:data.password,
    })      

    const userId = user._id;

    //create verification code

    const verificationCode = await VerificationCodeModel.create({
        userId,
        type:VericationCodeType.EmailVerification,
        expiredAt:oneYearFromNow(),
    })


    //send verification email

    const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`

   const {error:EmailError}= await sendMail({
        to:user.email,
        ...getVerifyEmailTemplate(url),

    })
    
    if(EmailError){
        console.log('Failed to send email',EmailError);
    }

    //create session

    const session = await SessionModel.create({
        userId,
        userAgent:data.userAgent,
    })

    //sign access token and refresh token
    //refratcirng the code below to use the signToken function
    // const refreshToken = jwt.sign(
    //    {sessionId:session._id},
    //    JWT_REFRESH_SECRET,
    //    {
    //        expiresIn:'7d',
    //        audience:['user'],
    //    }
    // )


    const refreshToken = signToken( {sessionId:session._id},refreshTokenSignOptions)
    //sign token will default to accessTokenSignOptions withour giving refreshTokenSignOptions


    //refratcirng the code below to use the signToken function
    // const accessToken = jwt.sign(
    //     {sessionId:session._id,userId:user._id},
    //     JWT_SECRET,
    //     {
    //         expiresIn:'15m',
    //         audience:['user'],
    //     }
    //  )

    const accessToken = signToken({sessionId:session._id,userId})

    //return user and tokens

     return{
        user:user.omitPassword(),
        accessToken,
        refreshToken
     }
}



export type loginParams = {
    email:string,
    password:string,
    userAgent?:string,
}

export const loginUser = async({email,password,userAgent}:loginParams)=>{
    

    //get the user by email
    
    const user = await UserModel.findOne({
        email
    });
    
    
    appAssert(user,UNAUTHORIZED,'invalid email ');
    
    const userId = user._id;
    

    //validate password from the request
    const isValid =await user.comparePassword(password);
    
    appAssert(isValid,UNAUTHORIZED,'invalid password');


    //create a session

    const session = await SessionModel.create({
        userId,
        userAgent,
    })

    const sessionInfo = {
        sessionId:session._id,
    }

    //sign access token and refresh token
    const refreshToken = signToken({sessionId:session._id},refreshTokenSignOptions)
 
    const accessToken = signToken({sessionId:session._id,userId})

    //return user and tokens

      return {
            user:user.omitPassword(),
            accessToken,
            refreshToken,
      }

}

export const refreshUserAccessToken = async (refreshToken:string)=>{
    const {payload} = verifyToken<RefreshTokenPayload>(refreshToken,{
        secret:refreshTokenSignOptions.secret,
    })

    appAssert(payload,UNAUTHORIZED,'invalid refresh token')

    const session = await SessionModel.findById(payload.sessionId);
    appAssert(session
        && session.expiresAt.getTime() > Date.now()
        ,UNAUTHORIZED,'Session expired');

// refresh the session if it expires in next 24 hours

    const sessionNeedsRefresh = session.expiresAt.getTime() - Date.now() < ONE_DAY_MS;
    if(sessionNeedsRefresh){
        session.expiresAt = thirtyDaysFromNow();
        await session.save();
    }

    const newRefreshToken =sessionNeedsRefresh ? signToken({sessionId:session._id},refreshTokenSignOptions) : undefined;

    const accessToken = signToken({
        sessionId:session._id,
        userId:session.userId
    })
    
    return {
        accessToken,
        newRefreshToken,
    }

}   

export const verifyEmail =async (code:string)=>{
    //get the verification code

    const validCode = await VerificationCodeModel.findOne({
        _id:code,
        type:VericationCodeType.EmailVerification,
        expiredAt:{$gt:new Date()},
    })

    appAssert(validCode,NOT_FOUND,'Invalid or expired code');

    //get user by id
    //update user emailVerified to true

    const updatedUser = await UserModel.findByIdAndUpdate(
        validCode.userId,
        {
            verified:true,
        },
        {new:true}
    );
    appAssert(updatedUser,INTERNAL_SERVER_ERROR,'Failed to verify email');
    
    //delete the verification code
    await validCode.deleteOne();
    //return user
    return {
        user:updatedUser.omitPassword(),
    }
}

export const sendPasswordResetEmail=async (email:string)=>{
    //get user by email

    try{
        const user = await UserModel.findOne({email});

    appAssert(user,NOT_FOUND,'User not found');

    //check email rate limit
    const fiveMinAgo = fiveMinutesAgo();
    const count = await VerificationCodeModel.countDocuments({
        userId:user._id,
        type:VericationCodeType.passwordReset,
        createdAt:{$gt:fiveMinAgo},
    })

    appAssert(count  <=1,TOO_MANY_REQUESTS,"Too many request, please try later again later");

    //create verification code
    const expiredAt  = oneHourFromNow();

    const verificationCode = await VerificationCodeModel.create({
        userId:user._id,
        type:VericationCodeType.passwordReset,
        expiredAt,
    })

    //send verification email

    const url = `${APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${expiredAt.getTime()}`;

    const {data,error} = await sendMail({
        to:user.email,
        ...getPasswordResetTemplate(url),
    })

    appAssert(data?.id,INTERNAL_SERVER_ERROR,`${error?.name} - ${error?.message}}`);

    return {
        url,
        emailId:data.id,
    }
    }catch(error:any){
        console.log(`SendPasswordResetError`,error.message)
        return {};
    }
       
}


type ResetPasswordParams ={
    password:string,
    verificationCode:string,
}


export const resetPassword = async(
    {
        password,verificationCode
    }:ResetPasswordParams
    )=>{
        //get the verification code
        //update the users password
        //delete the verification code
        //delete all sessions

        const validCode  =await VerificationCodeModel.findOne({
            _id:verificationCode,
            type:VericationCodeType.passwordReset,
            expiredAt:{$gt:new Date()}
        })


        appAssert(validCode,NOT_FOUND,"Invalid or expired code");

        const updatedUser = await UserModel.findByIdAndUpdate(
            validCode.userId,
            {
                password:await hashValue(password),
            }
        )
        appAssert(updatedUser,INTERNAL_SERVER_ERROR,"Failed to reset password");

        //delete the verification code
        await validCode.deleteOne();

        //delete all sessions

        await SessionModel.deleteMany({
            userId:updatedUser._id,
        })

        return {
            user:updatedUser.omitPassword(),
        }
    }
