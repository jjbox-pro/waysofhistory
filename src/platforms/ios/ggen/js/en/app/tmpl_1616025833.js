TmplMgr = function(){};


TmplMgr.templatesVersions = {
    main: '1616025833'
};


TmplMgr.prototype.loadTemplates = function(opt){
	opt = opt||{};
	
	var self = this,
        templatesFileName = this.getTemplatesFileName() + this.getTemplatesFileNamePostfix(),
        templatesFileVersion = this.getTemplatesFileVersion(templatesFileName);
    
	$.get(utils.prepareUrl('/gen/html/en/' + templatesFileName + '_' + templatesFileVersion + '.html'), function(resp){
		self.onTemplatesLoaded(resp, opt);
	});
	
	return this;
};

    TmplMgr.prototype.getTemplatesFileName = function(){
        return 'main';
    };
    
    TmplMgr.prototype.getTemplatesFileNamePostfix = function(){
        return '';
    };
    
    TmplMgr.prototype.getTemplatesFileVersion = function(templatesFileName){
        return TmplMgr.templatesVersions[templatesFileName];
    };

TmplMgr.prototype.onTemplatesLoaded = function(templates, opt){
	this.parseTemplates($(snip.wrp('', templates)), true);
	
	this.parsePlatformTemplates();
	
	if( opt.callback ) 
		opt.callback();
};

TmplMgr.prototype.parseTemplates = function($wrp, removeWrp){
	if( !$wrp )
		return;
	
	var self = this, root;
	
	$wrp.find('script[type="text/plain"]').each(function(){
		var pathArr = $(this).attr('id').split('.');
		
		root = self;
			
		for (var i = 0; i < pathArr.length; i++){
			var item = pathArr[i];
			
			if( i == pathArr.length - 1 ) 
				break;
			
			if( !root[item] ) 
				root[item] = {};
			
			root = root[item]; // Переназначаем корень
		}
		
		root[item] = $.extend(doT.template(this.innerHTML), root[item]);
	});
	
	if( removeWrp )
		$wrp.remove();
};

TmplMgr.prototype.parsePlatformTemplates = function(){
	// Дополняем/переопределяем основные шаблоны, платфоременными шаблонами
	this.parseTemplates($('#platform-templates'), true);
};


tmplMgr = new TmplMgr();