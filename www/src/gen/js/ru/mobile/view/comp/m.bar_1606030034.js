Bar = function(){
    Bar.superclass.constructor.apply(this);

    this.tmplWrp = tmplMgr.bar.wrp;

    wndMgr.addBar(this);
};

utils.extend(Bar, Block);


Bar.prototype.initOptions = function(){
    Bar.superclass.initOptions.apply(this, arguments);

    this.options.__newChildInit = true;
};

Bar.prototype.isFirstDraw = function(){return true;};

Bar.prototype.getBaseType = function(){return 'bar';};

Bar.prototype.getTypeClass = function(postFix){return this.getBaseTypeClass(postFix);};

Bar.prototype.setWrp = function(){
    if( this.wrp )
        this.wrp.remove();

    this.wrp = $('<div class="'+ this.getTypeWrpClass() + ' ' + this.getTmplWrpClass() + '"></div>');

    this.setPos();

    wndMgr.cont.append(this.wrp);
};

Bar.prototype.getTmplWrpData = function(cont){
    var data = {cont: cont, bar: this};

    return data;
};

Bar.prototype.createCont = function(){
    // Получаем контент
    var cont = Bar.superclass.createCont.apply(this);

    // Оборачиваем в панельную обёртку
    if( this.tmplWrp )
        return this.tmplWrp(this.getTmplWrpData(cont));   
    else
        return cont;
};

Bar.prototype.afterContSet = function(){
    this.toggleExpand(this.getExpanded()||false, {duration: -1, forceToggle: true});
};

Bar.prototype.afterDraw = function(firstShow){
    if( firstShow )
        this.setExpand();
};

Bar.prototype.makeResize = function(){
    if( !this.wrp )
        return;

    this.setSize();

    this.setPos();

    this.toggleExpand(this.getExpanded());
};

Bar.prototype.showCont = function(){
    if( this.wrp )
        this.wrp.removeClass('-type-hidden');
};

Bar.prototype.hideCont = function(){
    if( this.wrp )
        this.wrp.addClass('-type-hidden');
};

Bar.prototype.isContHidden = function(){
    return !this.wrp || this.wrp.hasClass('-type-hidden');
};

Bar.prototype.toggleContVisibility = function(toggle){
    if( this.wrp )
        this.wrp.toggleClass('-type-visible', toggle||false);
};


Bar.prototype.close = function(){
    if( this.isExpanded() )
        this.toggleExpand(false, {callback: this.delete, lockExpand: false});
    else
        this.delete();
};

Bar.prototype.delete = function(){
    this.onRemove();

    this.clearWrp();

    this.removeWrp();

    delete wndMgr.bars[this.getName()];

    notifMgr.runEvent(Notif.ids.applResize);
};


Bar.prototype.setExpand = function(){this.toggleExpand(true);};

Bar.prototype.setSide = function(){return '';};

Bar.prototype.getSide = function(){return '';};

Bar.prototype.setSize = function(){};

Bar.prototype.setPos = function(){};

Bar.prototype.getBound = function(){
    var bound = {};

    if( !this.hasBound() )
        return bound;

    var side = this.getSide(), size = 0;

    if( side == 'top' || side == 'bottom' )
        size = this.wrp.height();
    else
        size = this.wrp.width();

    bound[side] = size;

    return bound;
};

    Bar.prototype.hasBound = function(){
        var hasBound = !this.isContHidden();

        if( !hasBound )
            return hasBound;

        hasBound = this.isExpanded();

        if( !hasBound )
            hasBound = this.isWaitingAnimation();
        
        if( hasBound )
            hasBound = !wndMgr.isKeyboardOpen();
        
        return hasBound;
    };

Bar.prototype.toggleExpand = function(expanded, opt){
    opt = opt||{};
    
    
    if( opt.lockExpand !== undefined )
        this.lockExpand = opt.lockExpand;
    else if( this.lockExpand )
        return;
    
    
    var oldExpandedState = this.isExpanded();
    
    
    if( this.checkLandscape() )
        this.landscapeExpanded = !wndMgr.isLandscape();
    else
        this.landscapeExpanded = true;
    
    
    if( expanded !== undefined )
        this.expanded = expanded;
    else
        this.expanded = !this.expanded;
    
    
    if( !opt.forceToggle && oldExpandedState === this.isExpanded() )
        return;
    
    
    this.clearTimeout(this.expandingTO);
    
    this.clearTimeout(this.expandingDelayTO);
    
    
    if( opt.duration < 0 )
        this._doExpand(opt);
    else{
        this.waitingAnimation = true;
        
        this.toggleContVisibility(this.isExpanded()); // Делаем контент видимым, чтобы содержимое подготовилось к анимации
        
        this.expandingDelayTO = this.setTimeout(function(){
            this._doExpand(opt);
        }, 50);
    }
};

    Bar.prototype._doExpand = function(opt){
        opt = opt||{};
        
        if( this.isExpanded() )
            this.showCont();
        
        this.toggleContVisibility(false);
        
        var duration = opt.duration||wndMgr.getBarAnimTime(),
            callback = opt.callback,
            onAnimationEnd = function(){
                if( this.isAnimating() )
                    wndMgr.toggleBarAnimation(false);
                
                this.animating = false;
                
                this.wrp.css('transition', '');
                
                if( !this.isExpanded() )
                    this.hideCont();
                
                this.onExpandEnd();
                
                if( callback )
                    callback.call(this);
            };
        
        if( duration < 0 ){
            this.onExpandStart();
            
            this.wrp.toggleClass('-type-expanded', this.isExpanded());
            
            onAnimationEnd.call(this);
            
            return;
        }
        
        this.waitingAnimation = false;
        
        if( !this.isAnimating() )
            wndMgr.toggleBarAnimation(true);
        
        this.animating = true;
        
        this.onExpandStart();
        
        this.wrp
                .css('transition', 'transform ' + Math.max(duration, 0) + 'ms')
                .toggleClass('-type-expanded', this.isExpanded());
        
        this.expandingTO = this.setTimeout(onAnimationEnd, duration);
    };

Bar.prototype.checkLandscape = function(){return ls.getLandscapeNoPanels(false);};

Bar.prototype.isExpanded = function(){return this.expanded && this.landscapeExpanded;};

Bar.prototype.getExpanded = function(){return this.expanded;};

Bar.prototype.isWaitingAnimation = function(){return this.waitingAnimation;};

Bar.prototype.isAnimating = function(){return this.animating;};

Bar.prototype.onExpandStart = function(){
    notifMgr.runEvent(Notif.ids.applResize);
};

Bar.prototype.onExpandEnd = function(){};