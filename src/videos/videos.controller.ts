import {Controller, Get, Param, Query, Res} from '@nestjs/common';
import {VideosService} from "./videos.service";
import paginate from "jw-paginate";
import {Video} from "./schemas/video.schema";

@Controller('videos')
export class VideosController {

    constructor(private readonly videosService: VideosService) {}

    @Get()
    async getAllVideos(@Res() res, @Query('page') pageParam): Promise<JSON> {
        try {
            const videos = await this.videosService.findAll();

            const page = parseInt(pageParam) || 1;

            const pageSize = 12;
            const pages = paginate(videos.length, page, pageSize);

            const videosOnPage = videos.slice(pages.startIndex, pages.endIndex + 1);

            return res.json({ pages, videosOnPage });
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Get('/search')
    async searchVideos(@Res() res, @Query('query') query, @Query('page') pageParam): Promise<JSON> {
        try {
            const videos = await this.videosService.searchVideosByQuery(query);

            const page = parseInt(pageParam) || 1;

            const pageSize = 12;
            const pages = paginate(videos.length, page, pageSize);

            const videosOnPage = videos.slice(pages.startIndex, pages.endIndex + 1);

            return res.json({
                pages,
                videosOnPage,
                message: 'Found ' + videos.length + ' videos'
            });
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Get(':id')
    async getVideo(@Res() res, @Param('id') id): Promise<JSON> {
        try {
            const video = await this.videosService.findVideo(id);
            return res.json(video);
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }

}
