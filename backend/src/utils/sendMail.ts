import resend from "../config/resend"
import { EMAIL_SENDER, NODE_ENV } from "../constant/env"


type Params = {
    to:string,
    subject:string,
    text:string,
    html:string,
}


const getFromEmail = ()=>(
    NODE_ENV === 'development' ? 'onboarding@resend.dev' : EMAIL_SENDER
)

const getToEmail = (to:string)=>(
    NODE_ENV === 'development' ?"delevered@resend.dev":to
)

export const sendMail = async({
    to,
    subject,
    text,
    html,
}:Params)=>resend.emails.send({
    from:getFromEmail(),
    to:getToEmail(to),
    subject,
    text,
    html,
})
