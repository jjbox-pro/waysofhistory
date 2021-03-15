wCountryHelps = function(id, data){
	wCountryHelps.superclass.constructor.apply(this, arguments);
	
	this.parentWnd = data.parentWnd;
};

utils.extend(wCountryHelps, Wnd);


wCountryHelps.prepareData = function(parentWnd){
	return parentWnd instanceof tabMyCountryMoney ? {parentWnd: parentWnd} : false;
};


wCountryHelps.prototype.calcName = function(){
	return 'cMoneyHelps';
};

wCountryHelps.prototype.initWndOptions = function(){
    wCountryHelps.superclass.initWndOptions.apply(this, arguments);
    
    this.options.setHash = false;
};

wCountryHelps.prototype.getData = function(){
	var accounts = [],
		subsidies = utils.clone(this.parentWnd.data.taxes.budget.subsidy),
		oldSubsidies = (wofh.country.taxes.budget||{}).subsidy||[];

	for(var account in this.parentWnd.data.accounts){
		account = this.parentWnd.data.accounts[account];

		account.subsidy = {
			sum:0
		};

		for (var subsidy in subsidies){
			var subsidy = subsidies[subsidy];

			if( account.id == subsidy.acc )
				account.subsidy = subsidy;
		}

		// Запоминаем старые значения
		account.subsidy.oldSum = 0;

		for (var subsidy in oldSubsidies){
			var subsidy = oldSubsidies[subsidy];

			if( account.id == subsidy.acc )
				account.subsidy.oldSum = subsidy.sum;
		}

		accounts.push(account);
	}
	
	this.data.accounts = accounts;
	
	wCountryHelps.superclass.getData.apply(this, arguments);
};

wCountryHelps.prototype.bindEvent = function(){
    var self = this;
    
	this.wrp
		.on('click', '.js-save', function(){
			if( self.data.canSave ){
				self.parentWnd.setHelpsTaxes(self.data.accounts);
				self.close();
			}
		})
		.on('click', '.js-close', function(){
			self.close();
		})
		.on('input focusin', '.countryHelps-subsidySum', function(){
			utils.checkInputInt(this, {max: lib.country.financeslimits.budget.subsidy, min: 0});
			
			self.onInputChange($(this), true);
		})
		.on('focusout', '.countryHelps-subsidySum', function(){
			self.onInputChange($(this), false);
		})
		.on('click', '.countryHelps-setDef', function(){
			var inp = $(this).parents('.tbl-tr').find('.countryHelps-subsidySum');

			inp.val('0');

			self.onInputChange(inp, false);
		});
		
	snip.input1Handler(this.wrp);
};

wCountryHelps.prototype.afterDraw = function(){
	this.table = new tblCountryHelps(this, this.wrp.find('.tbl-wrp'));
    this.table.toggleSort('acc');
	
	this.data.wasChanged = false;
	this.checkCanSave();
	this.data.wasChanged = this.data.canSave;
};


wCountryHelps.prototype.prepTable = function(){
	var self = this;
	
	this.wrp.find('.countryHelps-subsidySum').each(function(){
		self.onInputChange($(this), false);
	});
};

wCountryHelps.prototype.onInputChange = function(el, focus){
        //находим юнита
        var elRow = el.parents('.countryHelps-subsidy'),
			accountIndex = elRow.data('index'),
			account = this.data.accounts[accountIndex];
        
        //пишем значение
        var val = el.val();
        if(val == ''){
            account.subsidy.sum = 0;
        } else {
            if(val<0){
                val = 0;
                el.val(0);
            }
            account.subsidy.sum = +val;
        }
        
		this.clearTimeout(el[0].to);
		
        if(focus){   
            el[0].to = this.setTimeout(function(){
                this.onInputChange(el, false);
            }, 3000);
        }
		else if( el.is(":focus") ){
			el.blur();
        }
        
		val = +val;
		
		elRow.toggleClass('-changed', val != account.subsidy.oldSum);
		
		this.showSum();
		
		this.showChange(elRow, val, account.subsidy.oldSum);
    };

wCountryHelps.prototype.showChange = function(cont, val, oldVal){
	var html = '',
		change = val - oldVal;
	
	if( change )
		html = snip.nobr('('+snip.coloredNum(change, {sign:true})+')', false, 'js-changed');
	
	cont.find('.countryHelps-change-wrp').html(html);
	
	this.checkCanSave();
};

wCountryHelps.prototype.showSum = function(){
	var sum = 0;
	
	for( var account in this.data.accounts){
		sum += this.data.accounts[account].subsidy.sum;
	}
	
	this.wrp.find('.js-subsidySum').text(utils.stages(sum));
};

wCountryHelps.prototype.setCanSave = function(state){
	if( this.data.canSave != state ){
		this.data.canSave = state;

		this.wrp.find('.js-save').toggleClass('-disabled', !state);
	}
};

wCountryHelps.prototype.checkCanSave = function(){
	this.setCanSave(!!this.wrp.find('.js-changed').length || this.data.wasChanged);
};



tblCountryHelps = function(parent, cont) {
    this.tmpl = tmplMgr.cMoneyHelps.table;
    
    this.data = {};
	this.data.list = parent.data.accounts;
    
	tblCountryHelps.superclass.constructor.apply(this, arguments);
	
	this.options.useScroll = true;
	
    this.bind();
};

utils.extend(tblCountryHelps, Table);

tblCountryHelps.prototype.bind = function() {
	tblCountryHelps.superclass.bind.apply(this, arguments);
};

tblCountryHelps.prototype.getSortVal = function(account, field) {
	if (field == 'acc') return account.name.toLowerCase();
	if (field == 'sum') return account.subsidy.sum;
};

tblCountryHelps.prototype.getDefSortDir = function(field){
    return field != 'acc';
};

tblCountryHelps.prototype.afterDraw = function(){
	this.parent.prepTable();
	
	snip.spinboxHandler(this.cont);
};