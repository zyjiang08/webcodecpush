
class WsWriter {
    constructor() {
        this.connectFlag = false;
        this.ws = null;
        this.encoder = null;
        this.mux = null;
        this.videoElement = null;
    }

    async SetVideoElement(ve) {
        this.videoElement = ve;
    }

    async Init(url) {
        console.log("try to open:", url);

        this.ws = new WebSocket(url);
        this.ws.onopen = () =>
        {
            console.log("ws client is opened....");
            this.connectFlag = true;
            this.mux = new FlvMux();
            this.mux.SetWriter(this);
            this.mux.Init(true, true);

            this.encoder = new Encoder();
            this.encoder.SetMux(this.mux);
            this.encoder.Init(this.videoElement);
        };
        this.ws.onmessage = function (evt) 
        {
            console.log("ws client received message");
        };
         
        this.ws.onclose = function()
        {
            this.connectFlag = false;
            console.log("ws client closed...");
        };
    }

    async Send(data) {
        //console.log("ws write in:", this.connectFlag);
        if (!this.connectFlag) {
            return;
        }
        //console.log("send data to ws:", data.byteLength, "data:", data);
        this.ws.send(data)
        return;
    }

    async close() {
        
    }


}