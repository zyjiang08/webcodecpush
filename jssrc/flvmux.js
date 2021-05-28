class FlvMux {
    constructor() {
        this.Init = false;
    }

    async doMux(packet) {
        let {media, type, timestamp, data} = packet;

        if ((media == nil) || (media != "video" && media != "audio")) {
            return
        }

        if (!this.Init) {
            /*|'F'(8)|'L'(8)|'V'(8)|version(8)|TypeFlagsReserved(5)|TypeFlagsAudio(1)|TypeFlagsReserved(1)|TypeFlagsVideo(1)|DataOffset(32)|PreviousTagSize(32)|*/
            let flvHeader = new Uint8Array(0x46, 0x4c, 0x56, 0x01, 0x01, 0x00, 0x00, 0x00, 0x09, 0x00);
            this.output(flvHeader);
            this.Init = true;
        }

        /*|Tagtype(8)|DataSize(24)|Timestamp(24)|TimestampExtended(8)|StreamID(24)|Data(...)|PreviousTagSize(32)|*/
        let dataSize = data.prototype.length;
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

        //Set StreamID(24) as 0
        tagData[8] = 0;
        tagData[9] = 0;
        tagData[10] = 0;

        
    }

    async output(data) {

    }
}