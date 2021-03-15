wCountryMoneyTrainUnits = function(id, data){
	wCountryMoneyTrainUnits.superclass.constructor.apply(this, arguments);
	
	this.parentWnd = data.parentWnd;
};
	
utils.extend(wCountryMoneyTrainUnits, Wnd);


wCountryMoneyTrainUnits.prepareData = function(parentWnd){
    return parentWnd instanceof tabMyCountryMoney ? {parentWnd: parentWnd} : false;
};   

//подготовка данных для работы окна. Вызывается один раз из родителя не зависимо от создания окна
wCountryMoneyTrainUnits.prepareParentData = function(armyData) {
    if( wofh.account.isEconomist() || wofh.account.isHead() || wofh.account.isGeneral() ) {
        armyData.trainArmy = Army.getAll().getTrainUnits();

        for (var unitId in armyData.train){
            var unitRate = armyData.train[unitId];
            if(unitRate !== null){
                unitRate = utils.fixDecimal(unitRate);
            }
            var unit = armyData.trainArmy.getElem(unitId);
            unit.rate = unitRate;
            unit.rateOld = unitRate;
        }
    } else {
        armyData.noTrainArmy = true;
        armyData.trainArmy = new Army();

        for (var unitId in armyData.train){
            var unitRate = armyData.train[unitId];
            if(unitRate !== null){
                unitRate = utils.fixDecimal(unitRate);
            }
            var unit = new Unit(+unitId);
            unit.rate = unitRate;
            unit.rateOld = unitRate;

            armyData.trainArmy.addElem(unit);
        }
    }
};


wCountryMoneyTrainUnits.prototype.calcName = function(){
    return 'cMoneyTrainUnits';
};

wCountryMoneyTrainUnits.prototype.initWndOptions = function(){
    wCountryMoneyTrainUnits.superclass.initWndOptions.apply(this, arguments);
    
    this.options.setHash = false;
};

wCountryMoneyTrainUnits.prototype.getData = function(){
    this.data = {};

    var armyData = this.parentWnd.data.taxes.budget.army;

    this.data.noArmy = armyData.noArmy;
    this.data.army = armyData.trainArmy;

    wCountryMoneyTrainUnits.superclass.getData.apply(this, arguments);
};

wCountryMoneyTrainUnits.prototype.bindEvent = function(){
    var self = this;

    this.wrp
        .on('input focusin', '.cMoneyTrainU-trainURate', function(){
            self.onInputChange($(this), true);
        })
        .on('focusout', '.cMoneyTrainU-trainURate', function(){
            self.onInputChange($(this), false);
        })
        .on('click', '.cMoneyTrainU-setDef', function(){
            var inp = $(this).parents('.tbl-tr').find('.cMoneyTrainU-trainURate');

            inp.val('0');

            self.onInputChange(inp, false);
        })
        .on('click', '.cMoneyTrainU-save', function(){
            if( self.data.canSave ){
                self.parentWnd.setTrainUnitsTaxes(self.data);

                self.close();
            }

            return false;
        });

    snip.input1Handler(this.wrp);
};

wCountryMoneyTrainUnits.prototype.afterDraw = function(){
    //таблица
    this.table = new tblCountryMoneyTrainUnits(this, this.wrp.find('.tbl-wrp'));
    this.table.toggleSort('rate');

    //пересчёт ставок по юнитам
    this.prepTable();

    this.data.wasChanged = false;
    this.checkCanSave();
    this.data.wasChanged = this.data.canSave;
};


wCountryMoneyTrainUnits.prototype.prepTable = function(){
    var self = this;

    this.wrp.find('.cMoneyTrainU-trainURate').each(function(){
        self.onInputChange($(this), false, true);
    });
};

wCountryMoneyTrainUnits.prototype.onInputChange = function(el, focus, noUnitRateSet){
    //находим юнита
    var elRow = el.parents('.cMoneyTrainU-trainU'),
        unitId = elRow.data('id'),
        unit = this.data.army.getElem(unitId);

    utils.checkInputInt(el, {max: lib.country.financeslimits.budget.unitTrain, min: 0});

    // Пишем значение
    var val = el.val()||0;

    if( !noUnitRateSet )
        unit.rate = +val;

    // Установка фокуса
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
    elRow.toggleClass('-changed', val != (unit.rateOld||0));

    this.showChange(elRow, val, unit.rateOld||0);
};

wCountryMoneyTrainUnits.prototype.showChange = function(cont, val, oldVal){
    var html = '',
        change = val - oldVal;

    if( change )
        html = snip.nobr('('+snip.coloredNum(change, {sign:true, servRound:true})+')', false, 'js-changed');

    cont.find('.cMoneyTrainU-change-wrp').html(html);

    this.checkCanSave();
};

wCountryMoneyTrainUnits.prototype.setCanSave = function(state){
    if( this.data.canSave != state ){
        this.data.canSave = state;

        this.wrp.find('.cMoneyTrainU-save').toggleClass('-disabled', !state);
    }
};

wCountryMoneyTrainUnits.prototype.checkCanSave = function(){
    this.setCanSave(!!this.wrp.find('.js-changed').length || this.data.wasChanged);
};

wCountryMoneyTrainUnits.prototype.moveWnd  = function() {
    // Центрируем окно
    if( !this.centering ){
        this.setAutoPos();

        this.centering = true;
    }
};




tblCountryMoneyTrainUnits = function(parent, cont) {
    this.tmpl = tmplMgr.cMoneyTrainUnits.table;

    tblCountryMoneyTrainUnits.superclass.constructor.apply(this, arguments);

    this.options.useScroll = true;

    this.bind();
};

    utils.extend(tblCountryMoneyTrainUnits, Table);


    tblCountryMoneyTrainUnits.prototype.prepareData = function() {
        this.data = {};
        this.data.noArmy = this.parent.data.noArmy;
        this.data.list = this.parent.data.army.clone(true).setSorted(true).getList();
    };

    tblCountryMoneyTrainUnits.prototype.getSortVal = function(unit, field, exField, unit2) {
        if (field == 'unit') return true;
        if (field == 'rate') return unit.rate||0;

        if ( unit2 ){
            var val1 = unit.isEnabled(),
                val2 = unit2.isEnabled();

            if (val1 == val2){
                val1 = unit.getEra();
                val2 = unit2.getEra();
            }

            if (val1 == val2){
                var val1 = unit.getTactic();
                var val2 = unit2.getTactic();
            }

            if (val1 == val2){
                val1 = unit.getId();
                val2 = unit2.getId();
            }

            return val2;
        }

        return -unit.id;
    };

    tblCountryMoneyTrainUnits.prototype.afterDraw = function(){
        this.parent.prepTable();

        snip.spinboxHandler(this.cont);
    };
