import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideosModule } from "./videos/videos.module";

@Module({
    imports: [
        MongooseModule.forRoot('mongodb://localhost/skyvid', {
            useNewUrlParser: true
        }),
        VideosModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
