wCountryMoneyDep = function(id, data){
	wCountryMoneyDep.superclass.constructor.apply(this, arguments);
	
	this.parentWnd = data.parentWnd;
};

utils.extend(wCountryMoneyDep, Wnd);


wCountryMoneyDep.prepareData = function(parentWnd){
    return parentWnd instanceof tabMyCountryMoney ? {parentWnd:parentWnd} : false;
};   

//подготовка данных для работы окна. Вызывается один раз из родителя не зависимо от создания окна
wCountryMoneyDep.prepareParentData = function(depData) {
    depData.deposits = new DepositList();

    for (var deposit in depData.deposit){
        deposit = new Deposit(+deposit+1); // Смещаем на еденицу, что-бы исключить неизвестный (0-й местород) местород, но со списком работаем так, как если бы 0-ой был первым

        deposit.rateOld = deposit.rate = depData.deposit[deposit.getOffsetId()];

        depData.deposits.addElem(deposit);
    }
};


wCountryMoneyDep.prototype.calcName = function(){
    return 'cMoneyDep';
};

wCountryMoneyDep.prototype.initWndOptions = function(){
    wCountryMoneyDep.superclass.initWndOptions.apply(this, arguments);
    
    this.options.setHash = false;
};

wCountryMoneyDep.prototype.getData = function(){
    var depData = this.parentWnd.data.taxes.tax;

    this.data.noDep = depData.noDep;
    this.data.deposits = depData.deposits;

    wCountryMoneyDep.superclass.getData.apply(this, arguments);
};

wCountryMoneyDep.prototype.bindEvent = function(){
    var self = this;

    this.wrp
        .on('input focusin', '.cMoneyDep-depRate', function(){
        self.onInputChange($(this), true);
    })
        .on('focusout', '.cMoneyDep-depRate', function(){
            self.onInputChange($(this), false);
        })
        .on('click', '.cMoneyDep-setDef', function(){
            var inp = $(this).parents('.tbl-tr').find('.cMoneyDep-depRate');
            inp.val('0');
            self.onInputChange(inp, false);
            self.setCanSave(true);
        }) 
        .on('click', '.cMoneyDep-save', function(){
            if( self.data.canSave ){
                self.parentWnd.setDepTaxes(self.data);

                self.close();
            }

            return false;
        });

    snip.input1Handler(this.wrp);
};

wCountryMoneyDep.prototype.afterDraw = function(){
    //таблица
    this.table = new tblCountryMoneyDep(this, this.cont.find('.tbl-wrp'));
    this.table.toggleSort('rate');

    //пересчёт ставок по юнитам
    this.prepTable();

    this.data.wasChanged = false;
    this.checkCanSave();
    this.data.wasChanged = this.data.canSave;
};


wCountryMoneyDep.prototype.prepTable = function(){
    var self = this;

    this.wrp.find('.cMoneyDep-depRate').each(function(){
        self.onInputChange($(this), false);
    });
};

wCountryMoneyDep.prototype.checkDataChange = function(){
    if(!this.data.changed){
        for (var deposit in this.data.deposits.getList()){
            deposit = this.data.deposits.getElem(deposit);
            if (deposit.rate != deposit.rateOld){        
                this.data.changed = true;
                break;
            }
        }
    }

    return this.data.changed;
};

wCountryMoneyDep.prototype.onInputChange = function(el, focus){
    //находим юнита
    var elRow = el.parents('.cMoneyDep-dep'),
        depositId = elRow.data('id'),
        deposit = this.data.deposits.getElem(depositId);

    //пишем значение
    var val = el.val()||0;

    if( val < 0 ){
        val = 0;
        el.val(val);
    }
    else if( val > lib.country.financeslimits.taxes.deposit ){
        val = lib.country.financeslimits.taxes.deposit;
        el.val(val);
    }

    deposit.rate = +val;

    this.clearTimeout(el[0].to);
    if( focus ){
        el[0].to = this.setTimeout(function(){
            this.onInputChange(el, false);
        }, 3000);
    }
    else if( el.is(":focus") ){
        el.blur();
    }

    val = +val;

    //раскраски
    elRow.toggleClass('-changed', val != (deposit.rateOld||''));

    this.showChange(elRow, val, deposit.rateOld);
};

wCountryMoneyDep.prototype.showChange = function(cont, val, oldVal){
    var html = '',
        change = val - oldVal;

    if( change )
        html = snip.nobr('('+snip.coloredNum(change, {sign:true})+')', false, 'js-changed');

    cont.find('.cMoneyDep-change-wrp').html(html);

    this.checkCanSave();
};

wCountryMoneyDep.prototype.checkCanSave = function(){
    this.setCanSave(!!this.cont.find('.js-changed').length || this.data.wasChanged);
};

wCountryMoneyDep.prototype.setCanSave = function(state){
    if( this.data.canSave != state ){
        this.data.canSave = state;

        this.cont.find('.cMoneyDep-save').toggleClass('-disabled', !state);
    }
};



tblCountryMoneyDep = function(parent, cont) {
    this.tmpl = tmplMgr.cMoneyDep.table;

    tblCountryMoneyDep.superclass.constructor.apply(this, arguments);

    this.options.useScroll = true;

    this.bind();
};

    utils.extend(tblCountryMoneyDep, Table);


    tblCountryMoneyDep.prototype.prepareData = function() {
        this.data = {};
        this.data.noArmy = this.parent.data.noDep;
        this.data.list = this.parent.data.deposits.clone(true).setSorted(true).getList();
    };

    tblCountryMoneyDep.prototype.getSortVal = function(dep, field) {
        if (field == 'dep') return dep.getName().toLowerCase();
        if (field == 'rate') return dep.rate;

        return dep.id;
    };

    tblCountryMoneyDep.prototype.afterDraw = function(){
        this.parent.prepTable();

        snip.spinboxHandler(this.cont);
    };