const faceUtile = {
    width: 500, //图片宽度
    height: 500, //图片高度
    isOpen: false, //是否开启摄像头
    promise: null,
    openVideo: function (id) { //打开摄像头
        var mythis = this;
        const container = document.getElementById(id);
        // 清空容器
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        // 创建视频和画布元素
        const videoElement = document.createElement('video');
        videoElement.id = 'myVideo';
        videoElement.width = this.width;
        videoElement.height = this.height;
        videoElement.autoplay = true;
        videoElement.style.marginTop = '0px';
        
        const canvasElement = document.createElement('canvas');
        canvasElement.id = 'myCavans';
        canvasElement.width = this.width;
        canvasElement.height = this.height;
        canvasElement.style.display = 'none';
        
        // 添加元素到容器
        container.appendChild(videoElement);
        container.appendChild(canvasElement);
        
        let constraints = {
            video: {width: mythis.width, height: mythis.height},
            audio: true
        };
        //获得video摄像头区域
        let video = document.getElementById("myVideo");

        this.promise = navigator.mediaDevices.getUserMedia(constraints);
        this.promise.then(function (MediaStream) {
            video.srcObject = MediaStream;
            video.play();
        });
        this.isOpen = true;
    },

    getDecode: function () { //获取图片decode吗
        // 保持原有代码不变
        if(this.isOpen){
            let myVideo = document.getElementById("myVideo");
            let myCavans = document.getElementById("myCavans");
            let ctx = myCavans.getContext('2d');
            ctx.drawImage(myVideo, 0, 0, this.width, this.height);
            var decode = myCavans.toDataURL();
            return decode;
        }else{
            alert("没有开启摄像头");
        }
    }
}

export default faceUtile;