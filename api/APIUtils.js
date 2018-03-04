'use strict';

const APIUtils = {

    sendJSONResponse: function (res, response) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(response));
    },
    
    sendTextResponse: function (res, response) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(response);
    },
    
    sendHtmlResponse: function (res, response) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(response);
    },
    
    getHtmlPage: function(title, body){
        return '<!doctype HTML><html><head><title>'+title+'</title></head><body>'+body+'</body></html>';
    },
      
    
    /**
     * Génére un hashcode
     * @param {string} str
     * @returns {Number}
     */
    getHashCode: function (str) {
        //console.info('APIUtils: getHashCode :', str);
        var hash = 0, i, chr;
        if (str.length === 0)
            return hash;
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    //return this;
};

module.exports = APIUtils;