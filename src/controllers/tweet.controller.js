import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if(!content || !content.trim()){
        throw new ApiError(400, "Content is required")
    }
    if (content.trim().length > 280) {
    throw new ApiError(400, "Tweet cannot exceed 280 characters");
    }
    if(!req.user?._id){
        throw new ApiError(401, "Unauthorized")
    }
    const tweet = await Tweet.create({
        content : content.trim(),
        owner : req.user._id
    })
    if(!tweet) {
        throw new ApiError(500, "Failed to create tweet")
    }
    res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }
    const userExist = await User.exists({_id : userId})
    if(!userExist){
        throw new ApiError(404, "User not found")
    }
    const tweets = await Tweet
        .find({owner : userId})
        .sort({createdAt : -1})
        .populate({
        path : "owner",
        select : "name username avatar createdAt updatedAt"
    })
    
    res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    // Authentication check (FIXED)
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }

    // Content validation
    if (!content || !content.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length > 280) {
        throw new ApiError(400, "Tweet cannot exceed 280 characters");
    }

    // Authorization + Update (IMPROVED)
    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user._id
        },
        {
            $set: { content: trimmedContent }
        },
        {
            new: true,              // return updated doc
            runValidators: true    // enforce schema rules
        }
    );

    // Not found / unauthorized
    if (!updatedTweet) {
        throw new ApiError(
            404,
            "Tweet not found or you are not the owner"
        );
    }

    // Response
    return res.status(200).json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        )
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    if(!req.user?._id){
        throw new ApiError(401, "Unauthorized")
    }
    const deletedTweet = await Tweet.findOneAndDelete({
        _id : tweetId,
        owner : req.user._id
    })
    if(!deletedTweet){
        throw new ApiError(404, "Tweet not found or you are not the owner")
    }
    res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}