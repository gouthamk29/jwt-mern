
import { NOT_FOUND,OK } from "../constant/http";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchError";


export const getUserHandler = catchErrors(
    async (req, res) => {
     const user = await UserModel.findById(req.userId);
     appAssert(user,NOT_FOUND,"user not found");
     return res.status(OK).json(
        user.omitPassword(),
     )

    }
)