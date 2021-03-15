(function(){
	var root = '/gen/js/ru/mobile/',
		opt = {
			async: false,
			callback: function(){
				appl.onDependenciesLoaded();
			}
		};
	
	loadScripts([
		'lib/m.scrollbar_1608515007.js',
		
		'app/m.util_1593485096.js',
        
        'app/m.applreport_1603235215.js',
        
        'app/m.snipet_1611700019.js',
		'app/m.tmpl_1614224088.js',
		'app/m.wndMgr_1611233901.js',
		'app/m.tooltipMgr_1608532543.js',
		'app/m.contentLoader_1608532539.js',
		'app/m.ls_1598332979.js',
		
		'view/comp/m.wnd_1611038878.js',
		
        'view/wnd/m.w.countryInfo_1587467353.js',
        'view/wnd/m.w.report_1587467372.js',
		'view/wnd/m.w.reports_1611622936.js',
	]);
    
    function loadScripts(scripts){
        for(var script in scripts)
            loadScript(scripts[script]);
    };
    
    function loadScript(url){
        appl.dependencies++;
        
        utils.loadScript(root + url, opt);
    };
})();