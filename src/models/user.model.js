import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
        userName : {
            type:String,
            required : true, 
            unique : true,
            lowercase : true,
            trim : true,
            index : true
        },
        eamil : {
            type:String,
            required : true, 
            unique : true,
            lowercase : true,
            trim : true,
        },
        fullName : {
            type:String,
            required : true, 
            trim : true,
            index : true
        },
        avatar : {
            type:String, // cloudinary url
            required : true, 
        },
        coverImage : {
            type:String, // cloudinary url 
        },
        watchHistory : [
            {
                type : Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password : {
            type : String,
            required : [true , "Password is required"]
        },
        refreshToken : {
            type : String
        }
        
    },
    {
        timestamps : true
    }
)

userSchema.pre("save", async function(next){
    if(!this.isModified("password"))    return next();

    this.password = await bcrypt.hash(this.password , 10)
    next();
    // Here next tells mongoose "I'm done you can continue saving now"
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function () {
    jwt.sign(
        {
            _id : this._id,
            email : this.email,
            userName : this.userName, //PAYLOAD
            fullName : this.fullName

        },
        process.env.ACCESS_TOKEN_SECRET, //SECRET
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY //OPTIONS
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    jwt.sign(
        {
            _id : this._id
            //Every record has _id , This is an unique code
            //Refresh token stored in DB
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)
//************  In mongoDB this 'User' will be saved as 'users'  ***************