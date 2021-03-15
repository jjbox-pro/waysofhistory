function Appl(){}


Appl.mouseButton = {left: 1, middle: 2, right: 3};

Appl.interface = {standart: 0, mobile: 1, simplified: 2};

Appl.C_EPSILON = 1.192092896e-7; // Math.pow(2, -23) float
Appl.C_EPSILON1000 = Appl.C_EPSILON * 1000;


Appl.prototype.init = function(){
	overridePlatform(); // Переопределяем необходимые методы в зависимости от платформы
    
	if( !this.initEnvironment() )
		return;
    
    reqMgr.init();
	
    contentLoader.init();
    
    this.сomponents = 1;
    
	this.initComponents();
    
    this.onComponentsInited();
};

    Appl.prototype.initEnvironment = function(){
        wndMgr.initEnvironment();
        
        return true;
    };
    
    Appl.prototype.initComponents = function(){};

Appl.prototype.onComponentsInited = function(){
	if( --this.сomponents ) 
		return;
    else
        delete this.сomponents;
	
	this.dependencies = 1;
	
    this.loadDependencies();
	
	this.onDependenciesLoaded();
};

    Appl.prototype.loadDependencies = function(){
        this.loadMobileDependencies();
    };
        
        Appl.prototype.loadMobileDependencies = function(){};
    
Appl.prototype.onDependenciesLoaded = function(){
	if( --this.dependencies ) 
		return;
    else
        delete this.dependencies;
	
	overridePlatformDependencies();
	
    this.prepare();
    
	this.waiting = 1;
	
    this.loadData();
	
	this.onDataLoaded();
};

    Appl.prototype.prepare = function(){
        wndMgr.prepareInit();
        
        this.initDevice();
        
        this.initClasses();
    };
        
        Appl.prototype.initDevice = function(){};
        
        Appl.prototype.initClasses = function(){
            Deposit.init();
            Science.init();
            Resource.init();
            Town.init();
        };
    
    Appl.prototype.loadData = function(){
        this.loadTemplates();
    };
        
        Appl.prototype.loadTemplates = function(){
            this.waiting++;
            
            tmplMgr.loadTemplates({
                callback: function(){appl.onDataLoaded();}
            });
        };
    
Appl.prototype.onDataLoaded = function(){
	if( --this.waiting ) 
		return;
    else
        delete this.waiting;
    
    this.finishInit();
};
    
    Appl.prototype.finishInit = function(){
        this.initWofh();
        
        this.initMgrs();
        
        this.initClipboard();
	
        this.extendSnip();
        
        this.initInterfaces();
        
        this.onInited();
    };
        
        Appl.prototype.initWofh = function(){
            wofh.init();
        };
        
        Appl.prototype.initMgrs = function(){
            wndMgr.init();

            hashMgr = (new HashMgr()).init();

            sndMgr = (new SndMgr()).init();
            
            tooltipMgr = new TooltipMgr();
        };
        
        Appl.prototype.initClipboard = function(){
            var clipboard = new Clipboard('.js-clipboard-tag-block');
            
            clipboard
                    .on('success', function(e) {
                        var $status = $(e.trigger).find('.js-clipboard-status');

                        $status.html(snip.clipboardComplite());

                        setTimeout(function(){
                            $status.html('');
                        }, 500);
                    })
                    .on('error', function(e) {
                        var $textSelect = $(e.trigger).find('.js-clipboard-tag');

                        utils.textSelection($textSelect);
                    });
        };

        Appl.prototype.extendSnip = function(){
            utils.copy(snip, tmplMgr.snipet);
        };
        
        Appl.prototype.initInterfaces = function(){};
        
        Appl.prototype.onInited = function(){
            wndMgr.$head.find('script').remove();
            
            this.inited = true;
        };
        
        
Appl.prototype.isInited = function(){
	return this.inited;
};

Appl.prototype.reload = function(){
    this.reloadNow();
};

Appl.prototype.reloadNow  = function(){
	location = appl.getOriginHost() + '/' + location.search + location.hash;
};

    Appl.prototype.getOriginHost = function(){
        return appl.cnst.protocol + '//' + lib.main.domain;
    };

Appl.prototype.setLocation = function(url){
    if( wofh.platform && wofh.platform.id == 4 ){
        if(url.slice(0,4) != 'http'){
            if(url.slice(0,1) != '/'){
                url = '/'+url;
            }
            url = appl.getOriginHost()+url;
        }
		
        GC.callMethod('setFrameUrl', url);
	}
    else
		location.href = url;
};


Appl.prototype.cnst = {
	protocol: 'https:'
};

Appl.prototype.environment = {
	domain: '',
	client: false
};