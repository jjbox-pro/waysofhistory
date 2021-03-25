utils.overrideFunc(window, 'overridePlatform', function __func__(){
    __func__.origin.call(this);
    
    appl.auth.prepareSassoionResp = function(resp, session, gid, accId){
        if( wofh.form.world == 't0.waysofhistory.com' )
            return '?id=' + (accId||2403) + '&ses=' + session + '&gid=' + gid;
        
        return resp;
    };
});