import {Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards} from '@nestjs/common';
import {PlaylistsService} from "./playlists.service";
import {Request, Response} from "express";
import {Playlist} from "./schemas/playlist.schema";
import {AuthGuard} from "@nestjs/passport";
import {ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiOkResponse, ApiUnauthorizedResponse} from "@nestjs/swagger";
import {Comment} from "../comments/schemas/comment.schema";

@Controller('playlist')
export class PlaylistsController {

    constructor(private readonly playlistService: PlaylistsService) {
    }


    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: [Playlist] })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async getAll(@Res() res: Response): Promise<Response<Array<Playlist>>> {
        return null;
    }


    @Get('user')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: [Playlist], description: 'All user playlists' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async getUserPlaylists(@Req() req: Request, @Res() res: Response): Promise<Response<Array<any>>> {
        try {
            const user = req.user;

            const userPlaylists = await this.playlistService.findUserPlaylists(user);

            return res.json({
                userPlaylists
            });
        }
        catch (err) {
            return res.json({
                error: true,
                message: err.message
            });
        }
    }


    @Get(':playlistId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: Playlist })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async getPlaylist(@Req() req: Request, @Res() res: Response, @Param('playlistId') playlistId: string): Promise<Response<Playlist>> {
        try {
            const user = req.user;
            const foundPlaylist = await this.playlistService.findPlaylist(playlistId);

            if (String(foundPlaylist['authorId']) === String(user['_id'])) {
                return res.json({
                    playlist: foundPlaylist
                });
            }
            else {
                if (foundPlaylist['isPrivate']) {
                    return res.json({
                        playlist: null,
                        error: `This playlist is private!`
                    });
                }
                else {
                    return res.json({
                        playlist: foundPlaylist
                    });
                }
            }
        }
        catch (err) {
            return res.json({
                playlist: null,
                error: err.message
            });
        }
    }


    @Post()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({
            schema:
                {
                    type: 'object',
                    properties: {
                        created: {type: 'boolean'},
                        message: {type: 'string'},
                        playlist: {type: 'object'}
                    },
                    description: 'New empty playlist with name'
                }
            })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBody({ schema: { type: 'object', properties: { name: { type: 'string' }, isPrivate: { type: 'boolean' }}}})
    async createEmptyPlaylist(
        @Req() req: Request,
        @Res() res: Response,
        @Body('name') name: string,
        @Body('isPrivate') isPrivate: boolean
    ): Promise<Response<any>> {
        const user = req.user;

        try {
            const playlist = await this.playlistService.createEmptyNamedPlaylist(user, name, isPrivate);

            return res.json({
                created: true,
                message: `Playlist ${playlist.name} created successfully!`,
                playlist: playlist
            });
        }
        catch (err) {
            return res.json({
                created: false,
                message: `There was an error: ${err.message}`,
                playlist: null
            })
        }
    }


    @Post('auto')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({
        schema:
            {
                type: 'object',
                properties: {
                    created: {type: 'boolean'},
                    message: {type: 'string'},
                    playlist: {type: 'object'}
                },
                description: 'New empty playlist with name'
            }
    })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBody({ schema: { type: 'object', properties: { video: { type: 'string' }}}})
    async createPlaylistWithFirstVideo(@Req() req: Request, @Res() res: Response, @Body('video') videoId: string): Promise<Response<any>> {
        const user = req.user;

        try {
            const playlist = await this.playlistService.createAutoPlaylist(user, videoId);

            return res.json({
                created: true,
                message: `Playlist ${playlist.name} created successfully!`,
                playlist: playlist
            });
        }
        catch (err) {
            return res.json({
                created: false,
                message: `There was an error: ${err.message}`,
                playlist: null
            })
        }
    }


    @Patch(':playlistId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async addVideoToPlaylist(
        @Req() req: Request,
        @Res() res: Response,
        @Param('playlistId') playlistId: string,
        @Body('videoId') videoId: string
    ): Promise<Response<any>> {
        try {
            const user = req.user;
            const foundPlaylist = await this.playlistService.findPlaylist(playlistId);

            if (String(foundPlaylist['authorId']) === String(user['_id'])) {
                const index = foundPlaylist.videos.find(video => {
                    return video._id == videoId
                });

                if (index === undefined) {
                    const newVideoInPlaylist = await this.playlistService.addVideoToPlaylist(user, playlistId, videoId);

                    return res.json({
                        added: true,
                        addedVideo: newVideoInPlaylist,
                        message: `Video ${newVideoInPlaylist.title} successfully added to playlist ${foundPlaylist.name}!`
                    });
                }
                else {
                    return res.json({
                        added: false,
                        addedVideo: null,
                        message: `This video already exists in playlist ${foundPlaylist.name}!`
                    });
                }
            }
            else {
                return res.json({
                    added: false,
                    addedVideo: null,
                    message: `This playlist is private!`
                });
            }
        }
        catch (err) {
            return res.json({
                added: false,
                addedVideo: null,
                message: err.message
            });
        }
    }


    @Patch('deleteFrom/:playlistId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async deleteVideoFromPlaylist(
        @Req() req: Request,
        @Res() res: Response,
        @Param('playlistId') playlistId: string,
        @Body('videoId') videoId: string
    ): Promise<Response<any>> {
        try {
            const user = req.user;
            const foundPlaylist = await this.playlistService.findPlaylist(playlistId);

            if (String(foundPlaylist['authorId']) === String(user['_id'])) {
                const index = foundPlaylist.videos.find(video => {
                    return video._id == videoId
                });

                if (index !== undefined) {
                    await this.playlistService.deleteVideoFromPlaylist(user, playlistId, videoId);

                    return res.json({
                        deleted: true,
                        deletedVideo: videoId,
                        message: `Current video successfully deleted from playlist ${foundPlaylist.name}!`
                    });
                }
                else {
                    return res.json({
                        deleted: false,
                        deletedVideo: null,
                        message: `This video doesn't exist in playlist ${foundPlaylist.name}!`
                    });
                }
            }
            else {
                return res.json({
                    deleted: false,
                    deletedVideo: null,
                    message: `This playlist is private!`
                });
            }
        }
        catch (err) {
            return res.json({
                deleted: false,
                deletedVideo: null,
                message: err.message
            });
        }
    }
}
