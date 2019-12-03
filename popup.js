'use strict'
let images = [];
let loadimage = document.getElementById("loadimage");
let imageboard = document.getElementById("imageboard");
let blackpop = document.getElementById("blackpop");
let qualityRange = document.getElementById("rangeQuality");
let qualityOut = document.getElementById("valueQuality");
let scaleRange = document.getElementById("rangeScale");
let scaleOut = document.getElementById("valueScale");
let imageType = document.getElementById("imageType");

chrome.storage.sync.get(["indexType"], (res)=>{
    imageType.selectedIndex = res.indexType || 0;
});

imageType.onchange = function(e){
    chrome.storage.sync.set({"type": this.options[this.options.selectedIndex].label, "indexType":this.options.selectedIndex});
}

chrome.storage.sync.get(["quality","scale"], (res)=>{
    let qualityVal = res.quality * 100;
    let scaleVal = res.scale * 100;
    qualityRange.value = qualityVal;
    scaleRange.value = scaleVal;
    scaleOut.innerText = scaleVal;
    qualityOut.innerText = qualityVal;
});

qualityRange.oninput = function(e){
    qualityOut.innerText = this.value;
    chrome.storage.sync.set({"quality": this.value/100});
}

scaleRange.oninput = function(e){
    scaleOut.innerText = this.value;
    chrome.storage.sync.set({"scale": this.value/100});
}



loadimage.onclick = function(elem){
    imageboard.innerHTML = '';
    loadimage.disabled = true;
    loadimage.textContent = 'loading images ...'
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": "start"});
    });
}

function downloadChapter(code, manga_name, chapter){
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {type: "download", code: code, name: manga_name, chapter: chapter});
    });
    // chrome.runtime.sendMessage({type: "download", code: code, name: manga_name, chapter: chapter});
}

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
    if(req.type == "file"){
        let img;
        let url = req.dataurl;
        let name = req.imagename;
        let queue = req.queue;
        let max = req.max;
        img = document.createElement("img");
        img.onload = function(){
            if((queue/max) == 1){
                loadimage.textContent = 'load again';
                loadimage.disabled = false;
            }
        }
        img.src = url;
        
        imageboard.appendChild(img);
        let a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.textContent = name;
        imageboard.appendChild(a);
        sendResponse({done: true});
    }else if(req.type == "list_chapter"){
        let name = req.name;
        let code = req.code;
        let queue = req.queue;
        let max = req.max;
        let manganame = req.manga;
        let content = document.createElement("span");
        content.textContent = name;
        imageboard.appendChild(content);
        let button = document.createElement("button");
        button.textContent = "Download "+name;
        button.setAttribute("chapter_code", code);
        button.onclick = function(){
            this.disabled = true;
            downloadChapter(code, manganame, name);
        }
        imageboard.appendChild(button);
        sendResponse({done: true});
        if((queue/max) == 1){
            loadimage.textContent = 'load again';
            loadimage.disabled = false
        }
    }
});