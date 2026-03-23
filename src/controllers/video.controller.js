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
    const { video , thumbnail} = req.files
    //Check if title + video file exist
    if(!title || !description){
        throw new ApiError(400, "Title and description are required")
    }
    if (!video || !thumbnail) {
        throw new ApiError(400, "Video and thumbnail are required");
    }
    //Extract video path from multer (local storage)
    const videoFilePath = video[0]?.path;
    const thumbnailFilePath = thumbnail[0]?.path;
    if(!videoFilePath || !thumbnailFilePath){
        throw new ApiError(400, "Files are missing")
    }
    // Step 2: Send to Cloudinary
    const videoResult = await cloudinary.uploader.upload(videoFilePath, {
    resource_type: "video"
    });
    const thumbnailResult = await cloudinary.uploader.upload(thumbnailFilePath, {
    resource_type: "image"
    });
//Save in DB
    const newVideo = await Video.create({
    title: req.body?.title,
    description: req.body?.description,
    videoFile: videoResult.secure_url,
    thumbnail: thumbnailResult.secure_url,
    videoPublicId: videoResult.public_id,
    thumbnailPublicId: thumbnailResult.public_id,
    owner: req.user._id
});

//respond
res.status(201).json({
    message: "Video and Thumbnail uploaded successfully",
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
    const video = await Video.findById(videoId)
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
    message :"Video fetched succesfully"
})

const updateVideo = asyncHandler(async (req, res) => {
    
    //TODO: update video details like title, description, thumbnail


    //Get videoId from params
    const { videoId } = req.params
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    // Get title & description from req.body
    const {title, description} = req.body
    // Get thumbnail from req.file (if uploaded)
    const {thumbnail} = req.file
    // Upload thumbnail to Cloudinary (if exists)
    // 👉 If new thumbnail uploaded
    if (thumbnail) {

        // 🔥 Delete old thumbnail
        if (video.thumbnailPublicId) {
            await cloudinary.uploader.destroy(Video.thumbnailPublicId,{
                resource_type : "image"
            });
        }

        // Upload new thumbnail
        const uploaded = await uploadOnCloudinary(req.file.path);

        updateFields.thumbnail = uploaded.secure_url;
        updateFields.thumbnailPublicId = uploaded.public_id;
        
        let updateFields = {};

        if (title) updateFields.title = title;
        if (description) updateFields.description = description;
    }
    // Update video in DB
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    );
    // Return updated video
    res
    .status(200)
    .json({
        success : true,
        video : updatedVideo

})
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    // ✅ Check if video exists
    
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    // ✅ Check if user is the owner (security 🔐)
    if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this video");
    }
    // ✅ Delete video and thumbnail file from Cloudinary

        if (video.thumbnailPublicId) {
            await cloudinary.uploader.destroy(video.thumbnailPublicId);
        }

        // 🎥 Delete video file
        if (video.videoFilePublicId) {
            await cloudinary.uploader.destroy(video.videoFilePublicId, {
                resource_type: "video"
            });
        }
        // ✅ Send response
        res.status(200).json({
            success: true,
            message: "Video deleted successfully"
        });

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // 1️⃣ Find video
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // 2️⃣ Toggle status
    video.isPublished = !video.isPublished;

    // 3️⃣ Save changes
    await video.save();

    // 4️⃣ Response
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            `Video is now ${video.isPublished ? "Published" : "Unpublished"}`
        )
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}