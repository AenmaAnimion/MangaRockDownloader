function injectScript(file_path, tag) {
    var node = document.getElementsByTagName(tag)[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.appendChild(script);
}

injectScript(chrome.extension.getURL('script.js'), 'body');

let quality = [1, 0.75, 0.5, 0.3];

function sendAllChapter(){
    let chapter = document.getElementsByClassName("_1A2Dc rZ05K");
    let index = chapter.length - 1;
    let chp_len = chapter.length;
    let is_message_done = true;
    let message;

    let chapter_sending = setInterval(()=>{
        if(index < 0){
            clearInterval(chapter_sending);
            return;
        }
        if(is_message_done){
            is_message_done = false;
            if(chapter[index] == undefined){
                return;
            }
            let chapter_name = chapter[index].innerText;
            let chapter_path = chapter[index].pathname.split("/");
            let chapter_code = chapter_path[chapter_path.length-1];
            message = {type: "list_chapter", queue: index, max: chp_len, name: chapter_name, code: chapter_code, manga: document.title};
            chrome.runtime.sendMessage(message, (res)=>{
                if(res.done){
                    is_message_done = true;
                }
            });
            index--;
        }
    }, 100);
}

function request(url, cb){
    requestCross(url, cb);
}

function reconstructHeader(bytes) {
    if (bytes[0] == 69) {
        var buffer = new Uint8Array(bytes.length + 15);
        var size = bytes.length + 7;
        buffer[0] = 82;
        buffer[1] = 73;
        buffer[2] = 70;
        buffer[3] = 70;
        buffer[4] = 255 & size;
        buffer[5] = size >> 8 & 255;
        buffer[6] = size >> 16 & 255;
        buffer[7] = size >> 24 & 255;
        buffer[8] = 87;
        buffer[9] = 69;
        buffer[10] = 66;
        buffer[11] = 80;
        buffer[12] = 86;
        buffer[13] = 80;
        buffer[14] = 56;
        for (var r = 0; r < bytes.length; r++) {
            buffer[r + 15] = 101 ^ bytes[r];
        }
        bytes = buffer
    }
    return bytes;
}

const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
      
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

function encode(bytes) {
    var encoded = [];
    for (var n = 0; n < bytes.length; n += 32768) {
      	encoded.push(String.fromCharCode.apply(null, bytes.subarray(n, n + 32768)));
    }
  	return btoa(encoded.join(""))
}

let imageType = ['jpg', 'png', 'webp'];

window.addEventListener("message", (e)=>{
    if(e.data.type == "data"){
        let data = e.data.data.data;
        data.forEach((list, index)=>{
            fetch(list.url).then(res=>{
                return res.arrayBuffer();
            }).then(buffer=>{
                let canvas = document.createElement("canvas");
                let ctx = canvas.getContext("2d");
                let image = document.createElement("img");
                let blob = "data:image/webp;base64," + encode(reconstructHeader(new Uint8Array(buffer)));
                image.onload = function(){
                    chrome.storage.sync.get(["quality","scale","type","indexType"], (res)=>{
                        console.log(res.scale, res.quality, res.type);
                        ctx.canvas.width = image.width * res.scale;
                        ctx.canvas.height = image.height * res.scale;
                        ctx.drawImage(image, 0, 0, image.width * res.scale, image.height * res.scale);
                        ctx.canvas.toBlob((blob)=>{
                            let url = URL.createObjectURL(blob);
                            let filename = `manga/${e.data.manga}/${e.data.chapter}/page${index}.${imageType[res.indexType]}`;
                            chrome.runtime.sendMessage({type: "download_bg", url: url, filename: filename});
                        }, res.type, res.quality);
                    });
                }
                image.src = blob;
            });
        });
    }
}, false);

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
    if(req.message === "start"){
        sendAllChapter();
    }
    if(req.type === "download"){
        let manga_name = req.name.replace(/[|"*?:<>.,~\s]/g, "_");
        let chapter = req.chapter.replace(/[|"*?:<>.,~\s]/g, "_");
        manga_name = manga_name.replace(/`/g, "'");
        chapter = chapter.replace(/`/g, "'");
        window.postMessage({"type":"call", "url": `https://api.mangarockhd.com/query/web401/pagesv2?oid=${req.code}&country=Indonesia`, "manga": manga_name,"chapter":chapter});
    }
});