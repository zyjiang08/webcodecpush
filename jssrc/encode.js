class Encoder {
    constructor() {
        this.videoElement_ = null;
        this.vencoder_ = null;
        this.aencoder_ = null;
        this.sendFrames_ = 0;
        this.videoGop_ = 30;
    }

    async init(videoElement) {
        const constraints = {
            video: { width: { exact: 640 }, height: { exact: 480 } },
            audio: {
                channelCount:2,
                sampleRate:48000,
            }
        }

        //video encode init
        this.vencoder_ = new VideoEncoder({
            output: this.handleVideoEncoded.bind(this),
            error: (error) => {
                console.error("video encoder error:" + error)
            }
        })
        await this.vencoder_.configure({
            codec: 'avc1.42e01f',
            width: 640,
            height: 480
        })

        //audio encode init
        this.aencoder_ = new AudioEncoder({
            output: this.handleAudioEncoded.bind(this),
            error: (error) => {
                console.error("audio encoder error:" + error);
            }
        });
        await this.aencoder_.configure({ codec: 'opus', numberOfChannels: 1, sampleRate: 48000 });

        //open device
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        //open video device
        let vprocessor = new MediaStreamTrackProcessor(stream.getVideoTracks()[0]);
        let vgenerator = new MediaStreamTrackGenerator('video');
        const vsource = vprocessor.readable;
        const vsink = vgenerator.writable;
        let vtransformer = new TransformStream({ transform: this.videoTransform() });
        vsource.pipeThrough(vtransformer).pipeTo(vsink);

        //open audio device
        let aprocessor = new MediaStreamTrackProcessor(stream.getAudioTracks()[0]);
        let agenerator = new MediaStreamTrackGenerator('audio');
        const asource = aprocessor.readable;
        const asink = agenerator.writable;
        let atransformer = new TransformStream({ transform: this.audioTransform() });
        asource.pipeThrough(atransformer).pipeTo(asink);

        let processedStream = new MediaStream();
        processedStream.addTrack(vgenerator);
        processedStream.addTrack(agenerator);
        videoElement.srcObject = processedStream;
        await videoElement.play();
    }

    videoTransform(frame, controller) {
        return (frame, controller) => {
            const insert_keyframe = (this.sendFrames_ % 30) == 0;
            this.sendFrames_++;
            if (insert_keyframe) {
                console.log('insert keyframe');
                //console.log(frame);
            }
            this.vencoder_.encode(frame, { keyFrame: insert_keyframe });
            controller.enqueue(frame);
        }

    }

    audioTransform(frame, controller) {
        return (frame, controller) => {
            //console.info(frame)
            this.aencoder_.encode(frame);
            controller.enqueue(frame);
        }
 
    }

    async handleVideoEncoded(chunk) {
        const { type, timestamp, data } = chunk
        //console.info("video type:" + type + ", timestmap:" + timestamp )
    }

    async handleAudioEncoded(chunk) {
        const { type, timestamp, data, byteLength } = chunk;
        console.info("audio type:" + type + ", timestmap:" + timestamp + ", byteLength:" + byteLength)
    }
}