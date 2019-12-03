chrome.runtime.onInstalled.addListener(function(){
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function(){
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {hostEquals: 'mangarock.com'},
            })
            ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
        }])
    });
});

chrome.runtime.onMessage.addListener((req, sender, res)=>{
    if(req.type == "download_bg"){
        chrome.downloads.download({
            url: req.url,
            filename: req.filename,
            saveAs: false
        });
    }
});