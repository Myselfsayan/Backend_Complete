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
    const order = sortType === "asc" ? 1 : -1;

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
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
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