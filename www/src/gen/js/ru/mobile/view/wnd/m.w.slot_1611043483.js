wSlot.prototype.afterRefresh = function(wnd, wndActivity, wndIndex, wndPos){
    if( wndActivity )
        wndMgr.setTopWnd(wnd);
};