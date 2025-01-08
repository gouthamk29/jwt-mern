

const getEnv = (key:string,defaultValue?:string):string=>{
    const value = process.env[key] || defaultValue;

    if(value === undefined){
        throw new Error(`Missing environment variable ${key}`);
    }
    return value;

}

export const MONGO_URL = getEnv('MONGO_URL');
export const NODE_ENV =getEnv('NODE_ENV','developement');
export const PORT =getEnv('PORT','4004');
export const APP_ORIGIN =getEnv('APP_ORIGIN');
export const JWT_SECRET =getEnv('JWT_SECRET');
export const JWT_REFRESH_SECRET =getEnv('JWT_REFRESH_SECRET');
export const EMAIL_SENDER =getEnv('EMAIL_SENDER');
export const RESEND_API_KEY =getEnv('RESEND_API_KEY');

