utils.overrideFunc(appl, 'initDevice', function __func__(){
    __func__.origin.call(this);
	
	$('html').addClass('-if-mobApp');
});

utils.overrideFunc(appl, 'initPlatformTmpl', function __func__(allowLoad){
	if( allowLoad )
		__func__.origin.call(this);
});

utils.reOverrideFunc(appl, 'initTmpl', function __func__(){
    __func__.origin.call(this);
    
    appl.initMobileTmpl();
	
	appl.initPlatformTmpl(true);
});