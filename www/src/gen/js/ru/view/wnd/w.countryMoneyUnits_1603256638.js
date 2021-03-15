wCountryMoneyUnits = function(id, data){
	wCountryMoneyUnits.superclass.constructor.apply(this, arguments);
	
	this.parentWnd = data.parentWnd;
};

utils.extend(wCountryMoneyUnits, Wnd);


wCountryMoneyUnits.prepareData = function(parentWnd){
    return parentWnd instanceof tabMyCountryMoney ? {parentWnd:parentWnd} : false;
};

//подготовка данных для работы окна. Вызывается один раз из родителя не зависимо от создания окна
wCountryMoneyUnits.prepareParentData = function(armyData) {
    armyData.liveOld = armyData.live;

    if(wofh.account.isEconomist() || wofh.account.isHead() || wofh.account.isGeneral()) {
        armyData.liveuArmy = wofh.country.army.clone().diffList(wofh.country.armytraining).onlyPositive();
        for (var unitId in armyData.liveu){
            var unitRate = armyData.liveu[unitId];

            var unit = armyData.liveuArmy.getElem(unitId);
            unit.rate = unitRate;
            unit.rateOld = unitRate;
        }
    } else {
        armyData.noArmy = true;
        armyData.liveuArmy = new Army();

        for (var unitId in armyData.liveu){
            var unitRate = armyData.liveu[unitId];

            var unit = new Unit(+unitId);
            unit.rate = unitRate;
            unit.rateOld = unitRate;

            armyData.liveuArmy.addElem(unit);
        }
    }
};


wCountryMoneyUnits.prototype.calcName = function(){
    return 'cMoneyUnits';
};

wCountryMoneyUnits.prototype.initWndOptions = function(){
    wCountryMoneyUnits.superclass.initWndOptions.apply(this, arguments);
    
    this.options.setHash = false;
};

wCountryMoneyUnits.prototype.getData = function(){
    this.data = {};

    var armyData = this.parentWnd.data.taxes.budget.army;
    this.data.baseRate = armyData.live||0;
    this.data.baseRateOld = armyData.liveOld;
    this.data.noArmy = armyData.noArmy;
    this.data.army = armyData.liveuArmy.clone(true);

    wCountryMoneyUnits.superclass.getData.apply(this, arguments);
};

wCountryMoneyUnits.prototype.bindEvent = function(){
    var self = this;

    this.wrp
        .on('input', '.cMoneyUnits-baseRate', function(){
            utils.checkInputFloat(this, lib.country.financeslimits.budget.armyLive, 0, 3);

            self.data.baseRate = +$(this).val();
            if(self.data.baseRate < 0){
                self.data.baseRate = 0;

                $(this).val(self.data.baseRate);
            }
            self.calcRateSum();
            self.calcTotalSum();

            self.table.show();
        })
        .on('mousedown', '.cMoneyUnits-unitRate', function(){
            $(this).focus();
        })
        .on('focusin input', '.cMoneyUnits-unitRate', function(){
            var $el = $(this);

            utils.checkInputFloat($el, lib.country.financeslimits.budget.unitLive, 0, 3);

            if( $el.data('defrate') === '' )
                self.setUnitDefRate($el);

            self.onInputChange($el, true);          
        })
        .on('focusout', '.cMoneyUnits-unitRate', function(){
            self.onInputChange($(this), false);
        })
        .on('click', '.cMoneyUnits-setDef', function(){
            var inp = $(this).parents('.tbl-tr').find('.cMoneyUnits-unitRate');
            inp.val('');

            self.onInputChange(inp, false);
        })
        .on('click', '.cMoneyUnits-close', function(){
            if( self.data.canSave ){
                self.parentWnd.setUnitTaxes(self.data);

                self.parentWnd.data.taxes.budget.army.liveuArmy = self.data.army;

                self.close();
            }

            return false;
        });

    snip.input1Handler(this.wrp, {spinbox: {}});
};

wCountryMoneyUnits.prototype.afterDraw = function(){
    //таблица
    this.table = new tblCountryMoneyUnits(this, this.cont.find('.tbl-wrp'));
    this.table.toggleSort('rate');

    //пересчёт ставок по юнитам
    this.prepTable();

    //сумма по базовой ставке
    this.calcRateSum();
    this.calcTotalSum();

    this.data.wasChanged = false;
    this.checkCanSave();
    this.data.wasChanged = this.data.canSave;
};


wCountryMoneyUnits.prototype.checkDataChange = function(){
    return !!this.wrp.find('.js-changed').length || this.data.baseRate != this.data.baseRateOld || this.data.wasChanged;
};

wCountryMoneyUnits.prototype.getUnitDefRate = function(unit){
    return utils.servRound(this.data.baseRate * unit.getPopCost());
};

wCountryMoneyUnits.prototype.setUnitDefRate = function(el){
    //находим юнита
    var elRow = el.parents('.cMoneyUnits-unit'),
        unitId = elRow.data('id'),
        unit = this.data.army.getElem(unitId),
        defRate = this.getUnitDefRate(unit);

    if( unit.rateOld === undefined )
        unit.rateOld = defRate;

    //выставляем ставку по умолчанию
    el.val(defRate).data('defrate', defRate);
};

wCountryMoneyUnits.prototype.onInputChange = function(el, focus){
    //находим юнита
    var elRow = el.parents('.cMoneyUnits-unit'),
        unitId = elRow.data('id'),
        unit = this.data.army.getElem(unitId);

    //пишем значение
    var val = el.val();
    if(val == ''){
        delete unit.rate;
    } else {
        if(val<0){
            val = 0;
            el.val(0);
        }
        unit.rate = +val;
    }

    //установка фокуса
    this.clearTimeout(el[0].to);
    if(focus){
        el[0].to = this.setTimeout(function(){
            this.onInputChange(el, false);
        }, 3000);
    }
    else if(el.is(":focus")){
        el.blur();
    }

    //раскраски
    elRow.toggleClass('-alert', +val == 0 && val != '');
    elRow.toggleClass('-changed', +val != (unit.rateOld||''));

    //пересчёт значений
    var valShow;

    if(unit.rate == null)
        valShow = unit.getPopCost() * unit.count * this.data.baseRate;
    else
        valShow = (+unit.rate) * unit.count;

    elRow.find('.cMoneyUnits-unitSum').html(snip.defVal(utils.stages(valShow.toFixed(2))));

    //пересчёт сумм
    this.calcRateSum();
    this.calcUnitsSum();
    this.calcTotalSum();

    this.showChange(elRow, val == ''?this.getUnitDefRate(unit):+val, +unit.rateOld);
};

wCountryMoneyUnits.prototype.prepTable = function(){
    var self = this;

    this.wrp.find('.cMoneyUnits-unitRate').each(function(){
        self.onInputChange($(this), false);
    });
};

wCountryMoneyUnits.prototype.calcRateSum = function(){
    var pop = 0;
    for(var unit in this.data.army.getList()){
        unit = this.data.army.getElem(unit);
        if(unit.rate == null || unit.rate === ''){
            pop += unit.getPopCost() * unit.count;
        }
    }

    this.data.baseSum = this.data.baseRate * pop;
};

wCountryMoneyUnits.prototype.showChange = function(cont, val, oldVal){
    var html = '',
        change = val - oldVal;

    if( change )
        html = snip.nobr('('+snip.coloredNum(change, {sign:true, fixed:3})+')', false, 'js-changed');

    cont.find('.cMoneyUnits-change-wrp').html(html);

    this.checkCanSave();
};

wCountryMoneyUnits.prototype.showChangePay = function(cont, val, oldVal){
    var html = '',
        change = val - oldVal;

    if( change )
        html = snip.nobr('('+snip.coloredNum(change, {sign:true, fixed:2})+')');

    cont.find('.cMoneyUnits-changePay-wrp').html(html);
};

wCountryMoneyUnits.prototype.calcUnitsSum = function(){
    var sum = 0;
    for(var unit in this.data.army.getList()){
        unit = this.data.army.getElem(unit);

        if(unit.rate > 0)
            sum += unit.rate * unit.count;
    }

    this.data.unitsSum = sum;
};

wCountryMoneyUnits.prototype.calcTotalSum = function(){
    this.data.totalSum = this.data.baseSum + this.data.unitsSum;
    var cont = this.wrp.find('.cMoneyUnits-totalSum');

    cont.html(utils.stages(this.data.totalSum.toFixed(2)));
    cont.siblings('.cMoneyUnits-alert').toggleClass('-hidden', !this.checkDataChange());
};

wCountryMoneyUnits.prototype.checkCanSave = function(){
    this.setCanSave(this.checkDataChange());
};

wCountryMoneyUnits.prototype.setCanSave = function(state){
    if( this.data.canSave != state ){
        this.data.canSave = state;

        this.wrp.find('.cMoneyUnits-close').toggleClass('-disabled', !state);
    }
};



tblCountryMoneyUnits = function(parent, cont) {
    this.tmpl = tmplMgr.cMoneyUnits.table;

    tblCountryMoneyUnits.superclass.constructor.apply(this, arguments);

    this.options.useScroll = true;

    this.bind();
};

    utils.extend(tblCountryMoneyUnits, Table);


    tblCountryMoneyUnits.prototype.prepareData = function(unit, field) {
        this.data = {};
        this.data.noArmy = this.parent.data.noArmy;
        this.data.list = this.parent.data.army.clone(true).setSorted(true).getList();
    };

    tblCountryMoneyUnits.prototype.getSortVal = function(unit, field) {
        if (field == 'unit') return unit.count;
        if (field == 'rate') return typeof(unit.rate) == 'undefined'? -1 : unit.rate;
        if (field == 'sum') return unit.count * (typeof(unit.rate) != 'undefined'? unit.rate: this.parent.data.baseRate * unit.getPopCost());
        return unit.id;
    };

    tblCountryMoneyUnits.prototype.afterDraw = function(){
        this.parent.prepTable();

        snip.spinboxHandler(this.cont);
    };
