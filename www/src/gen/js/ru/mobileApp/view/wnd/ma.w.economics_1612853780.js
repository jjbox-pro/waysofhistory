wEconomics.prototype.calcChildren = function(){
    this.children.strength = bTownStrength;
    
	this.children.rule = tabEconomicsRule;
	this.children.stock = tabEconomicsStock;
	this.children.prod = tabEconomicsProd;
	this.children.pop = tabEconomicsPop;
    this.children.cult = tabEconomicsCult;
	if( Account.isKnownMoney() )
		this.children.money = tabEconomicsMoney;
	this.children.info = tabEconomicsInfo;
};

wEconomics.prototype.modifyCont = function(){
	this.$topicWrp.append(snip.wrp('tabs tabs-wrp', '', 'div'));
};

wEconomics.prototype.beforeClose = function(){
    notifMgr.runEvent(Notif.ids.townUpdEconomics);
};


utils.overrideMethod(wEconomics, 'onOpenTab', function __method__(tab){
	__method__.origin.apply(this, arguments);
    
    if( tab )
        this.$topicWrp.find('.wnd-header').text(tab.tabTitle);
});





tabEconomicsRule.prototype.beforeResize = tabEconomicsRule.superclass.beforeResize;

tabEconomicsRule.prototype.afterOpenTab = tabEconomicsRule.superclass.afterOpenTab;

tabEconomicsRule.prototype.onHide = tabEconomicsRule.superclass.onHide;



utils.overrideMethod(bTownRename, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
    
    var self = this;
	
	this.wrp
		.on('focusin', '.economics-rule-rename-name', function(e){
            self.cont.addClass('-state-focused');
		})
		.on('focusout', '.economics-rule-rename-name', function(e){
            if( $(e.relatedTarget).hasClass('economics-rule-random-btn') ){
                $(this).focus();
        
                return;
            }
            
			self.cont.removeClass('-state-focused');
		});
});



utils.overrideMethod(bEconomics_budget, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
    
    this.notif.other[Notif.ids.townUpdEconomics] = function(){
        if( this.submitEnabled )
            this.setSubmitTimer(-1);
    };
});

bEconomics_budget.prototype.bindEvent = function(){
	var self = this;
	
	self.wrp
		.on('change', '.js-budget-autoinc', function(){
            self.enableSubmit();
        });
};


utils.overrideMethod(bEconomics_budget, 'submit', function __method__(){
    delete this.submitEnabled;
    
	__method__.origin.apply(this, arguments);
});

bEconomics_budget.prototype.enableSubmit = function(){
    this.submitEnabled = true;
    
    this.clearTimeout(this.submitTO);
};

bEconomics_budget.prototype.setSubmitTimer = function(delay){
    this.clearTimeout(this.submitTO);
    
    if( delay < 0 )
        this.submit();
    else
        this.submitTO = this.setTimeout(this.submit, delay||2000);
};

bEconomics_budget.prototype.onSliderStop = function(){
    if( this.submitEnabled )
        this.setSubmitTimer();
};





utils.overrideMethod(tabEconomicsStock, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
    
    this.notif.other[Notif.ids.townUpdEconomics] = function(){
        if( this.submitEnabled )
            this.setSubmitTimer(-1);
    };
});

utils.overrideMethod(tabEconomicsStock, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
    
    var self = this;
	
	this.wrp
		.on('click', '.econ-row-cons', function(e){
            if( $(e.target).hasClass('stock-resCons') )
                return;
            
            utils.animateCSS(this, 200);
            
            $(this).find('.stock-resCons').trigger('click');
		});
});


utils.overrideMethod(tabEconomicsStock, 'onConsumptionChange', function __method__(){
	__method__.origin.apply(this, arguments);
    
    this.submitEnabled = true;
    
    this.setSubmitTimer();
});

tabEconomicsStock.prototype.setSubmitTimer = function(delay){
    this.clearTimeout(this.submitTO);
    
    if( delay < 0 )
        this.submit();
    else
        this.submitTO = this.setTimeout(this.submit, delay||2000);
};

tabEconomicsStock.prototype.submit = function(){
    delete this.submitEnabled;
    
    reqMgr.setResConsumption_form(utils.urlToObj(this.cont.serialize(), true));
};





utils.overrideMethod(tabEconomicsProd, 'getData', function __method__(){
    this.prepareFormat();
    
    this.data.corruptionData = this.parent.data.corruptionData;
    
	__method__.origin.apply(this, arguments);
});

tabEconomicsProd.prototype.cacheCont = function(){
    this.$res = this.cont.find('.econ-prod-res');
};

tabEconomicsProd.prototype.afterDraw = function(){
    this.columnPerRow = 0;
};

tabEconomicsProd.prototype.makeResize = function(){
    var availWidth =    this.parent.contWrpSize.width 
                        - 105; // Ширина блока с описанием
                
    var columnPerRow = Math.floor(availWidth / 85);
    
    if( columnPerRow === this.columnPerRow )
        return;
    
    this.columnPerRow = columnPerRow;
    
    this.cont.find('.econ-prod-desc').remove();
    
    this.$res.each(function(index, el){
        if( !(index % columnPerRow) )
            $(el).before(tmplMgr.economics.prod.desc());
    });
};

tabEconomicsProd.prototype.prepareFormat = tblEconomicsProd.prototype.prepareFormat.origin;





utils.overrideMethod(tabEconomicsPop, 'getCultData', function __method__(){});

tabEconomicsPop.prototype.cacheCont = function(){
    this.$bodies = this.cont.find('.econ-pop-body');
};

tabEconomicsPop.prototype.afterContSet = function(){
    var $bodies = this.$bodies;
    
    utils.getElemSize(this.wrp, {
        callback: function(){
            $bodies.each(function(){
                $(this).css('margin-top', -($(this).outerHeight() + 10));
            });
        }
    });
};

tabEconomicsPop.prototype.bindEvent = function(){
	this.wrp.on('click', '.econ-pop-body-wrp', function(e){
        e.preventDefault();
    });
};


tabEconomicsPop.prototype.prepareFormat = tabEconomicsPop.prototype.prepareFormat.origin;





tabEconomicsCult = function(){
	tabEconomicsCult.superclass.constructor.apply(this, arguments);
};

utils.extend(tabEconomicsCult, tabEconomicsPop);


tabEconomicsCult.prototype.calcName = function(){
    this.tabTitle = 'Культура';
    
    return 'cult';
};

tabEconomicsCult.prototype.getPopData = function(){};

tabEconomicsCult.prototype.getCultData = tabEconomicsPop.prototype.getCultData.origin;





tabEconomicsMoney.prototype.cacheCont = function(){
    this.$bodies = this.cont.find('.econ-pop-body');
};

tabEconomicsMoney.prototype.afterContSet = function(){
	this.$bodies.each(function(){
        $(this).css('margin-top', -($(this).outerHeight() + 10));
    });
};

tabEconomicsMoney.prototype.bindEvent = function(){
	this.wrp.on('click', '.econ-pop-body-wrp', function(e){
        e.preventDefault();
    });
};





utils.overrideMethod(tabEconomicsInfo, 'bindEvent', function __method__(){
    __method__.origin.apply(this, arguments);
    
    var self = this;
    
    this.wrp.on('click', '.econ-info-town-collect', function(){
        var $this = $(this),
            $checkboxes = $this.closest('.econ-info-town-cont').find('.switcher-input');
        
        $checkboxes.prop('checked', false);
        
        if( $this.data('type') == 'world' )
            $checkboxes.each(function(){
                if( $(this).val() < 4 )
                    $(this).prop('checked', true);
            });
        else if( $this.data('type') == 'battle' )
            $checkboxes.each(function(){
                if( $(this).val() > 3 )
                    $(this).prop('checked', true);
            });
        else
            $checkboxes.prop('checked', true);
    });
});
