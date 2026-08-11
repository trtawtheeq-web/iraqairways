function gotoenglish() {
    var loc = location.href
    var locprotocol = location.protocol
    var baseloc = locprotocol + "//" + location.hostname + ":" + location.port + "/arabic"
    // var baseloc = locprotocol + "//" + location.hostname + "/newsite2/arabic"
    // var baseloc = locprotocol + "//" + location.hostname + "/arabic"
    baselen = baseloc.length
    loclen = loc.length
    pageurl = loc.substr(baselen, loclen - baselen)
    //  englishpageurl = locprotocol + "//" + location.hostname + ":" + location.port + "/newsite2/english" + pageurl
    //englishpageurl = locprotocol + "//" + location.hostname + "/newsite/english" + pageurl
    englishpageurl = locprotocol + "//" + location.hostname + ":" + location.port + "/english/" + pageurl
    self.location = englishpageurl
}
function gotoLocation(pcol, loc) {
    var locprotocol = location.protocol
    var baseURL = pcol + "://" + location.hostname + ":" + location.port + "" + loc
    //alert(baseURL);
    self.location = baseURL
}