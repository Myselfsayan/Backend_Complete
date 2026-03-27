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
    const { channelId } = req.params;

    // ✅ Pagination (safe handling)
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const channelObjectId = new mongoose.Types.ObjectId(channelId);

    // ✅ Check if channel exists
    const channel = await User.findById(channelObjectId)
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // ✅ Aggregation pipeline
    const result = await Subscription.aggregate([
        {
            $match: {
                channel: channelObjectId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $unwind: "$subscriber"
        },
        {
            $facet: {
                subscribers: [
                    { $sort: { createdAt: -1 } },
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 0,
                            subscriberId: "$subscriber._id",
                            username: "$subscriber.username",
                            avatar: "$subscriber.avatar"
                        }
                    }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ]);

    // ✅ Safe extraction
    const subscribers = result[0]?.subscribers || [];
    const totalSubscribers = result[0]?.totalCount[0]?.count || 0;

    // ✅ Pagination metadata
    const totalPages = Math.ceil(totalSubscribers / limit);

    // ✅ Final response
    res.status(200).json({
        success: true,
        currentPage: page,
        pageSize: limit,
        totalPages,
        totalSubscribers,
        subscribers
    });
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
        const { subscriberId } = req.params
        // ✅ Pagination (safe handling)
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        // ✅ Validate ObjectId
        if (!mongoose.Types.ObjectId.isValidObjectId(subscriberId)) {
            throw new ApiError(400, "Invalid Subscriber ID");
        }

        const subscriberObjectId = new mongoose.Types.ObjectId(subscriberId);

        const subscriber = await User.findById(subscriberId)
        if(!subscriber){
            throw new ApiError(404,"User not found")
        }
        const subscriptions = await Subscription.aggregate([
            {
                $match: {
                    subscriber : subscriberObjectId
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channel"
                }
            },
            {
                $unwind: "$channel"
            },
            {
                $facet: {
                    channels: [
                        { $sort: { createdAt: -1 } },
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 0,
                                channelId: "$channel._id",
                                username: "$channel.username",
                                avatar: "$channel.avatar"
                            }
                        }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ])
        res
        .status(200)
        .json({
            success: true,
            subscriptions : subscriptions[0]?.channels || [],
            totalCount : subscriptions[0]?.totalCount[0]?.count || 0
        })
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}