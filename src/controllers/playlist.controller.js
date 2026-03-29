import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!name || !description || !name.trim() || !description.trim()){
        throw new ApiError(400, "Name and description are required")
    }
    if(!req.user?._id){
        throw new ApiError(401, "Unauthorized")
    }
    const playlistExist = await Playlist.findOne({name : name.trim(), owner : req.user._id})
    if(playlistExist){
        throw new ApiError(400, "Playlist with the same name already exists")
    }
    // if(!isValidObjectId(req.user._id)){
    //     throw new ApiError(400, "Invalid user id")
    // } No need this as we check this in middleware
    const playlist = await Playlist.create({
        name : name.trim(),
        description : description.trim(),
        owner : req.user._id,
        videos : []
    })
    if(!playlist) {
        throw new ApiError(500, "Failed to create playlist")
    }
    res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const userExist = await User.exists({ _id: userId });
    if (!userExist) {
        throw new ApiError(404, "User not found");
    }

    const isOwner = req.user?._id?.toString() === userId;

    const query = isOwner
        ? { owner: userId }
        : { owner: userId, isPrivate: false };

    const playlists = await Playlist.find(query)
        .populate({
        path: "videos",
        select: "thumbnail title description duration createdAt"
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(
        200,
        playlists,
        playlists.length
            ? "Playlists fetched successfully"
            : "No playlists found"
        )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }

    // 2. Fetch playlist
    const playlist = await Playlist.findById(playlistId)

    // 3. Not found check
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // 4. Check ownership
    const isOwner =
        req.user?._id?.toString() === playlist.owner.toString();

    // 5. Privacy check
    if (playlist.isPrivate && !isOwner) {
        throw new ApiError(403, "This playlist is private");
    }

    // 6. Response
    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
});


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid playlist id or video id")
    }
     // 2. Fetch playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // 4. Check video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // 6. Add video
    playlist.videos.push(videoId);
    await playlist.save();

    // 7. Return updated playlist
    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}