import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
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
    
    const {userName,fullName ,email , password}= req.body
    // console.log("email",email)
    // console.log("FILES:", req.files);

    // if(userName === ""){
    //     throw new ApiError(400,"Username is required")
    // }
    if([userName,fullName ,email , password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"Username is required")
    }
    
    const existedUser = await User.findOne({
        $or :[{ email } , { userName }]
    })
    if(existedUser){
        throw new ApiError(409,"User already exists")
    }
    console.log("FILES:", req.files);
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }
    

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    //console.log("Body",req.body)
    
    if(!avatar){
        throw new ApiError(400,"Avataaar is required")
    }
    

    
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        userName : userName.toLowerCase(),
        password,
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
//