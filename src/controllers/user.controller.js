import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const generateAccessandRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
            const accessToken = user.generateAccessToken()
            console.log("tknnnn",accessToken)
            const refreshToken = user.generateRefreshToken()

            user.refreshToken = refreshToken
            await user.save({validateBeforeSave : false})

            return {accessToken , refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating Access and Refresh token")
    }
}


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
    //console.log("FILES:", req.files);
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

const loginUser = asyncHandler(async(req,res)=>{
    //req , body -> data
    //username or email
    //Find the user
    //Password check
    //Access and Refresh Token
    //send Cookie

    const {email,userName,password} = req.body

    if(!userName && !email){
        throw new ApiError(400,"email and Username is required")
    }
    //User -> this object is coming from Mongoose

    const user = await User.findOne(
        {
            $or : [{userName} , {email}]
        }
    )
    if(!user){
        throw new ApiError(404,"User doesn't exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid credentials")
    }

    const{accessToken,refreshToken} = await generateAccessandRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        htttpOnly : true,
        secure : true
    }
    console.log("accstkn",accessToken)
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser , accessToken , refreshToken
            },
            "User LoggedIn successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly : true,
        secure : false
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200 , {} , "User Logged Out"))
})



export {registerUser,loginUser,logoutUser}
//