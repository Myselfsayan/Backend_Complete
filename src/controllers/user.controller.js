import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import {uploadoncloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async(req,res)=>{
    //Get user details from Frontend
    //Validation
    //Check if user already exists :username or email
    //Check for images and checks for avtar
    //upload them to cloudinary ,avtar
    //Create user Object - Create entry in DB
    //remove password and refresh token field from response
    //check for user creation
    //return response to frontend
    
    const {userName,fullname ,email , password}= req.body
    console.log("email",email)

    // if(userName === ""){
    //     throw new ApiError(400,"Username is required")
    // }
    if([userName,fullname ,email , password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"Username is required")
    }
    
    const existedUser = User.findOne({
        $or :[{ email } , { userName }]
    })
    if(existedUser){
        throw new ApiError(409,"User already exists")
    }
    const avtarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avtarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }

    const avatar = await uploadoncloudinary(avtarLocalPath)
    const image = await uploadoncloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }
    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        userName : userName.toLowerCase(),
        password
    })

    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createUser){
        throw new ApiError(500,"User registration failed")
    }
    return res.status(201).json(
        new ApiResponse(200,createUser,"User registered successfully")
    )

})

export {registerUser}