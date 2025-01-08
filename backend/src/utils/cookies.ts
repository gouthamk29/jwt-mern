import { CookieOptions, Response } from "express"
import { fiftenMinutesFromNow, thirtyDaysFromNow } from "./date"

export const REFRESH_PATH = '/auth/refresh'


type Params = {
    res:Response,
    accessToken:string,
    refreshToken:string,
}


const secure = process.env.NODE_ENV !== 'production'

const defaults:CookieOptions = {
    sameSite:'strict',
    httpOnly:true,
    secure:secure,
}

export const getAccessTokenCookieOption = ():CookieOptions=>({
    ...defaults,
    expires:fiftenMinutesFromNow(),
})

//use path to restrict the cookie to a specific path i.e auth/refresh is only place to access the refresh token

export const getRefreshTokenCookieOption = ():CookieOptions=>({
    ...defaults,
    expires:thirtyDaysFromNow(),
    path:REFRESH_PATH
})

export const setAuthCookies = ({res,accessToken,refreshToken}:Params)=>
    res.cookie('accessToken',accessToken,getAccessTokenCookieOption())
    .cookie('refreshToken',refreshToken,getRefreshTokenCookieOption())


export const clearAuthCookies = (res:Response)=>
    res.clearCookie('accessToken').clearCookie('refreshToken',{
        path:REFRESH_PATH
    })