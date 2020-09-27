import { extname } from 'path';
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobeInstaller = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobeInstaller);

export const videoFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(mp4)$/)) {
        return callback(new Error('Only mp4 files are allowed!'), false);
    }

    callback(null, true);
};

export const editFileName = (req, file, callback) => {
    const name = file.originalname.slice(0, -4);
    const fileExtName = extname(file.originalname);

    callback(null, `${name}${fileExtName}`);
};

export const generateThumbAndPreview = (file) => {
    console.log(file)
    ffmpeg.ffprobe(`./public/uploads/${file}`, function(err, metadata) {
        //console.dir(metadata); // all metadata
        if (Math.floor(metadata.format.duration) > 900) {
            var proc = new ffmpeg(`./public/uploads/${file}`)
                .takeScreenshots({
                    count: 1,
                    filename: file.slice(0,-4) + '.png',
                    timemarks: [ '720' ] // number of seconds
                }, `./public/uploads`, function(err) {
                    console.log('screenshots were saved')
                });
        }
        else {
            var proc = new ffmpeg(`./public/uploads/${file}`)
                .takeScreenshots({
                    count: 1,
                    filename: file.slice(0,-4) + '.png',
                    timemarks: [ '240' ] // number of seconds
                }, `./public/uploads`, function(err) {
                    console.log('screenshots were saved')
                });
        }

        if (proc) {
            console.log('created thumbnail of ' + file)

            ffmpeg.ffprobe(`./public/uploads/${file}`, function(err, metadata) {
                //console.dir(metadata); // all metadata
                if (Math.floor(metadata.format.duration) > 900) {

                    var videoPreview = new ffmpeg(`./public/uploads/${file}`)
                        .outputOptions(["-vf select='lt(mod(t\,150)\,0.8)',setpts=N/FRAME_RATE/TB", "-af aselect='lt(mod(t\,150)\,0.8)',asetpts=N/SR/TB"])
                        .saveToFile('./public/uploads/' + file.slice(0,-4) + '_preview.webm')

                }
                else {
                    var videoPreview = new ffmpeg(`./public/uploads/${file}`)
                        .outputOptions(["-vf select='lt(mod(t\,45)\,0.8)',setpts=N/FRAME_RATE/TB", "-af aselect='lt(mod(t\,45)\,0.8)',asetpts=N/SR/TB"])
                        .saveToFile('./public/uploads/' + file.slice(0,-4) + '_preview.webm')
                }

                if (videoPreview) {
                    console.log('preview video of ' + file + ' created successfully')



                    //return res.redirect("http://192.168.100.2:8080/upload")



                }

            })
        }

    })
}
