import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


import asyncHandler from "express-async-handler";
import Video from "../models/video.model.js";

export const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    // Convert to numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // ======================
    // FILTER
    // ======================
    let filter = {};


    // Filter by owner (userId)

    if (userId) {
        filter.owner = userId;
    }

    // Search (title + description)
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // ======================
    // SORTING
    // ======================
    let sortOptions = {};

    const field = sortBy || "createdAt"; // default sort
    const order = sortType === "asc" ? 1 : -1 ;

    sortOptions[field] = order;

    // ======================
    // PAGINATION
    // ======================
    const skip = (pageNum - 1) * limitNum;

    // ======================
    // DATABASE QUERY
    // ======================
    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum);

    // ======================
    // TOTAL COUNT (for frontend pagination)
    // ======================
    const totalVideos = await Video.countDocuments(filter);

    // ======================
    // RESPONSE
    // ======================


    res.status(200).json({
        success: true,
        totalVideos,
        currentPage: pageNum,
        totalPages: Math.ceil(totalVideos / limitNum),
        videos
    });
});

const publishAVideo = asyncHandler(async (req, res) => {
    
    // TODO: get video, upload to cloudinary, create video
    //Take title, description from req.body and video file from req.files
    const { title, description} = req.body
    const { video} = req.files
    //Check if title + video file exist
    if(!title || !description){
        throw new ApiError(400, "Title and description are required")
    }
    if(!video ){
        throw new ApiError(400, "video is required")
    }
    //Extract video path from multer (local storage)
    const videoFilePath = video[0]?.path;
    // const thumbnailFilePath = req.file?.path;
    if(!videoFilePath){
        throw new ApiError(400, "Video file is required")
    }
    // Step 2: Send to Cloudinary
    const videoResult = await cloudinary.uploader.upload(videoFilePath, {
    resource_type: "video"
    });
    // const ThumbnailResult = await cloudinary.uploader.upload(thumbnailFilePath, {
    // resource_type: "thumbnail"
    // });
//Save in DB
    const newVideo = await Video.create({
    title: req.body?.title,
    description: req.body?.description,
    videoFile : videoResult.secure_url,
    publicId: videoResult.public_id,
    owner: req.user._id
});
//respond
res.status(201).json({
  message: "Video uploaded successfully",
  video: newVideo
});
})

const getVideoById = asyncHandler(async (req, res) => {
    
    //TODO: get video by id


    // Get videoId from params
    const { videoId } = req.params
    // Validate it
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    // Find video in DB
    const video = await Video.findbyId(videoId)
    // If not found → error
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    // Return video
    res
    .status(200)
    .json({
        success : true,
        video
    })
    "Video fetched succesfully"
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}