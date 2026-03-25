import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { subscription, Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"




const toggleSubscription = asyncHandler(async (req, res) => {
    
    // TODO: toggle subscription
    //Get data
    const {channelId} = req.params
    const subscriberId = req.user._id
    //Validate Data
    if(!subscriberId){
        throw new ApiError("SubscriberId is required",400)
    }
    //Check existing subscription
    if(subscription){
        //Subscription exists, so unsubscribe
        await Subscription.findOneAndDelete({
            subscriber : subscriberId,
            channel : channelId
    })
    }
    else{
        
        //Subscription doesn't exist, so subscribe
        const newSubscription = new Subscription({
            subscriber : subscriberId,
            channel : channelId
        })

        await newSubscription.save()
    }
    res
    .status(200)
    .json({
        success : true,
        message : subscription ? "Unsubscribed successfully" : "Subscribed successfully"
    })
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404,"Channel not found")
    }
    //Find Subscribers
    const subscribers = await Subscription.find({
    channel: channelId
})
    res
    .status(200)
    .json({
        success : true,
        subscribers
    })
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const subscriber = await User.findById(subscriberId)
    if(!subscriber){
        throw new ApiError(404,"User not found")
    }
    const subscriptions = await Subscription.find({
    subscriber: subscriberId
    })
    .populate("channel", "username avatar")
    res
    .status(200)
    .json({
        success: true,
        subscribedChannels: subscriptions.map(sub => sub.channel)
    })
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}