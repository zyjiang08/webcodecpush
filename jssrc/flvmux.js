class FlvMux {
    constructor() {
        this.initFlag = false;
        this.Writer = null;
    }

    async SetWriter(w) {
        this.Writer = w;
    }

    async Init(isVideo, isAudio) {
        if (this.initFlag) {
            return;
        }

        if (!this.initFlag) {
            /*|'F'(8)|'L'(8)|'V'(8)|version(8)|TypeFlagsReserved(5)|TypeFlagsAudio(1)|TypeFlagsReserved(1)|TypeFlagsVideo(1)|DataOffset(32)|PreviousTagSize(32)|*/
            let flag = 0;

            if (isVideo) {
                flag |= 0x01;
            }
            if (isAudio) {
                flag |= 0x04;
            }
            let flvHeader = new Uint8Array([0x46, 0x4c, 0x56, 0x01, flag, 0x00, 0x00, 0x00, 0x09]);
            await this.output(flvHeader);
            let preSize0 = new Uint8Array([0, 0, 0, 0]);
            await this.output(preSize0);
            this.initFlag = true;
        }

    }
    async DoMux(packet) {
        let {media, timestamp, data} = packet;

        //console.log("domux media:", media, "timestamp:", timestamp, "data:", data);
        if ((media == null) || (media != "video" && media != "audio")) {
            return
        }

        /*|Tagtype(8)|DataSize(24)|Timestamp(24)|TimestampExtended(8)|StreamID(24)|Data(...)|PreviousTagSize(32)|*/
        let dataSize = data.byteLength;
        let total = 11 + dataSize + 4
        let tagData = new Uint8Array(total)
        
        if (media == "video") {
            tagData[0] = 9;
        } else {
            tagData[0] = 8;
        }

        //Set DataSize(24)
        tagData[1] = (dataSize >> 16) & 0xff;
        tagData[2] = (dataSize >> 8) & 0xff;
        tagData[3] = dataSize & 0xff;

        //Set Timestamp(24)|TimestampExtended(8)
        let timestampBase = timestamp & 0xffffff;
        let timestampExt = (timestamp >> 24) & 0xff
        tagData[4] = (timestampBase >> 16) & 0xff;
        tagData[5] = (timestampBase >> 8) & 0xff;
        tagData[6] = timestampBase & 0xff;
        tagData[7] = timestampExt & 0xff;

        //Set StreamID(24) as 1
        tagData[8] = 0;
        tagData[9] = 0;
        tagData[10] = 1;

        let start = 11;
        var inputData = new Uint8Array(data);
        for (var i = 0; i < dataSize; i++) {
            tagData[start + i] = inputData[i];
        }

        let preSize = 11+data.byteLength;
        start = 11 + dataSize;

        tagData[start + 0] = (preSize >> 24) & 0xff;
        tagData[start + 1] = (preSize >> 16) & 0xff;
        tagData[start + 2] = (preSize >> 8) & 0xff;
        tagData[start + 3] = preSize & 0xff;

        //console.log("media data:", data);
        //console.log("mux dataSize:", dataSize, "tagdata:", tagData);
        await this.output(tagData);
    }

    async output(data) {
        await this.Writer.Send(data)
    }
}