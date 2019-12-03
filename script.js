var requestCross = (url, cb)=>{
    fetch(url).then(res=>{
        return res.json();
    }).then(jsonfile=>{
        cb(jsonfile);
    });
}

window.addEventListener("message", (e)=>{
    if(e.data.type=="call"){
        requestCross(e.data.url, (json)=>{
            window.postMessage({"type": "data", "data": json, "manga": e.data.manga, "chapter": e.data.chapter});
        });
    }
}, false);