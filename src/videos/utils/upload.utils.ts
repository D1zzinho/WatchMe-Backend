import { extname } from 'path';
import ffmpeg from "fluent-ffmpeg";
import {path as ffmpegPath} from "@ffmpeg-installer/ffmpeg";
import {path as ffprobeInstaller} from "@ffprobe-installer/ffprobe";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobeInstaller);

export const videoFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(mp4)$/)) {
        return callback(new Error('Only mp4 files are allowed!'), false);
    }

    callback(null, true);
};

export const editFileName = (req, file, callback) => {
    let id;
    const user = req.user;
    if (user['type']) {
       id = `${user['type']}_${user['username']}`;
    }
    else {
        id = req.user._id;
    }

    const name = file.originalname.slice(0, -4);
    const fileExtName = extname(file.originalname);

    callback(null, `${id}_${Date.now()}_${name}${fileExtName}`);
};

export const generateThumbAndPreview = (file) => {
    let response = null;

    ffmpeg.ffprobe(`./public/uploads/${file}`, function(err, metadata) {
        let proc;
        //console.dir(metadata); // all metadata
        if (Math.floor(metadata.format.duration) >= 900) {
            proc = ffmpeg(`./public/uploads/${file}`)
                .takeScreenshots({
                    count: 1,
                    filename: file.slice(0,-4) + '.png',
                    timemarks: [ '720' ] // number of seconds
                }, `./public/uploads`, function(err) {
                    console.log(err)
                });
        }
        else if (Math.floor(metadata.format.duration) > 50 && Math.floor(metadata.format.duration) < 900) {
            proc = ffmpeg(`./public/uploads/${file}`)
                .takeScreenshots({
                    count: 1,
                    filename: file.slice(0,-4) + '.png',
                    timemarks: [ '240' ] // number of seconds
                }, `./public/uploads`, function(err) {
                    console.log(err)
                });
        }
        else {
            proc = ffmpeg(`./public/uploads/${file}`)
                .takeScreenshots({
                    count: 1,
                    filename: file.slice(0,-4) + '.png',
                    timemarks: [ '5' ] // number of seconds
                }, `./public/uploads`, function(err) {
                    console.log(err)
                });
        }



        if (proc) {

            ffmpeg.ffprobe(`./public/uploads/${file}`, function(err, metadata) {
                let videoPreview;
                //console.dir(metadata); // all metadata
                if (Math.floor(metadata.format.duration) > 900) {

                    videoPreview = ffmpeg(`./public/uploads/${file}`)
                        .outputOptions(["-vf select='lt(mod(t\,150)\,0.8)',setpts=N/FRAME_RATE/TB", "-af aselect='lt(mod(t\,150)\,0.8)',asetpts=N/SR/TB"])
                        .saveToFile('./public/uploads/' + file.slice(0,-4) + '_preview.webm')

                }
                else {
                    videoPreview = ffmpeg(`./public/uploads/${file}`)
                        .outputOptions(["-vf select='lt(mod(t\,45)\,0.8)',setpts=N/FRAME_RATE/TB", "-af aselect='lt(mod(t\,45)\,0.8)',asetpts=N/SR/TB"])
                        .saveToFile('./public/uploads/' + file.slice(0,-4) + '_preview.webm')
                }


                videoPreview
                    .on('end', (stdout, stderr) => {
                        response = {
                            message: 'Conversion successfully ended!',
                            converted: true
                        }
                    })
                    .on('error', function(err, stdout, stderr) {
                    response = {
                        message: err.message,
                        converted: false
                    }
                });



            })
        }

    })

    return response;
}
