import assert from 'node:assert'
import AppError from './AppError'
import { Condition } from 'mongoose'
import { HttpStatusCode } from '../constant/http'
import AppErrorCode from '../constant/appErrorCode'


/**
 * Asserts a condition and throws an AppError if the condition is falsy.
 */

type AppAssertType = (
    condition:any,
    httpStatusCode:HttpStatusCode,
    message:string,
    appErrorCode?:AppErrorCode
) =>asserts condition 


const appAssert :AppAssertType= (
    condition,
    httpStatusCode,
    message,
    appErrorCode
)=>assert(condition,new AppError(httpStatusCode,message,appErrorCode))

export default appAssert;