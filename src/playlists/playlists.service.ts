import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Video} from "../videos/schemas/video.schema";
import {Model, Types} from "mongoose";
import {User} from "../users/schemas/user.schema";
import {GitHubUser} from "../users/schemas/gitHubUser.schema";
import {Playlist} from "./schemas/playlist.schema";
import {VideosService} from "../videos/videos.service";

@Injectable()
export class PlaylistsService {
    constructor(
        @InjectModel(Playlist.name) private readonly playlistModel: Model<Playlist>,
        @InjectModel(Video.name) private readonly videoModel: Model<Video>,
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(GitHubUser.name) private readonly gitHubUserModel: Model<GitHubUser>,
        private readonly videoService: VideosService
    ) {}


    async findUserPlaylists(user: any): Promise<Playlist[]> {
        let model;
        let userPlaylists;

        if (user['type'] === undefined) {
            model = this.userModel;

            userPlaylists = await model.findById(user['_id']).select('_id username playlists');
        }
        else {
            model = this.gitHubUserModel;

            userPlaylists = await model.findById(user['_id']).select('_id username playlists');
        }

        for (const playlist of userPlaylists['playlists']) {
            for (const video of playlist['videos']) {
                const playlistVideo = await this.videoService.findVideo(video['_id']);
                video['title'] = playlistVideo[0]['title'];
                video['desc'] = playlistVideo[0]['desc'];
                video['thumb'] = playlistVideo[0]['thumb'];
                video['cover'] = playlistVideo[0]['cover'];
                video['author'] = playlistVideo[0]['author'];
            }
        }

        return userPlaylists
    }


    async findUserPlaylistByName(id: string, name: string): Promise<Playlist> {
        const aggregation = [
            {
                '$match': {
                    '_id': Types.ObjectId(id)
                }
            },
            {
                '$unwind': {
                    'path': '$playlists',
                    'includeArrayIndex': 'id',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$match': {
                    'playlists.name': name
                }
            }, {
                '$project': {
                    '_id': '$playlists._id',
                    'name': '$playlists.name',
                    'isPrivate': '$playlists.isPrivate',
                    'videos': '$playlists.videos',
                    'author': '$username',
                    'authorId': '$_id'
                }
            }
        ];

        const playlist = await this.userModel.aggregate(aggregation);

        if (playlist.length > 0) {
            for (const video of playlist[0]['videos']) {
                const playlistVideo = await this.videoService.findVideo(video['_id']);
                video['title'] = playlistVideo[0]['title'];
                video['author'] = playlistVideo[0]['author'];
                video['desc'] = playlistVideo[0]['desc'];
                video['thumb'] = playlistVideo[0]['thumb'];
                video['cover'] = playlistVideo[0]['cover'];
            }
        }

        return playlist[0];
    }


    async findGutHubUserPlaylistByName(id: string, name: string): Promise<Playlist> {
        const aggregation = [
            {
                '$match': {
                    '_id': Types.ObjectId(id)
                }
            },
            {
                '$unwind': {
                    'path': '$playlists',
                    'includeArrayIndex': 'id',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$match': {
                    'playlists.name': name
                }
            }, {
                '$project': {
                    '_id': '$playlists._id',
                    'name': '$playlists.name',
                    'isPrivate': '$playlists.isPrivate',
                    'videos': '$playlists.videos',
                    'author': '$username',
                    'authorId': '$_id'
                }
            }
        ];

        const playlist = await this.gitHubUserModel.aggregate(aggregation);

        if (playlist.length > 0) {
            for (const video of playlist[0]['videos']) {
                const playlistVideo = await this.videoService.findVideo(video['_id']);
                video['title'] = playlistVideo[0]['title'];
                video['author'] = playlistVideo[0]['author'];
                video['desc'] = playlistVideo[0]['desc'];
                video['thumb'] = playlistVideo[0]['thumb'];
                video['cover'] = playlistVideo[0]['cover'];
            }
        }

        return playlist[0];
    }


    async findPlaylist(id: string): Promise<Playlist> {
        const aggregation = [
            {
                '$unwind': {
                    'path': '$playlists',
                    'includeArrayIndex': 'id',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$match': {
                    'playlists._id': Types.ObjectId(id)
                }
            }, {
                '$project': {
                    '_id': '$playlists._id',
                    'name': '$playlists.name',
                    'isPrivate': '$playlists.isPrivate',
                    'videos': '$playlists.videos',
                    'author': '$username',
                    'authorId': '$_id'
                }
            }
        ];

        const userPlaylist = await this.userModel.aggregate(aggregation);
        const gitHubUserPlaylist = await this.gitHubUserModel.aggregate(aggregation);

        const playlist = userPlaylist.concat(gitHubUserPlaylist);

        if (playlist[0] === null) {
            throw new NotFoundException('Playlist not found!');
        }

        for (const video of playlist[0]['videos']) {
            const playlistVideo = await this.videoService.findVideo(video['_id']);
            video['title'] = playlistVideo[0]['title'];
            video['author'] = playlistVideo[0]['author'];
            video['desc'] = playlistVideo[0]['desc'];
            video['thumb'] = playlistVideo[0]['thumb'];
            video['cover'] = playlistVideo[0]['cover'];
        }

        return playlist[0];
    }


    async createEmptyNamedPlaylist(user: any, name: string, isPrivate: boolean): Promise<any> {
        const playlist = {
            name,
            isPrivate
        };

        const newNamedPlaylist = new this.playlistModel(playlist);
        let model;

        if (user['type'] === undefined) {
            model = this.userModel;

            await model.findByIdAndUpdate(user['_id'], { $push: { playlists: newNamedPlaylist }});
        }
        else {
            model = this.gitHubUserModel;

            await model.findByIdAndUpdate(user['_id'], { $push: { playlists: newNamedPlaylist }});
        }

        return newNamedPlaylist;
    }


    async createAutoPlaylist(user: any, videoId: string): Promise<any> {
        const video = await this.videoService.findVideo(videoId);

        const videos = new Array<any>();
        videos.push({
            _id: video[0]['id'],
            // title: video[0]['title'],
            // author: video[0]['author'],
            // desc: video[0]['desc'],
            // thumb: video[0]['thumb'],
            // cover: video[0]['cover']
        })

        const playlist = {
            name: `playlist-${user['username']}-${Date.now()}`,
            videos
        };

        const newPlaylist = new this.playlistModel(playlist);
        let model;

        if (user['type'] === undefined) {
            model = this.userModel;

            await model.findByIdAndUpdate(user['_id'], { $push: { playlists: newPlaylist }});
        }
        else {
            model = this.gitHubUserModel;

            await model.findByIdAndUpdate(user['_id'], { $push: { playlists: newPlaylist }});
        }

        for (const video of newPlaylist['videos']) {
            const playlistVideo = await this.videoService.findVideo(video['_id']);
            video['title'] = playlistVideo[0]['title'];
            video['author'] = playlistVideo[0]['author'];
            video['desc'] = playlistVideo[0]['desc'];
            video['thumb'] = playlistVideo[0]['thumb'];
            video['cover'] = playlistVideo[0]['cover'];
        }

        return newPlaylist;
    }


    async addVideoToPlaylist(user: any, playlistId: string, videoId: string): Promise<any> {
        const video = await this.videoService.findVideo(videoId);

        const newVideoInPlaylist = {
            _id: video[0]['id'],
            // title: video[0]['title'],
            // author: video[0]['author'],
            // desc: video[0]['desc'],
            // thumb: video[0]['thumb'],
            // cover: video[0]['cover']
        };


        let model;
        if (user['type'] === undefined) {
            model = this.userModel;

            await model.updateOne({"playlists._id": Types.ObjectId(playlistId)}, {"$push": {"playlists.$.videos": newVideoInPlaylist}});
        }
        else {
            model = this.gitHubUserModel;

            await model.updateOne({"playlists._id": Types.ObjectId(playlistId)}, {"$push": {"playlists.$.videos": newVideoInPlaylist}});
        }

        return {
            _id: video[0]['id'],
            title: video[0]['title'],
            author: video[0]['author'],
            desc: video[0]['desc'],
            thumb: video[0]['thumb'],
            cover: video[0]['cover'],
        };
    }


    async deleteVideoFromPlaylist(user: any, playlistId: string, videoId: string): Promise<any> {
        const video = await this.videoService.findVideo(videoId);

        let model;
        if (user['type'] === undefined) {
            model = this.userModel;

            await model.updateOne({"playlists._id": Types.ObjectId(playlistId)}, {"$pull": {"playlists.$.videos": { "_id": Types.ObjectId(video[0]['id']) }}});
        }
        else {
            model = this.gitHubUserModel;

            await model.updateOne({"playlists._id": Types.ObjectId(playlistId)}, {"$pull": {"playlists.$.videos": { "_id": Types.ObjectId(video[0]['id']) }}});
        }
    }


    async deletePlaylist(user: any, playlistId: string): Promise<any> {
        let model;
        if (user['type'] === undefined) {
            model = this.userModel;

            await model.updateOne({"playlists._id": Types.ObjectId(playlistId)}, {"$pull": {"playlists": { "_id": Types.ObjectId(playlistId) }}});
        }
        else {
            model = this.gitHubUserModel;

            await model.updateOne({"playlists._id": Types.ObjectId(playlistId)}, {"$pull": {"playlists": { "_id": Types.ObjectId(playlistId) }}});
        }
    }
}
