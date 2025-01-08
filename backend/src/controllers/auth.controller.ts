import { x } from "joi";
import catchError from "../utils/catchError";
import {z} from 'zod';
import { createAccount, loginUser, refreshUserAccessToken, resetPassword, sendPasswordResetEmail, verifyEmail } from "../services/auth.service";
import { CREATED, OK, UNAUTHORIZED } from "../constant/http";
import { clearAuthCookies, getAccessTokenCookieOption, getRefreshTokenCookieOption, setAuthCookies } from "../utils/cookies";
import { emailSchema, loginSchema, registerSchema, resetPasswordSchema, verificationCodeSchema } from "./auth.schema";
import { verifyToken } from "../utils/jwt";
import SessionModel from "../models/session.model";
import appAssert from "../utils/appAssert";


export const registerHandler = catchError(
    async (req,res)=>{

        // validate request
        const request = registerSchema.parse({
            ...req.body,
            userAgent:req.headers['user-agent'],
        });

        // call service

        const {
            user,
            accessToken,
            refreshToken,
        } =await createAccount(request);


        return setAuthCookies({res,accessToken,refreshToken})
        .status(CREATED).json(user)
    }
)

export const loginHandler = catchError(
    async (req,res)=>{
        const request = loginSchema.parse({
            ...req.body,
            userAgent:req.headers['user-agent']
        });
        
        const {accessToken,refreshToken} = await loginUser(request);

        return setAuthCookies({res,accessToken,refreshToken}).status(OK).json({
            message:'login successful',
        })
    }
)

export const logoutHandler = catchError(
    async (req,res)=>{
            const accessToken =req.cookies.accessToken as string|undefined;
            const {payload} = verifyToken(accessToken || '');

            if(payload){
                //delete the session
                await SessionModel.findByIdAndDelete(payload.sessionId);
            }

            return clearAuthCookies(res)
            .status(OK).json({
                message:'logout successful'
            })
        })

export const refreshHandler = catchError(
    async (req,res)=>{

        const refreshToken = req.cookies.refreshToken as string|undefined;
        

        appAssert(refreshToken,UNAUTHORIZED,'Missing refresh token');

        const {
            accessToken,
            newRefreshToken,
        } = await refreshUserAccessToken(refreshToken);

        if(newRefreshToken){
            res.cookie('refreshToken',newRefreshToken,getRefreshTokenCookieOption())
        }

        return res.status(OK)
        .cookie('accessToken',accessToken,getAccessTokenCookieOption())
        .json({
                message:"Access token refreshed"
            }
        )
    }
)

export const verifyEmailHandler= catchError(
    async (req,res)=>{
        const verificationCode =verificationCodeSchema.parse(req.params.code);

        await verifyEmail(verificationCode);

        return res.status(OK).json({
            message:'Email was succesfully verified',
        })
    }
)

export const sendPasswordResetHandler = catchError(
    async (req,res)=>{
        const email = emailSchema.parse(req.body.email);

        await sendPasswordResetEmail(email);

        return res.status(OK).json({
            message:"Password reset email sent"
        });
    }
)

export const resetPasswordHandler = catchError(
    async (req,res)=>{
        const request = resetPasswordSchema.parse(req.body);

        await resetPassword(request);

        return clearAuthCookies(res).status(OK).json({
            message:"password reset successful"
        })
         
    }
)